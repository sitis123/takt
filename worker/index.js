const ASSETS = __TAKT_ASSETS__;

// Такт на Cloudflare Workers: один файл, без npm-зависимостей.
// Хранилище — D1 (binding env.DB). Схема совпадает со src/takt/db.py.
// Секреты и настройки читаются из env, никогда не пишутся в логи.

const SCHEMA_SQL = [
  "CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, inn TEXT, email TEXT, telegram_id INTEGER, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, client_id INTEGER REFERENCES clients(id), client_name TEXT NOT NULL, title TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'RUB', status TEXT NOT NULL DEFAULT 'draft', payload TEXT NOT NULL DEFAULT '{}', due_date TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, due_date TEXT, status TEXT NOT NULL DEFAULT 'open', source TEXT NOT NULL DEFAULT 'text', payload TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, ref_id INTEGER NOT NULL, message TEXT NOT NULL, due_at TEXT NOT NULL, sent_at TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
  "CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(sent_at, due_at)",
];

// Схему создаём лениво, один раз на изолят; при ошибке разрешаем повтор.
let schemaReady = null;

async function ensureSchema(env) {
  if (!env.DB) throw new Error("D1 binding env.DB обязателен");
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA_SQL.map((sql) => env.DB.prepare(sql)))
      .then(() => true)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

class HttpError extends Error {
  constructor(status, detail) {
    super(String(detail));
    this.status = status;
    this.detail = String(detail);
  }
}

function fail(status, detail) {
  throw new HttpError(status, detail);
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};
const WEB_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; " +
  "form-action 'self'; frame-ancestors 'none'; object-src 'none'";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...extraHeaders },
  });
}

function httpError(status, detail) {
  return json({ detail }, status);
}

function redirect(url, status = 302) {
  return new Response(null, { status, headers: { Location: url } });
}

