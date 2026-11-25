const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let mode = "invoice";
let toastTimer;

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail || response.statusText);
  }
  return response.json();
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );

const money = (value) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(value || 0);

function toast(message, isError = false) {
  const node = $("#toast");
  node.textContent = message;
  node.style.background = isError ? "#8c3b2b" : "#24211c";
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 3600);
}

function statusLabels(kind, status) {
  if (kind === "capture") return ["done", "импорт"];
  return [status === "paid" ? "paid" : "sent", status === "paid" ? "оплачено" : "в работе"];
}

function renderDocuments(documents) {
  const container = $("#documents");
  if (!documents.length) {
    container.innerHTML = '<div class="empty">Пока тихо. Вставь текст ниже — и появится первый документ.</div>';
    return;
  }
  container.innerHTML = documents.map((doc) => {
    const [pillClass, pillText] = statusLabels(doc.kind, doc.status);
    const number = `${doc.kind === "capture" ? "И" : "С"}-${String(doc.id).padStart(4, "0")}`;
    const due = doc.due_date ? `оплата до ${escapeHtml(doc.due_date)}` : escapeHtml(String(doc.created_at).slice(0, 10));
    const files = doc.kind === "invoice"
      ? `<a class="linkbtn" href="/api/documents/${doc.id}/download?key=invoice_file" target="_blank">счёт ↗</a>
         <a class="linkbtn" href="/api/documents/${doc.id}/download?key=act_file" target="_blank">акт ↗</a>`
      : `<span class="card__meta">${escapeHtml(doc.payload?.rows ?? 0)} строк</span>`;
    const excel = `<a class="linkbtn" href="/api/documents/${doc.id}/export.xlsx">Excel ↓</a>`;
    const pay = doc.kind === "invoice" && doc.status !== "paid"
      ? `<button class="linkbtn" data-paid="${doc.id}">отметить оплату</button>` : "";
    return `<article class="card">
      <div class="card__num">${number}</div>
      <div>
        <div class="card__title">${escapeHtml(doc.title)}</div>
        <div class="card__meta">${escapeHtml(doc.client_name)} · ${due}</div>
      </div>
      <div class="card__right">
        <div class="card__amount">${money(doc.amount)}</div>
        <span class="pill pill--${pillClass}">${pillText}</span>
        <div>${files}${excel}${pay}</div>
      </div>
    </article>`;
  }).join("");
}

function renderRhythm(data) {
  const container = $("#rhythm");
  const beats = [];
  for (const task of data.tasks || []) {
    beats.push(`<div class="beat beat--task">
      <span class="beat__dot"></span>
      <div><div class="beat__text">${escapeHtml(task.title)}</div>
      <div class="beat__date">${task.due_date ? `до ${escapeHtml(task.due_date)}` : "без срока"} · задача</div></div>
    </div>`);
  }
  for (const doc of data.documents || []) {
    if (doc.due_date && doc.status !== "paid" && doc.kind === "invoice") {
      beats.push(`<div class="beat">
        <span class="beat__dot"></span>
        <div><div class="beat__text">${escapeHtml(doc.client_name)} — ${money(doc.amount)}</div>
        <div class="beat__date">до ${escapeHtml(doc.due_date)} · оплата</div></div>
      </div>`);
    }
  }
  container.innerHTML = beats.length ? beats.join("") : '<div class="empty">Ритм спокойный.</div>';
}

const eventNames = {
  "document.created": "новый документ",
  "document.updated": "документ обновлён",
  "payment.received": "оплата пришла",
  "task.created": "задача записана",
  "task.done": "задача закрыта",
  "reminder.sent": "напоминание ушло",
};

function renderEvents(events) {
  $("#events").innerHTML = (events || []).map((event) => {
    const time = String(event.created_at || "").slice(11, 16);
    return `<li><time>${escapeHtml(time)}</time><span>${escapeHtml(eventNames[event.kind] || event.kind)} · ${escapeHtml(event.detail)}</span></li>`;
  }).join("") || '<li>Событий пока нет.</li>';
}

async function load() {
  try {
    const data = await api("/api/overview");
    const counts = data.counts;
    $("#stat-unpaid").textContent = counts.unpaid;
    $("#stat-overdue").textContent = counts.overdue ? `${counts.overdue} просрочено` : "просрочек нет";
    $("#stat-tasks").textContent = counts.open_tasks;
    $("#stat-docs").textContent = counts.documents;
    $("#feed-meta").textContent = `${counts.documents} документов · ${counts.pending_reminders} напоминаний`;
    renderDocuments(data.documents);
    renderRhythm(data);
    renderEvents(data.events);
  } catch (error) {
    toast(`Не загрузилось: ${error.message}`, true);
  }
}

async function markPaid(id) {
  try {
    await api(`/api/documents/${id}/paid`, { method: "POST" });
    toast("Отмечено оплаченным");
    await load();
  } catch (error) {
    toast(error.message, true);
  }
}

async function submit() {
  const input = $("#input");
  const text = input.value.trim();
  if (!text) { toast("Напиши хоть что-нибудь", true); return; }
  const endpoints = {
    invoice: ["/api/invoices", { text, due_days: 7 }],
    capture: ["/api/capture", { text }],
    task: ["/api/tasks", { text, source: "web" }],
  };
  const [path, body] = endpoints[mode];
  const button = $("#submit");
  button.disabled = true;
  $("#status").textContent = "делаем…";
  try {
    const result = await api(path, { method: "POST", body: JSON.stringify(body) });
    const messages = {
      invoice: `Счёт №${result.id} готов`,
      capture: `Импортировано строк: ${result.rows}`,
      task: `Задача #${result.id} записана`,
    };
    toast(messages[mode]);
    input.value = "";
    await load();
  } catch (error) {
    toast(error.message, true);
  } finally {
    button.disabled = false;
    $("#status").textContent = "";
  }
}

function tickClock() {
  const now = new Date();
  $("#clock").textContent = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(now);
}

$$(".mode").forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    $$(".mode").forEach((item) => item.classList.toggle("is-active", item === button));
    const placeholders = {
      invoice: "Вставь договор или переписку: клиент, сумма, срок…",
      capture: "Вставь таблицу с разделителем | или ;",
      task: "Что нужно сделать? Можно с датой: «до 25 ноября»",
    };
    $("#input").placeholder = placeholders[mode];
    $("#input").focus();
  });
});

$("#submit").addEventListener("click", submit);
$("#documents").addEventListener("click", (event) => {
  const id = event.target.dataset.paid;
  if (id) markPaid(id);
});

$("#report-btn").addEventListener("click", async () => {
  try {
    const data = await api("/api/reports/weekly");
    $("#report-text").textContent = data.text;
    $("#drawer").hidden = false;
  } catch (error) {
    toast(error.message, true);
  }
});
$("#drawer-close").addEventListener("click", () => { $("#drawer").hidden = true; });
$("#drawer").addEventListener("click", (event) => {
  if (event.target === $("#drawer")) $("#drawer").hidden = true;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") $("#drawer").hidden = true;
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); submit(); }
  if (event.key === "/" && document.activeElement !== $("#input")) {
    event.preventDefault();
    $("#input").focus();
  }
});

tickClock();
setInterval(tickClock, 30000);
load();
