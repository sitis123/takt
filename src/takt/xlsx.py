from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Any, Iterable
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipInfo, ZipFile

_XML_FORBIDDEN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]")
_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
_CONTENT = "http://schemas.openxmlformats.org/package/2006/content-types"


def _text(value: Any) -> str:
    return escape(_XML_FORBIDDEN.sub("", str(value if value is not None else "")))


def _column(index: int) -> str:
    name = ""
    while index:
        index, rest = divmod(index - 1, 26)
        name = chr(65 + rest) + name
    return name or "A"


def _worksheet(rows: Iterable[dict[str, Any]]) -> tuple[str, str]:
    materialised = list(rows)
    header = list(materialised[0].keys()) if materialised else ["Значение"]
    if not header:
        header = ["Значение"]
    lines = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        f'<worksheet xmlns="{_MAIN}">',
        f'<dimension ref="A1:{_column(len(header))}{max(1, len(materialised) + 1)}"/>',
        "<sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>",
        '<sheetFormatPr defaultRowHeight="15"/>',
        "<sheetData>",
    ]
    all_rows = [dict(zip(header, (row.get(name, "") for name in header))) for row in materialised]
    for row_index, cells in enumerate([dict(zip(header, header))] + all_rows, start=1):
        lines.append(f'<row r="{row_index}">')
        for col_index, name in enumerate(header, start=1):
            ref = f"{_column(col_index)}{row_index}"
            value = _text(cells.get(name, ""))
            lines.append(
                f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{value}</t></is></c>'
            )
        lines.append("</row>")
    lines += ["</sheetData>", "</worksheet>"]
    return "\n".join(lines), f"A1:{_column(len(header))}{max(1, len(materialised) + 1)}"


def xlsx_bytes(rows: Iterable[dict[str, Any]]) -> bytes:
    """Собирает минимальный, но корректный XLSX без внешних зависимостей."""
    sheet, _ = _worksheet(rows)
    content_types = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="{_CONTENT}">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"""
    root_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{_PKG_REL}">
<Relationship Id="rId1" Type="{_REL}/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""
    workbook = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{_MAIN}" xmlns:r="{_REL}"><sheets><sheet name="Лист1" sheetId="1" r:id="rId1"/></sheets></workbook>"""
    workbook_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{_PKG_REL}">
<Relationship Id="rId1" Type="{_REL}/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="{_REL}/styles" Target="styles.xml"/>
</Relationships>"""
    styles = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="{_MAIN}"><fonts count="1"><font/></fonts><fills count="1"><fill/></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf/></cellXfs></styleSheet>"""
    files = {
        "[Content_Types].xml": content_types,
        "_rels/.rels": root_rels,
        "xl/workbook.xml": workbook,
        "xl/_rels/workbook.xml.rels": workbook_rels,
        "xl/worksheets/sheet1.xml": sheet,
        "xl/styles.xml": styles,
    }
    buffer = io.BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
        for name, data in files.items():
            info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            archive.writestr(info, data.encode("utf-8"))
    return buffer.getvalue()


def write_xlsx(path: str | Path, rows: Iterable[dict[str, Any]]) -> Path:
    target = Path(path)
    target.write_bytes(xlsx_bytes(rows))
    return target