function nowIso() {
  // Как datetime.now(timezone.utc).isoformat(timespec="seconds") в db.py.
  return `${new Date().toISOString().slice(0, 19)}+00:00`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function pad4(value) {
  return String(value).padStart(4, "0");
}

function isoDateOnly(base = new Date(), days = 0) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// --- тонкий слой D1 ----------------------------------------------------

function statement(env, sql, values = []) {
  const prepared = env.DB.prepare(sql);
  return values.length ? prepared.bind(...values.map((v) => (v === undefined ? null : v))) : prepared;
}

async function dbAll(env, sql, values = []) {
  await ensureSchema(env);
  const result = await statement(env, sql, values).all();
  return result.results || [];
}

async function dbOne(env, sql, values = []) {
  await ensureSchema(env);
  return (await statement(env, sql, values).first()) || null;
}

async function dbRun(env, sql, values = []) {
  await ensureSchema(env);
  return statement(env, sql, values).run();
}

function decodeJsonFields(row, fields) {
  if (!row) return null;
  const decoded = { ...row };
  for (const field of fields) {
    if (typeof decoded[field] === "string") {
      try {
        decoded[field] = JSON.parse(decoded[field] || "{}");
      } catch {
        decoded[field] = {};
      }
    } else if (decoded[field] == null) {
      decoded[field] = {};
    }
  }
  return decoded;
}

// --- хранилище (эквивалент Store из db.py) ----------------------------

async function addClient(env, name, inn = null, email = null, telegramId = null) {
  const result = await dbRun(
    env,
    "INSERT INTO clients(name, inn, email, telegram_id, created_at) VALUES (?,?,?,?,?)",
    [name, inn, email, telegramId, nowIso()]
  );
  return Number(result.meta.last_row_id);
}

async function findClient(env, name) {
  return dbOne(env, "SELECT * FROM clients WHERE lower(name) = lower(?) ORDER BY id DESC LIMIT 1", [name]);
}

async function getClient(env, clientId) {
  return dbOne(env, "SELECT * FROM clients WHERE id = ?", [clientId]);
}

async function logEvent(env, kind, detail) {
  await dbRun(env, "INSERT INTO events(kind, detail, created_at) VALUES (?,?,?)", [kind, String(detail), nowIso()]);
}

async function addDocument(env, fields) {
  const result = await dbRun(
    env,
    `INSERT INTO documents(kind, client_id, client_name, title, amount, currency,
                           status, payload, due_date, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      fields.kind,
      fields.client_id ?? null,
      fields.client_name,
      fields.title,
      Number(fields.amount || 0),
      fields.currency || "RUB",
      fields.status || "draft",
      JSON.stringify(fields.payload || {}),
      fields.due_date || null,
      nowIso(),
    ]
  );
  const docId = Number(result.meta.last_row_id);
  await logEvent(env, "document.created", `${fields.kind} #${docId} — ${fields.title}`);
  return docId;
}

async function updateDocument(env, docId, fields) {
  const allowed = ["status", "title", "amount", "due_date", "payload"];
  const keys = allowed.filter((key) => Object.prototype.hasOwnProperty.call(fields, key));
  if (!keys.length) return;
  const values = keys.map((key) =>
    key === "payload" ? JSON.stringify(fields[key] || {}) : fields[key] === undefined ? null : fields[key]
  );
  const assignments = keys.map((key) => `${key} = ?`).join(", ");
  await dbRun(env, `UPDATE documents SET ${assignments} WHERE id = ?`, [...values, docId]);
  await logEvent(env, "document.updated", `#${docId}: ${keys.join(", ")}`);
}

async function getDocument(env, docId) {
  return decodeJsonFields(await dbOne(env, "SELECT * FROM documents WHERE id = ?", [docId]), ["payload"]);
}

async function getDocuments(env, options = {}) {
  let sql = "SELECT * FROM documents WHERE 1=1";
  const values = [];
  if (options.status) {
    sql += " AND status = ?";
    values.push(options.status);
  }
  if (options.kind) {
    sql += " AND kind = ?";
    values.push(options.kind);
  }
  sql += " ORDER BY id DESC LIMIT ?";
  values.push(options.limit ?? 50);
  const rows = await dbAll(env, sql, values);
  return rows.map((row) => decodeJsonFields(row, ["payload"]));
}

async function addTask(env, title, dueDate = null, source = "text", payload = {}) {
  const result = await dbRun(
    env,
    "INSERT INTO tasks(title, due_date, status, source, payload, created_at) VALUES (?,?,?,?,?,?)",
    [title, dueDate || null, "open", source, JSON.stringify(payload || {}), nowIso()]
  );
  const taskId = Number(result.meta.last_row_id);
  await logEvent(env, "task.created", `#${taskId} — ${title}`);
  return taskId;
}

async function getTasks(env, status = "open", limit = 50) {
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const values = [];
  if (status) {
    sql += " AND status = ?";
    values.push(status);
  }
  sql += " ORDER BY id DESC LIMIT ?";
  values.push(limit);
  const rows = await dbAll(env, sql, values);
  return rows.map((row) => decodeJsonFields(row, ["payload"]));
}

async function closeTask(env, taskId) {
  await dbRun(env, "UPDATE tasks SET status = 'done' WHERE id = ?", [taskId]);
  await logEvent(env, "task.done", `#${taskId}`);
}

async function addReminder(env, kind, refId, message, dueAt) {
  const result = await dbRun(
    env,
    "INSERT INTO reminders(kind, ref_id, message, due_at, created_at) VALUES (?,?,?,?,?)",
    [kind, refId, String(message), dueAt, nowIso()]
  );
  return Number(result.meta.last_row_id);
}

async function dueReminders(env, limit = 50) {
  return dbAll(
    env,
    "SELECT * FROM reminders WHERE sent_at IS NULL AND due_at <= ? ORDER BY due_at LIMIT ?",
    [nowIso(), limit]
  );
}

// Атомарный захват: параллельные вызовы не отправляют одно напоминание дважды.
async function claimReminder(env, reminderId, stamp) {
  const result = await dbRun(
    env,
    "UPDATE reminders SET sent_at = ? WHERE id = ? AND sent_at IS NULL",
    [stamp, reminderId]
  );
  return Number(result.meta.changes || 0) === 1;
}

async function unclaimReminder(env, reminderId, stamp) {
  await dbRun(env, "UPDATE reminders SET sent_at = NULL WHERE id = ? AND sent_at = ?", [reminderId, stamp]);
}

async function cancelReminders(env, kind, refId) {
  await dbRun(
    env,
    "UPDATE reminders SET sent_at = ? WHERE kind = ? AND ref_id = ? AND sent_at IS NULL",
    [nowIso(), kind, refId]
  );
}

async function getEvents(env, limit = 20) {
  return dbAll(env, "SELECT * FROM events ORDER BY id DESC LIMIT ?", [limit]);
}

async function getSetting(env, key, fallback = null) {
  const row = await dbOne(env, "SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : fallback;
}

async function setSetting(env, key, value) {
  await dbRun(
    env,
    "INSERT INTO settings(key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, String(value)]
  );
}

async function deleteSetting(env, key) {
  await dbRun(env, "DELETE FROM settings WHERE key = ?", [key]);
}

async function knownChats(env) {
  const rows = await dbAll(env, "SELECT key FROM settings WHERE key LIKE 'tg_chat:%'");
  return rows.map((row) => String(row.key).slice(8)).filter(Boolean);
}

async function counts(env) {
  const [documents, unpaid, overdue, openTasks, pending] = await Promise.all([
    dbOne(env, "SELECT count(*) AS n FROM documents"),
    dbOne(env, "SELECT count(*) AS n FROM documents WHERE status != 'paid'"),
    dbOne(env, "SELECT count(*) AS n FROM documents WHERE status != 'paid' AND due_date < ?", [nowIso().slice(0, 10)]),
    dbOne(env, "SELECT count(*) AS n FROM tasks WHERE status = 'open'"),
    dbOne(env, "SELECT count(*) AS n FROM reminders WHERE sent_at IS NULL"),
  ]);
  return {
    documents: Number(documents?.n || 0),
    unpaid: Number(unpaid?.n || 0),
    overdue: Number(overdue?.n || 0),
    open_tasks: Number(openTasks?.n || 0),
    pending_reminders: Number(pending?.n || 0),
  };
}

// --- деньги и печатная форма (money.py, render.py) ---------------------

const ONES = [
  "", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять",
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать",
  "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать",
];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normaliseNumber(value) {
  const text = String(value ?? "").replace(/[\s\u00a0]/g, "").replace(",", ".");
  const number = Number(text);
  return Number.isFinite(number) ? round2(number) : 0;
}

function money(value, currency = "₽") {
  const amount = normaliseNumber(value);
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, cents] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${amount < 0 ? "-" : ""}${grouped},${cents} ${currency}`;
}

const ONES_FEMININE = ["", "одна", "две", ...ONES.slice(3)];

function underThousand(number, feminine = false) {
  const parts = [];
  const onesWords = feminine ? ONES_FEMININE : ONES;
  const hundreds = Math.floor(number / 100);
  const rest = number % 100;
  if (hundreds) parts.push(HUNDREDS[hundreds]);
  if (rest < 20) {
    if (rest) parts.push(onesWords[rest]);
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    parts.push(TENS[tens]);
    if (ones) parts.push(onesWords[ones]);
  }
  return parts.join(" ");
}

function plural(number, one, few, many) {
  const mod100 = number % 100;
  const mod10 = number % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function rublesInWords(value) {
  const amount = normaliseNumber(value);
  const absolute = Math.abs(amount);
  const rubles = Math.floor(absolute);
  const kopecks = Math.floor((absolute - rubles) * 100 + 1e-6);
  const billions = Math.floor(rubles / 1e9);
  const millions = Math.floor((rubles % 1e9) / 1e6);
  const thousands = Math.floor((rubles % 1e6) / 1000);
  const units = rubles % 1000;
  const words = [];
  if (billions) words.push(`${underThousand(billions)} ${plural(billions, "миллиард", "миллиарда", "миллиардов")}`);
  if (millions) words.push(`${underThousand(millions)} ${plural(millions, "миллион", "миллиона", "миллионов")}`);
  if (thousands) words.push(`${underThousand(thousands, true)} ${plural(thousands, "тысяча", "тысячи", "тысяч")}`);
  const rubleForm = plural(rubles, "рубль", "рубля", "рублей");
  if (!rubles && !words.length) words.push("ноль рублей");
  else words.push(units || !words.length ? `${underThousand(units)} ${rubleForm}`.trim() : rubleForm);
  words.push(`${pad2(kopecks)} ${plural(kopecks, "копейка", "копейки", "копеек")}`);
  const result = words.filter(Boolean).join(" ");
  const capitalised = result.charAt(0).toUpperCase() + result.slice(1);
  return amount < 0 ? `Минус ${capitalised}` : capitalised;
}

const PRINT_CSS = `
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
`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function renderDocumentPage(doc, client, heading, number) {
  const payload = doc.payload || {};
  const clientName = escapeHtml(client ? client.name : doc.client_name || "—");
  const inn = escapeHtml((client && client.inn) || payload.inn || "—");
  const email = escapeHtml((client && client.email) || payload.email || "—");
  const amount = Number(doc.amount || 0);
  const title = escapeHtml(doc.title || "Услуги");
  const issued = escapeHtml(String(doc.created_at || "").slice(0, 10));
  const due = escapeHtml(doc.due_date || "—");
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>${heading} №${number}</title>
<style>${PRINT_CSS}</style></head><body><div class="sheet">
  <div class="top">
    <div class="brand">ТАКТ<small>администратор вашей рутины</small></div>
    <div class="meta">№ ${escapeHtml(number)}<br>от ${issued}<br>оплата до ${due}</div>
  </div>
  <h1>${heading}</h1>
  <div class="sub">Документ сформирован автоматически и готов к подписи</div>
  <div class="grid">
    <div><div class="label">Заказчик</div><div class="value">${clientName}</div></div>
    <div><div class="label">Реквизиты</div><div class="value">ИНН ${inn}<br>${email}</div></div>
  </div>
  <table>
    <thead><tr><th>Наименование</th><th class="num">Кол-во</th><th class="num">Сумма</th></tr></thead>
    <tbody><tr><td>${title}</td><td class="num">1</td><td class="num">${money(amount)}</td></tr></tbody>
  </table>
  <div class="total"><span>Итого к оплате</span><strong>${money(amount)}</strong></div>
  <div class="words">${escapeHtml(rublesInWords(amount))}</div>
  <div class="sign"><div>Исполнитель / подпись</div><div>Заказчик / подпись</div></div>
  <div class="foot">Сформировано в Такте · ${escapeHtml(isoDateOnly())}</div>
</div></body></html>`;
}

function renderInvoiceHtml(doc, client) {
  return renderDocumentPage(doc, client, "Счёт", `С-${pad4(doc.id)}`);
}

function renderActHtml(doc, client) {
  return renderDocumentPage(doc, client, "Акт выполненных работ", `А-${pad4(doc.id)}`);
}

// --- локальный парсер (parser.py) -------------------------------------

const MONTHS = {
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
  июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
};

function cleanText(text) {
  return String(text ?? "").replace(/\r/g, "").trim();
}

function buildIso(year, month, day) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return isoDateOnly(date);
}

function normaliseDateString(raw) {
  let parts = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (parts) return buildIso(Number(parts[3]), Number(parts[2]), Number(parts[1]));
  parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (parts) return buildIso(Number(parts[1]), Number(parts[2]), Number(parts[3]));
  parts = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (parts) return buildIso(Number(parts[3]), Number(parts[2]), Number(parts[1]));
  return "";
}

function parseDate(text, base = new Date()) {
  const lowered = text.toLowerCase();
  let match = lowered.match(/через\s+(\d+)\s*(день|дня|дней)/);
  if (match) return isoDateOnly(base, Number(match[1]));
  // «послезавтра» содержит «завтра» — проверяем его раньше.
  if (lowered.includes("послезавтра")) return isoDateOnly(base, 2);
  if (lowered.includes("завтра")) return isoDateOnly(base, 1);
  for (const [name, month] of Object.entries(MONTHS)) {
    match = lowered.match(new RegExp(`(\\d{1,2})\\s+${name}`, "i"));
    if (match) {
      const iso = buildIso(base.getFullYear(), month, Number(match[1]));
      if (iso) return iso;
    }
  }
  for (const pattern of [/\d{2}\.\d{2}\.\d{4}/, /\d{4}-\d{2}-\d{2}/, /\d{2}\/\d{2}\/\d{4}/]) {
    match = text.match(pattern);
    if (match) {
      const iso = normaliseDateString(match[0]);
      if (iso) return iso;
    }
  }
  return "";
}

function parseAmount(text) {
  const patterns = [
    /(?:сумма|на\s+сумму|итого|total|₽|руб)[^\d]{0,12}([\d\s\u00a0]+(?:[.,]\d{1,2})?)/i,
    /([\d\s\u00a0]+(?:[.,]\d{1,2})?)\s*(?:₽|рубл(?:ь|я|ей))/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = normaliseNumber(match[1]);
      if (amount) return amount;
    }
  }
  const pattern = /(^|[^0-9])(\d{3,}(?:[.,]\d{1,2})?)(?![0-9A-Za-zА-Яа-яЁё])/g;
  for (const match of text.matchAll(pattern)) {
    const digits = match[2].replace(/\D/g, "");
    if (digits.length >= 10) continue; // ИНН — не сумма
    if (/инн/i.test(text.slice(Math.max(0, match.index - 14), match.index))) continue;
    return normaliseNumber(match[2]);
  }
  return 0;
}

