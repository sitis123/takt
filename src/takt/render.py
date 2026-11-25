from __future__ import annotations

from datetime import date
from html import escape
from typing import Any

from .money import money, rubles_in_words

_CSS = """
:root { --ink:#211e19; --muted:#6f685e; --paper:#fbf7ef; --rule:#ded5c5;
        --accent:#b4563a; --sage:#66765d; }
* { box-sizing:border-box; }
body { margin:0; padding:48px 8vw; background:var(--paper); color:var(--ink);
       font:15px/1.6 Georgia,'Times New Roman',serif; }
.sheet { max-width:820px; margin:0 auto; }
.top { display:flex; justify-content:space-between; align-items:flex-start; gap:24px;
       border-bottom:2px solid var(--ink); padding-bottom:18px; }
.brand { font:700 26px/1 Georgia,serif; letter-spacing:.16em; }
.brand small { display:block; margin-top:8px; font:11px/1.4 system-ui,sans-serif;
       letter-spacing:.08em; color:var(--muted); text-transform:uppercase; }
.meta { text-align:right; font-size:13px; color:var(--muted); }
h1 { margin:38px 0 6px; font-size:30px; font-weight:400; letter-spacing:-.01em; }
.sub { color:var(--muted); margin-bottom:34px; }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin:28px 0 38px; }
.label { font:11px/1.4 system-ui,sans-serif; text-transform:uppercase;
         letter-spacing:.1em; color:var(--muted); margin-bottom:6px; }
.value { font-size:16px; }
table { width:100%; border-collapse:collapse; margin:24px 0; }
th { text-align:left; font:11px/1.4 system-ui,sans-serif; text-transform:uppercase;
     letter-spacing:.1em; color:var(--muted); border-bottom:1px solid var(--rule);
     padding:10px 0; }
td { padding:14px 0; border-bottom:1px solid var(--rule); vertical-align:top; }
td.num, th.num { text-align:right; white-space:nowrap; }
.total { display:flex; justify-content:space-between; align-items:baseline;
         border-top:2px solid var(--ink); padding-top:16px; margin-top:8px; }
.total strong { font-size:24px; font-weight:400; }
.words { color:var(--muted); font-style:italic; margin-top:10px; font-size:14px; }
.sign { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:64px;
        font-size:13px; color:var(--muted); }
.sign div { border-top:1px solid var(--ink); padding-top:8px; }
.foot { margin-top:56px; padding-top:14px; border-top:1px solid var(--rule);
        font:11px/1.5 system-ui,sans-serif; color:var(--muted); }
@media print { body { padding:0; background:#fff; } }
"""


def _page(doc: dict[str, Any], client: dict[str, Any] | None, heading: str, number: str) -> str:
    client_name = escape(client["name"] if client else doc.get("client_name", "—"))
    inn = escape((client or {}).get("inn") or doc.get("payload", {}).get("inn") or "—")
    email = escape((client or {}).get("email") or doc.get("payload", {}).get("email") or "—")
    amount = float(doc.get("amount") or 0)
    title = escape(doc.get("title") or "Услуги")
    issued = escape(str(doc.get("created_at", "")[:10]))
    due = escape(str(doc.get("due_date") or "—"))
    return f"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>{heading} №{number}</title>
<style>{_CSS}</style></head><body><div class="sheet">
  <div class="top">
    <div class="brand">ТАКТ<small>администратор вашей рутины</small></div>
    <div class="meta">№ {escape(number)}<br>от {issued}<br>оплата до {due}</div>
  </div>
  <h1>{heading}</h1>
  <div class="sub">Документ сформирован автоматически и готов к подписи</div>
  <div class="grid">
    <div><div class="label">Заказчик</div><div class="value">{client_name}</div></div>
    <div><div class="label">Реквизиты</div><div class="value">ИНН {inn}<br>{email}</div></div>
  </div>
  <table>
    <thead><tr><th>Наименование</th><th class="num">Кол-во</th><th class="num">Сумма</th></tr></thead>
    <tbody><tr><td>{title}</td><td class="num">1</td><td class="num">{money(amount)}</td></tr></tbody>
  </table>
  <div class="total"><span>Итого к оплате</span><strong>{money(amount)}</strong></div>
  <div class="words">{escape(rubles_in_words(amount))}</div>
  <div class="sign"><div>Исполнитель / подпись</div><div>Заказчик / подпись</div></div>
  <div class="foot">Сформировано в Такте · {escape(date.today().isoformat())}</div>
</div></body></html>"""


def invoice_html(doc: dict[str, Any], client: dict[str, Any] | None) -> str:
    return _page(doc, client, "Счёт", f"С-{doc['id']:04d}")


def act_html(doc: dict[str, Any], client: dict[str, Any] | None) -> str:
    return _page(doc, client, "Акт выполненных работ", f"А-{doc['id']:04d}")