function parseClientName(text) {
  let match = text.match(/(?:клиент|заказчик|кому|получатель|client)\s*[:\-–]\s*(.+)/i);
  if (match) return cleanText(match[1].split("\n")[0]).slice(0, 120);
  match = text.match(/(ООО|ИП|АО|ОАО)\s*[«"']?([^\n«»"']{2,60})/i);
  if (match) return cleanText(match[0]).slice(0, 120);
  const skip = ["сумма", "итого", "тема", "predmet", "реквизиты"];
  for (const line of text.split("\n")) {
    const stripped = cleanText(line);
    if (stripped && !skip.some((prefix) => stripped.toLowerCase().startsWith(prefix))) {
      return stripped.slice(0, 120);
    }
  }
  return "";
}

function parseText(text) {
  const source = cleanText(text);
  const innMatch = source.match(/(?:^|[^0-9A-Za-zА-Яа-яЁё])ИНН\s*[:\-]?\s*(\d{10,12})(?![0-9A-Za-zА-Яа-яЁё])/i);
  const emailMatch = source.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const titleMatch = source.match(/(?:тема|предмет|описание|за\s+(?:что|услуги|работы))\s*[:\-]\s*(.+)/i);
  let title = titleMatch ? cleanText(titleMatch[1].split("\n")[0]).slice(0, 160) : "";
  if (!title) {
    const firstLine = source.split("\n").map((line) => line.trim()).find(Boolean) || "";
    title = firstLine.slice(0, 160) || "Работы и услуги";
  }
  return {
    client_name: parseClientName(source),
    inn: innMatch ? innMatch[1] : "",
    email: emailMatch ? emailMatch[0] : "",
    amount: parseAmount(source),
    title,
    due_date: parseDate(source),
    raw: { length: source.length, engine: "local" },
  };
}

function parseTable(text) {
  const rows = [];
  const lines = cleanText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^[\s|:-]+$/.test(line));
  if (!lines.length) return rows;
  const separator = lines[0].includes("|") ? "|" : lines[0].includes("\t") ? "\t" : ";";
  const header = lines[0].split(separator).map((cell) => cell.trim());
  if (!header.some(Boolean)) return rows;
  for (const line of lines.slice(1)) {
    const cells = line.split(separator).map((cell) => cell.trim());
    if (!cells.some(Boolean)) continue;
    const row = {};
    header.forEach((name, index) => {
      row[name] = index < cells.length ? cells[index] : "";
    });
    rows.push(row);
  }
  return rows;
}

function cleanTaskTitle(text) {
  let result = String(text).trim();
  for (const prefix of ["напомни", "нужно", "задача", "сделай", "не забудь", "поставь задачу"]) {
    if (result.toLowerCase().startsWith(prefix)) {
      result = result.slice(prefix.length).replace(/^[\s:\-–—]+/, "");
    }
  }
  return result.slice(0, 200) || String(text).trim().slice(0, 200);
}

function csvCell(value) {
  let text = String(value ?? "");
  // Ячейка, начинающаяся с формульного символа, открывается Excel как формула.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvText(rows) {
  const header = Object.keys(rows[0]);
  const lines = [header, ...rows.map((row) => header.map((name) => row[name] ?? ""))];
  return "\uFEFF" + lines.map((cells) => cells.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

function compactTimestamp() {
  const date = new Date();
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}-${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}`;
}

// --- AI (только если заданы AI_BASE_URL и AI_API_KEY) ------------------

function aiEnabled(env) {
  return Boolean(env.AI_BASE_URL && env.AI_API_KEY);
}

function isGemini(env) {
  return /generativelanguage\.googleapis\.com/i.test(String(env.AI_BASE_URL || ""));
}

function aiModel(env, kind = "chat") {
  const fallback = isGemini(env)
    ? "gemini-2.0-flash"
    : "gpt-4o-mini";
  if (kind === "vision" && env.AI_VISION_MODEL) return String(env.AI_VISION_MODEL);
  if (kind === "chat" && env.AI_MODEL) return String(env.AI_MODEL);
  return fallback;
}

function aiUrl(env, path) {
  return `${String(env.AI_BASE_URL).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

async function aiChatJson(env, system, user, model) {
  const response = await fetch(aiUrl(env, "chat/completions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || aiModel(env),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("AI вернул не JSON");
  }
}

function aiExtractFields(env, text) {
  return aiChatJson(
    env,
    "Извлеки поля из текста договора или переписки. Верни JSON с ключами client_name, inn, email, amount (число), title, due_date (YYYY-MM-DD или пусто). Не выдумывай значения: если поля нет, поставь пустую строку или 0.",
    text
  );
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function aiVisionToText(env, bytes, mime = "image/jpeg") {
  const response = await fetch(aiUrl(env, "chat/completions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiModel(env, "vision"),
      messages: [
        {
          role: "system",
          content: "Перепиши содержимое изображения в моноширинный текст таблицы с разделителем '|'. Сохрани числа и заголовки столбцов без изменений.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Распознай таблицу." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${bytesToBase64(bytes)}` } },
          ],
        },
      ],
      temperature: 0,
    }),
  });
  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

async function aiTranscribeGemini(env, bytes) {
  const model = aiModel(env);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": env.AI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Расшифруй эту аудиозапись дословно, по-русски. Верни только текст расшифровки, без пояснений." },
            { inline_data: { mime_type: "audio/ogg", data: bytesToBase64(bytes) } },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => String(part?.text || "")).join("").trim();
  if (!text) throw new Error("Gemini вернул пустую расшифровку");
  return text;
}

async function aiTranscribe(env, bytes, filename = "voice.ogg") {
  if (isGemini(env)) return aiTranscribeGemini(env, bytes);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "audio/ogg" }), filename);
  form.append("model", env.AI_MODEL || "gpt-4o-mini");
  const response = await fetch(aiUrl(env, "audio/transcriptions"), {
    method: "POST",
    headers: { Authorization: `Bearer ${env.AI_API_KEY}` },
    body: form,
  });
  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  const data = await response.json();
  return String(data?.text ?? "");
}

async function understand(env, text) {
  const parsed = parseText(text);
  if (!aiEnabled(env)) return parsed;
  try {
    const fields = await aiExtractFields(env, text);
    for (const key of ["client_name", "inn", "email", "title"]) {
      const value = String(fields?.[key] ?? "").trim();
      if (value) parsed[key] = value.slice(0, 160);
    }
    const rawDate = String(fields?.due_date ?? "").trim();
    const validDate = normaliseDateString(rawDate);
    if (validDate) parsed.due_date = validDate;
    if (fields?.amount !== undefined && fields?.amount !== null && fields?.amount !== "") {
      const amount = Number(fields.amount);
      if (Number.isFinite(amount) && amount >= 0) parsed.amount = round2(amount);
    }
    parsed.raw.engine = "ai+local";
  } catch {
    // AI недоступен — остаётся детерминированный локальный парсер.
  }
  return parsed;
}

// --- прикладной слой (services.py) ------------------------------------

async function createInvoice(env, text, dueDays = 7) {
  const source = String(text ?? "").trim();
  if (!source) fail(400, "Нет текста для счёта");
  const parsed = await understand(env, source);
  const dueDate = normaliseDateString(parsed.due_date) || isoDateOnly(new Date(), dueDays);
  const clientName = parsed.client_name || "Клиент без названия";
  const client = await findClient(env, clientName);
  const clientId = client ? Number(client.id) : await addClient(env, clientName, parsed.inn || null, parsed.email || null);
  const docId = await addDocument(env, {
    kind: "invoice",
    title: parsed.title || "Работы и услуги",
    client_name: clientName,
    client_id: clientId,
    amount: parsed.amount,
    due_date: dueDate,
    payload: { inn: parsed.inn, email: parsed.email, source: parsed.raw.engine || "local" },
  });
  const doc = await getDocument(env, docId);
  const clientRow = await getClient(env, clientId);
  const nextPayload = {
    ...(doc?.payload || {}),
    invoice_file: `${pad4(docId)}-invoice.html`,
    act_file: `${pad4(docId)}-act.html`,
    invoice_html: renderInvoiceHtml(doc, clientRow),
    act_html: renderActHtml(doc, clientRow),
  };
  await updateDocument(env, docId, { payload: nextPayload, status: "sent" });
  await addReminder(
    env,
    "payment",
    docId,
    `Счёт №${pad4(docId)} на ${money(parsed.amount)} — оплата до ${dueDate}`,
    `${dueDate}T09:00:00+00:00`
  );
  return getDocument(env, docId);
}

async function markPaid(env, docId) {
  const doc = await getDocument(env, docId);
  if (!doc) fail(404, `Документ #${docId} не найден`);
  await updateDocument(env, docId, { status: "paid" });
  await cancelReminders(env, "payment", docId);
  await logEvent(env, "payment.received", `#${docId} — ${money(doc.amount || 0)}`);
  return getDocument(env, docId);
}

async function capture(env, text) {
  const source = String(text ?? "");
  if (!source.trim()) fail(422, "Нет данных для импорта");
  const rows = parseTable(source);
  if (!rows.length) fail(422, "Не удалось найти таблицу. Пришли строки с разделителем | или ;");
  const file = `capture-${compactTimestamp()}.csv`;
  const content = csvText(rows);
  const docId = await addDocument(env, {
    kind: "capture",
    title: `Импорт: ${rows.length} строк`,
    client_name: "—",
    status: "done",
    payload: {
      file,
      csv_text: content,
      preview: rows.slice(0, 5),
      rows: rows.length,
      table: rows.slice(0, 500),
    },
  });
  return { document_id: docId, rows: rows.length, file, csv_text: content, preview: rows.slice(0, 5) };
}

async function createTask(env, text, source = "text") {
  const clean = String(text ?? "").trim();
  if (!clean) fail(400, "Пустая задача");
  const parsed = parseText(clean);
  const title = cleanTaskTitle(clean);
  const taskId = await addTask(env, title, parsed.due_date || null, source);
  if (parsed.due_date) {
    await addReminder(env, "task", taskId, `Задача: ${title}`, `${parsed.due_date}T09:00:00+00:00`);
  }
  return { id: taskId, title, due_date: parsed.due_date, status: "open", source };
}

async function overview(env) {
  const [countData, documents, tasks, events] = await Promise.all([
    counts(env),
    getDocuments(env, { limit: 8 }),
    getTasks(env, "open", 8),
    getEvents(env, 8),
  ]);
  return { counts: countData, documents, tasks, events };
}

async function weeklyReport(env) {
  const today = isoDateOnly();
  const weekAgo = isoDateOnly(new Date(), -7);
  const docs = (await getDocuments(env, { limit: 200 })).filter(
    (doc) => doc.kind === "invoice" && String(doc.created_at || "").slice(0, 10) >= weekAgo
  );
  const paid = docs.filter((doc) => doc.status === "paid").reduce((sum, doc) => sum + Number(doc.amount || 0), 0);
  const waiting = docs.filter((doc) => doc.status !== "paid").reduce((sum, doc) => sum + Number(doc.amount || 0), 0);
  const overdue = docs.filter(
    (doc) => doc.due_date && doc.due_date < today && doc.status !== "paid"
  );
  const tasks = await getTasks(env, "open", 100);
  const lines = [
    `Отчёт за неделю · ${today.split("-").reverse().join(".")}`,
    "",
    `Счетов за неделю: ${docs.length}`,
    `Оплачено: ${money(paid)}`,
    `Ожидаем: ${money(waiting)}`,
    `Просрочено: ${overdue.length}`,
    `Открытых задач: ${tasks.length}`,
  ];
  if (overdue.length) {
    lines.push("", "Нужно напомнить:");
    for (const doc of overdue) {
      lines.push(`• #${pad4(doc.id)} ${doc.client_name} — ${money(doc.amount)} до ${doc.due_date}`);
    }
  }
  if (tasks.length) {
    lines.push("", "В работе:");
    for (const task of tasks.slice(0, 10)) {
      lines.push(`• ${task.title}${task.due_date ? ` (до ${task.due_date})` : ""}`);
    }
  }
  return lines.join("\n");
}

// --- дежурный агент: сам видит, что пора потрогать ----------------------

async function agentDigest(env) {
  const today = isoDateOnly();
  const [c, documents, tasks] = await Promise.all([
    counts(env),
    getDocuments(env, { limit: 200 }),
    getTasks(env, "open", 200),
  ]);
  const lines = [
    `Такт · дежурный обзор · ${isoDateOnly().split("-").reverse().join(".")}`,
    "",
    `Счетов: ${c.documents} · ждут оплаты: ${c.unpaid} · просрочено: ${c.overdue}`,
    `Открытых задач: ${c.open_tasks} · напоминаний в очереди: ${c.pending_reminders}`,
  ];
  const advice = [];
  const overdueDocs = documents.filter(
    (doc) => doc.due_date && doc.due_date < today && doc.status !== "paid"
  );
  if (overdueDocs.length) {
    advice.push(`Напомнить по просроченным: ${overdueDocs.slice(0, 3).map((doc) => `#${pad4(doc.id)} ${doc.client_name}`).join(", ")}`);
  }
  const dueTasks = tasks.filter((task) => task.due_date && task.due_date <= today);
  if (dueTasks.length) {
    advice.push(`Закрыть задачи с сроком сегодня: ${dueTasks.slice(0, 3).map((task) => task.title).join(", ")}`);
  }
  if (!advice.length) advice.push("Рутина под контролем — ничего не горит.");
  lines.push("", "Что сделать:", ...advice.map((item) => `• ${item}`));
  return lines.join("\n");
}

async function runAgentDigest(env, force = false) {
  const key = `agent_digest:${isoDateOnly()}`;
  if (!force && (await getSetting(env, key, ""))) return 0;
  const chats = await knownChats(env);
  if (!chats.length) return 0; // ждём /status — тогда дайджест станет некому отправлять
  const text = await agentDigest(env);
  let sent = 0;
  for (const chat of chats) {
    try {
      await sendTelegramMessage(env, chat, text);
      sent += 1;
    } catch {
      // Один недоступный чат не должен ломать остальные.
    }
  }
  if (sent) {
    await setSetting(env, key, "1");
    await logEvent(env, "agent.digest", `${sent} чат(ов)`);
  }
  return sent;
}

// --- Telegram ----------------------------------------------------------

function normaliseChatId(value) {
  const text = String(value ?? "").trim();
  return /^-?\d+$/.test(text) ? Number(text) : text;
}

async function telegramApi(env, method, body, isFile = false) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: isFile ? {} : { "Content-Type": "application/json" },
    body: isFile ? body : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  const data = await response.json();
  // Telegram возвращает 200 с ok:false, например при заблокированном боте.
  if (!data?.ok) throw new Error(`Telegram: ${String(data?.description || "не удалось отправить").slice(0, 200)}`);
  return data;
}

function sendTelegramMessage(env, chatId, text) {
  return telegramApi(env, "sendMessage", { chat_id: normaliseChatId(chatId), text: String(text) });
}

async function sendTelegramDocument(env, chatId, content, filename, caption) {
  const form = new FormData();
  form.append("chat_id", String(normaliseChatId(chatId)));
  form.append("document", new Blob([new TextEncoder().encode(String(content))], { type: "text/plain" }), filename);
  form.append("caption", String(caption));
  return telegramApi(env, "sendDocument", form, true);
}

async function telegramFileBytes(env, fileId) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const infoResponse = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  if (!infoResponse.ok) throw new Error(`Telegram HTTP ${infoResponse.status}`);
  const info = await infoResponse.json();
  const filePath = info?.result?.file_path;
  if (!filePath) throw new Error("Файл Telegram не найден");
  const fileResponse = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!fileResponse.ok) throw new Error(`Telegram HTTP ${fileResponse.status}`);
  return new Uint8Array(await fileResponse.arrayBuffer());
}

const TG_HELP = `Такт — тихий администратор рутины.

/invoice — прислать договор или переписку, получить счёт и акт
/capture — таблица текстом или фото → CSV
/task — записать задачу с напоминанием
/status — что происходит сейчас
/report — отчёт за неделю
/paid <номер> — отметить счёт оплаченным

Просто текст без команды → быстрая задача.`;

async function askMode(env, chatId, mode, prompt) {
  await setSetting(env, `tg_mode:${chatId}`, mode);
  await sendTelegramMessage(env, chatId, prompt);
}

async function handleTelegramText(env, chatId, text) {
  const key = `tg_mode:${chatId}`;
  const mode = (await getSetting(env, key, "task")) || "task";
  await deleteSetting(env, key);
  if (mode === "invoice") {
    const doc = await createInvoice(env, text);
    await sendTelegramMessage(
      env,
      chatId,
      `Счёт №${pad4(doc.id)} готов. Сумма ${Number(doc.amount || 0).toFixed(2)} ₽, оплата до ${doc.due_date}.`
    );
    if (doc?.payload?.invoice_html) {
      await sendTelegramDocument(env, chatId, doc.payload.invoice_html, `${pad4(doc.id)}-invoice.html`, "Счёт");
    }
  } else if (mode === "capture") {
    const result = await capture(env, text);
    await sendTelegramMessage(env, chatId, `Распознано строк: ${result.rows}. Файл прикладываю.`);
    await sendTelegramDocument(env, chatId, result.csv_text, result.file, "Таблица");
  } else {
    const task = await createTask(env, text, "telegram");
    const suffix = task.due_date ? ` · до ${task.due_date}` : "";
    await sendTelegramMessage(env, chatId, `Записано: ${task.title}${suffix}`);
  }
}

function telegramAllowed(env, chatId) {
  const raw = String(env.TELEGRAM_ALLOWED_CHAT_IDS || "").trim();
  if (!raw) return true;
  return raw.split(/[;,]/).map((part) => part.trim()).filter(Boolean).includes(String(chatId));
}

async function optInChat(env, chatId) {
  await setSetting(env, `tg_chat:${chatId}`, "1");
  if (!(await getSetting(env, "notify_chat_id", ""))) {
    await setSetting(env, "notify_chat_id", String(chatId));
  }
}

async function handleTelegramCommand(env, chatId, command, argument) {
  switch (command) {
    case "start":
      await optInChat(env, chatId);
      await sendTelegramMessage(env, chatId, `Привет. Я Такт. Забираю рутину у тебя — тихо и без лишних вопросов.\n\n${TG_HELP}`);
      return;
    case "help":
      await sendTelegramMessage(env, chatId, TG_HELP);
      return;
    case "invoice":
      await askMode(env, chatId, "invoice", "Пришли текст договора или переписки — сделаю счёт и акт.");
      return;
    case "capture":
      await askMode(env, chatId, "capture", "Пришли таблицу текстом (разделитель | или ;) или фото.");
      return;
    case "task":
      await askMode(env, chatId, "task", "Что нужно сделать? Можно с датой: «до 25 ноября».");
      return;
    case "status": {
      await optInChat(env, chatId);
      const data = await overview(env);
      const c = data.counts;
      await sendTelegramMessage(
        env,
        chatId,
        `Сегодня в Такте:\n• документов: ${c.documents}\n• без оплаты: ${c.unpaid} (просрочено ${c.overdue})\n• открытых задач: ${c.open_tasks}\n• ожидают напоминания: ${c.pending_reminders}`
      );
      return;
    }
    case "report":
      await sendTelegramMessage(env, chatId, await weeklyReport(env));
      return;
    case "paid": {
      if (!/^\d+$/.test(argument)) {
        await sendTelegramMessage(env, chatId, "Формат: /paid 12");
        return;
      }
      const doc = await markPaid(env, Number(argument));
      await sendTelegramMessage(env, chatId, `Счёт №${pad4(doc.id)} отмечен оплаченным.`);
      return;
    }
    default:
      await sendTelegramMessage(env, chatId, TG_HELP);
  }
}

async function handleTelegramUpdate(env, update) {
  const message = update?.message || update?.edited_message;
  const chatId = message?.chat?.id;
  if (chatId === undefined || chatId === null) return;
  if (!telegramAllowed(env, chatId)) {
    try {
      await sendTelegramMessage(env, chatId, "Этот бот закрыт для вашего чата.");
    } catch {
      // Не отвечаем посторонним, если Telegram недоступен.
    }
    return;
  }
  try {
    const text = String(message.text || message.caption || "");
    const command = text.trim().match(/^\/(\w+)(?:@[\w_]+)?\s*([\s\S]*)$/);
    if (command) {
      await handleTelegramCommand(env, chatId, command[1].toLowerCase(), (command[2] || "").trim());
      return;
    }
    if (Array.isArray(message.photo) && message.photo.length) {
      await deleteSetting(env, `tg_mode:${chatId}`);
      if (!aiEnabled(env)) {
        await sendTelegramMessage(
          env,
          chatId,
          "Не получилось распознать фото: Для распознавания фото нужен AI-провайдер (AI_BASE_URL и AI_API_KEY)"
        );
        return;
      }
      const fileId = message.photo[message.photo.length - 1]?.file_id;
      if (!fileId) return;
      const bytes = await telegramFileBytes(env, fileId);
      const recognised = await aiVisionToText(env, bytes, "image/jpeg");
      const result = await capture(env, recognised);
      await sendTelegramMessage(env, chatId, `Распознано строк: ${result.rows}. Файл прикладываю.`);
      await sendTelegramDocument(env, chatId, result.csv_text, result.file, "Таблица");
      return;
    }
    if (message.voice) {
      await deleteSetting(env, `tg_mode:${chatId}`);
      if (!aiEnabled(env)) {
        await sendTelegramMessage(env, chatId, "Расшифровка голоса недоступна: AI не настроен");
        return;
      }
      const bytes = await telegramFileBytes(env, message.voice.file_id);
      const transcript = await aiTranscribe(env, bytes, "voice.ogg");
      const task = await createTask(env, transcript, "voice");
      await sendTelegramMessage(env, chatId, `Записано из голоса: ${task.title}`);
      return;
    }
    if (text) await handleTelegramText(env, chatId, text);
  } catch (error) {
    const detail = String(error?.message || error).slice(0, 300);
    try {
      await sendTelegramMessage(env, chatId, `Не получилось: ${detail}`);
    } catch {
      // Ответ Telegram недоступен — молча завершаем, секреты не логируем.
    }
  }
}

async function flushReminders(env) {
  await ensureSchema(env);
  const chatId = await getSetting(env, "notify_chat_id", "");
  if (!chatId || !env.TELEGRAM_BOT_TOKEN) return 0;
  const reminders = await dueReminders(env, 50);
  let sent = 0;
  for (const reminder of reminders) {
    const stamp = nowIso();
    // Атомарный захват защищает от повторной отправки при параллельных вызовах.
    if (!(await claimReminder(env, reminder.id, stamp))) continue;
    try {
      await sendTelegramMessage(env, chatId, reminder.message);
      await logEvent(env, "reminder.sent", reminder.message);
      sent += 1;
    } catch {
      await unclaimReminder(env, reminder.id, stamp);
    }
  }
  return sent;
}

// --- разбор запросов и статические файлы ------------------------------

function assetResponse(key, contentType) {
  const body = ASSETS && ASSETS[key];
  if (typeof body !== "string") return httpError(404, "Файл не найден");
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": contentType, "Content-Security-Policy": WEB_CSP, ...SECURITY_HEADERS },
  });
}

function payloadFile(payload, key) {
  const files = {
    invoice_file: [payload?.invoice_file || "invoice.html", payload?.invoice_html, "text/html; charset=utf-8"],
    act_file: [payload?.act_file || "act.html", payload?.act_html, "text/html; charset=utf-8"],
    file: [payload?.file || "capture.csv", payload?.csv_text, "text/csv; charset=utf-8"],
    invoice_html: [payload?.invoice_file || "invoice.html", payload?.invoice_html, "text/html; charset=utf-8"],
    act_html: [payload?.act_file || "act.html", payload?.act_html, "text/html; charset=utf-8"],
    csv_text: [payload?.file || "capture.csv", payload?.csv_text, "text/csv; charset=utf-8"],
  };
  const found = files[key];
  if (!found || typeof found[1] !== "string" || !found[1]) return null;
  return { name: found[0], text: found[1], media: found[2] };
}

function fileResponse(file) {
  const safeName = String(file.name).replace(/["\r\n]/g, "_");
  return new Response(file.text, {
    status: 200,
    headers: {
      "Content-Type": file.media,
      "Content-Disposition": `attachment; filename="${safeName}"`,
      ...SECURITY_HEADERS,
    },
  });
}

// --- настоящий .xlsx без внешних библиотек (ZIP store + XML) --------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
    }
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034B50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local, data);

    const directory = new Uint8Array(46 + name.length);
    const directoryView = new DataView(directory.buffer);
    directoryView.setUint32(0, 0x02014B50, true);
    directoryView.setUint16(4, 20, true);
    directoryView.setUint16(6, 20, true);
    directoryView.setUint32(16, crc, true);
    directoryView.setUint32(20, data.length, true);
    directoryView.setUint32(24, data.length, true);
    directoryView.setUint16(28, name.length, true);
    directoryView.setUint32(42, offset, true);
    directory.set(name, 46);
    central.push(directory);
    offset += local.length + data.length;
  }
  const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054B50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function xmlEscape(value) {
  return String(value ?? "")
    // XML 1.0 не допускает эти символы — Excel восстановит такой файл.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseCsvText(raw) {
  const text = String(raw ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ";") {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function columnName(index) {
  let name = "";
  let number = index + 1;
  while (number > 0) {
    number -= 1;
    name = String.fromCharCode(65 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

function xlsxRows(doc) {
  const rows = [
    ["Такт — документ", "", ""],
    ["Тип", doc.kind === "invoice" ? "Счёт и акт" : "Таблица", ""],
    ["Номер", pad4(doc.id), ""],
    ["Клиент", doc.client_name || "", ""],
    ["Дата", doc.created_at || "", ""],
    ["Срок оплаты", doc.due_date || "", ""],
    ["Статус", doc.status || "", ""],
    ["Сумма, ₽", Number(doc.amount || 0), ""],
    ["", "", ""],
  ];
  const table = Array.isArray(doc.payload?.table) ? doc.payload.table : [];
  const csvRows = table.length ? [] : parseCsvText(doc.payload?.csv_text);
  if (table.length || csvRows.length) {
    rows.push(["Строки таблицы", "", ""]);
    if (table.length) {
      const header = Object.keys(table[0]);
      rows.push(header);
      for (const item of table.slice(0, 500)) rows.push(header.map((name) => item?.[name] ?? ""));
    } else {
      const width = Math.max(...csvRows.map((row) => row.length), 1);
      for (const row of csvRows) {
        rows.push(Array.from({ length: width }, (_, index) => row[index] ?? ""));
      }
    }
  }
  return rows;
}

function documentXlsx(doc) {
  const encoder = new TextEncoder();
  const rows = xlsxRows(doc);
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${reference}"><v>${value}</v></c>`;
      }
      return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const files = [
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`],
    ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Такт" sheetId="1" r:id="rId1"/></sheets>
</workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`],
    ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`],
    ["xl/worksheets/sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${sheetRows}</sheetData>
</worksheet>`],
  ].map(([name, text]) => ({ name, data: encoder.encode(text) }));
  return zipStore(files);
}

function xlsxResponse(doc) {
  const name = `takt-${pad4(doc.id)}.xlsx`;
  return new Response(documentXlsx(doc), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      ...SECURITY_HEADERS,
    },
  });
}

async function readBody(request) {
  let parsed;
  try {
    const raw = await request.text();
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    fail(422, "Некорректный JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail(422, "Ожидается JSON-объект");
  return parsed;
}

function requiredText(body) {
  const text = body?.text;
  if (typeof text !== "string" || text.length === 0) fail(422, "Поле text обязательно");
  return text;
}

function parseLimit(value) {
  if (value === null) return 50;
  const number = Number(value);
  if (!Number.isInteger(number)) fail(422, "limit должен быть целым числом");
  return Math.min(Math.max(number, 1), 200);
}

function validateChatId(body) {
  const value = body?.notify_chat_id;
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!/^-?\d+$|^@[A-Za-z0-9_]+$/.test(text)) fail(422, "Укажите notify_chat_id");
  return text;
}

async function secretsEqual(left, right) {
  const encoder = new TextEncoder();
  const [first, second] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(left))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(right))),
  ]);
  const a = new Uint8Array(first);
  const b = new Uint8Array(second);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

async function requireAdmin(request, env) {
  // Если отдельный токен не задан, используем уже существующий секрет вебхука.
  const configured = String(env.TAKT_ADMIN_TOKEN || env.TELEGRAM_WEBHOOK_SECRET || "");
  if (!configured) return httpError(503, "Админ-токен не настроен");
  const header = String(request.headers.get("Authorization") || "");
  const supplied = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : String(request.headers.get("X-Admin-Token") || "");
  if (!(await secretsEqual(supplied, configured))) return httpError(401, "Нужен административный токен");
  return null;
}

async function routeApi(request, env, url, path, method) {
  if (path === "/api/health" && method === "GET") return json({ status: "ok", product: "takt" });

  // Внутренние и админские маршруты не должны быть открытыми на workers.dev.
  if (/^\/api\/(?:agent|settings|reminders)/.test(path)) {
    const denied = await requireAdmin(request, env);
    if (denied) return denied;
  }

  if (path === "/api/overview" && method === "GET") return json(await overview(env));

  if (path === "/api/documents" && method === "GET") {
    const limit = parseLimit(url.searchParams.get("limit"));
    const status = url.searchParams.get("status") || undefined;
    const kind = url.searchParams.get("kind") || undefined;
    return json(await getDocuments(env, { limit, status, kind }));
  }

  if (path === "/api/invoices" && method === "POST") {
    const body = await readBody(request);
    const text = requiredText(body);
    let dueDays = 7;
    if (body.due_days !== undefined) {
      dueDays = Number(body.due_days);
      if (!Number.isInteger(dueDays) || dueDays < 0 || dueDays > 365) fail(422, "due_days должен быть от 0 до 365");
    }
    return json(await createInvoice(env, text, dueDays), 201);
  }

  let match = path.match(/^\/api\/documents\/(\d+)\/paid$/);
  if (match && method === "POST") return json(await markPaid(env, Number(match[1])));

  match = path.match(/^\/api\/documents\/(\d+)\/file$/);
  if (match && method === "GET") {
    const doc = await getDocument(env, Number(match[1]));
    if (!doc) return httpError(404, "Документ не найден");
    const key = url.searchParams.get("kind") === "act" ? "act_file" : "invoice_file";
    const file = payloadFile(doc.payload, key);
    if (!file) return httpError(404, "Файл документа не найден");
    return fileResponse(file);
  }

  match = path.match(/^\/api\/documents\/(\d+)\/export\.xlsx$/);
  if (match && method === "GET") {
    const doc = await getDocument(env, Number(match[1]));
    if (!doc) return httpError(404, "Документ не найден");
    return xlsxResponse(doc);
  }

  match = path.match(/^\/api\/documents\/(\d+)\/download$/);
  if (match && method === "GET") {
    const doc = await getDocument(env, Number(match[1]));
    if (!doc) return httpError(404, "Документ не найден");
    const file = payloadFile(doc.payload, url.searchParams.get("key") || "invoice_file");
    if (!file) return httpError(404, "Файл не найден");
    return fileResponse(file);
  }

  if (path === "/api/capture" && method === "POST") {
    const body = await readBody(request);
    return json(await capture(env, requiredText(body)), 201);
  }

  if (path === "/api/tasks" && method === "POST") {
    const body = await readBody(request);
    const text = requiredText(body);
    const source = typeof body.source === "string" && body.source ? body.source : "web";
    return json(await createTask(env, text, source), 201);
  }

  match = path.match(/^\/api\/tasks\/(\d+)\/done$/);
  if (match && method === "POST") {
    await closeTask(env, Number(match[1]));
    return json({ ok: true });
  }

  if (path === "/api/reports/weekly" && method === "GET") {
    return json({ text: await weeklyReport(env) });
  }

  if (path === "/api/agent/digest" && method === "GET") {
    return json({ text: await agentDigest(env) });
  }

  if (path === "/api/agent/digest/send" && method === "POST") {
    const force = url.searchParams.get("force") === "1";
    return json({ sent: await runAgentDigest(env, force) });
  }

  if (path === "/api/reminders/due" && method === "GET") {
    return json(await dueReminders(env));
  }

  if (path === "/api/reminders/flush" && method === "POST") {
    return json({ sent: await flushReminders(env) });
  }

  if (path === "/api/settings") {
    if (method === "GET") return json({ notify_chat_id: (await getSetting(env, "notify_chat_id", "")) || "" });
    if (method === "POST") {
      const body = await readBody(request);
      const chatId = validateChatId(body);
      await setSetting(env, "notify_chat_id", chatId);
      return json({ notify_chat_id: chatId });
    }
  }

  return httpError(404, "Не найдено");
}

export default {
  async fetch(request, env, ctx) {
    try {
      await ensureSchema(env);
      const url = new URL(request.url);
      const rawPath = url.pathname;
      const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
      const method = request.method.toUpperCase();

      if (path === "/") return redirect("/web/");
      if (path === "/web" || path === "/web/index.html") return assetResponse("index.html", "text/html; charset=utf-8");
      if (path === "/web/styles.css") return assetResponse("styles.css", "text/css; charset=utf-8");
      if (path === "/web/app.js") return assetResponse("app.js", "application/javascript; charset=utf-8");

      // Базовый путь вебхука: /telegram/ (с секретом — /telegram/<secret>).
      const telegram = path.match(/^\/telegram(?:\/([^/]+))?$/);
      if (telegram) {
        if (method !== "POST") return httpError(404, "Не найдено");
        const configured = String(env.TELEGRAM_WEBHOOK_SECRET || "");
        if (!configured) return httpError(404, "Не найдено");
        const supplied = telegram[1] || "";
        const header = String(request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "");
        if (!(await secretsEqual(supplied, configured))) return httpError(404, "Не найдено");
        // Telegram добавляет заголовок, если secret_token передан в setWebhook.
        if (header && !(await secretsEqual(header, configured))) return httpError(404, "Не найдено");
        let update;
        try {
          update = await request.json();
        } catch {
          return httpError(422, "Некорректный JSON");
        }
        const work = handleTelegramUpdate(env, update);
        if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(work);
        else await work;
        return new Response("ok", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }

      if (path.startsWith("/api/")) return routeApi(request, env, url, path, method);
      return httpError(404, "Не найдено");
    } catch (error) {
      if (error instanceof HttpError) return httpError(error.status, error.detail);
      return httpError(500, "Внутренняя ошибка");
    }
  },

  async scheduled(event, env, ctx) {
    // Вызывается Cloudflare Cron (рекомендуется раз в минуту).
    try {
      await flushReminders(env);
    } catch {
      // Никаких логов с токенами и секретами.
    }
    const now = new Date();
    if (now.getUTCHours() === 9 && now.getUTCMinutes() < 5) {
      try {
        await runAgentDigest(env);
      } catch {
        // Утренний обзор не должен мешать напоминаниям.
      }
    }
  },
};
