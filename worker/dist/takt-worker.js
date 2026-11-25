const ASSETS = {"index.html": "<!doctype html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Такт — администратор рутины</title>\n  <link rel=\"stylesheet\" href=\"/web/styles.css\">\n</head>\n<body>\n  <div class=\"grain\" aria-hidden=\"true\"></div>\n\n  <header class=\"topbar\">\n    <div class=\"brand\">\n      <span class=\"brand__mark\">ТАКТ</span>\n      <span class=\"brand__note\">тихий администратор рутины</span>\n    </div>\n    <div class=\"topbar__right\">\n      <span class=\"pulse\"><i></i> работает без тебя</span>\n      <button class=\"btn btn--ghost\" id=\"report-btn\">Отчёт за неделю</button>\n    </div>\n  </header>\n\n  <main class=\"layout\">\n    <section class=\"rail\" aria-label=\"Сводка\">\n      <div class=\"rail__title\">Сегодня</div>\n      <div class=\"stat stat--ink\">\n        <span class=\"stat__num\" id=\"stat-unpaid\">—</span>\n        <span class=\"stat__label\">ждут оплаты</span>\n        <span class=\"stat__hint\" id=\"stat-overdue\">просрочек нет</span>\n      </div>\n      <div class=\"stat stat--sage\">\n        <span class=\"stat__num\" id=\"stat-tasks\">—</span>\n        <span class=\"stat__label\">открытых задач</span>\n        <span class=\"stat__hint\">записано и не забыто</span>\n      </div>\n      <div class=\"stat stat--gold\">\n        <span class=\"stat__num\" id=\"stat-docs\">—</span>\n        <span class=\"stat__label\">документов всего</span>\n        <span class=\"stat__hint\">счета, акты, импорты</span>\n      </div>\n      <div class=\"rail__note\" id=\"clock\">—</div>\n    </section>\n\n    <section class=\"feed\">\n      <div class=\"section-head\">\n        <h1>Поток дел</h1>\n        <span class=\"section-head__meta\" id=\"feed-meta\">загружаем…</span>\n      </div>\n      <div class=\"cards\" id=\"documents\"></div>\n    </section>\n\n    <aside class=\"side\">\n      <div class=\"section-head section-head--small\">\n        <h2>Ритм</h2>\n        <span class=\"section-head__meta\">напоминания и задачи</span>\n      </div>\n      <div class=\"rhythm\" id=\"rhythm\"></div>\n      <div class=\"events\">\n        <div class=\"events__title\">Что случилось только что</div>\n        <ol id=\"events\"></ol>\n      </div>\n    </aside>\n  </main>\n\n  <section class=\"composer\" aria-label=\"Быстрый ввод\">\n    <div class=\"composer__inner\">\n      <div class=\"modes\" role=\"tablist\">\n        <button class=\"mode is-active\" data-mode=\"invoice\" role=\"tab\">Счёт и акт</button>\n        <button class=\"mode\" data-mode=\"capture\" role=\"tab\">Таблица</button>\n        <button class=\"mode\" data-mode=\"task\" role=\"tab\">Задача</button>\n      </div>\n      <div class=\"composer__row\">\n        <textarea id=\"input\" rows=\"2\" placeholder=\"Вставь договор, переписку, таблицу или просто скажи, что нужно сделать…\"></textarea>\n        <button class=\"btn btn--primary\" id=\"submit\">Отпустить <span>↵</span></button>\n      </div>\n      <div class=\"composer__foot\">\n        <span id=\"hint\">Ctrl+Enter — отправить · / — фокус</span>\n        <span id=\"status\" aria-live=\"polite\"></span>\n      </div>\n    </div>\n  </section>\n\n  <div class=\"drawer\" id=\"drawer\" hidden>\n    <div class=\"drawer__sheet\">\n      <button class=\"drawer__close\" id=\"drawer-close\" aria-label=\"Закрыть\">×</button>\n      <div class=\"drawer__title\">Отчёт за неделю</div>\n      <pre id=\"report-text\"></pre>\n    </div>\n  </div>\n\n  <div class=\"toast\" id=\"toast\" hidden></div>\n  <script src=\"/web/app.js\"></script>\n</body>\n</html>\n", "styles.css": ":root {\n  --paper: #f3ede2;\n  --paper-2: #fbf7ef;\n  --ink: #24211c;\n  --muted: #7b7367;\n  --rule: #ded4c2;\n  --accent: #b6553a;\n  --sage: #66775d;\n  --gold: #a98435;\n  --shadow: 0 18px 40px -28px rgba(45, 35, 24, .55);\n  --spring: cubic-bezier(.18, .89, .32, 1.28);\n}\n\n* { box-sizing: border-box; }\n\nhtml, body { min-height: 100%; }\n\nbody {\n  margin: 0;\n  padding-bottom: 210px;\n  background: var(--paper);\n  color: var(--ink);\n  font: 15px/1.55 -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n  -webkit-font-smoothing: antialiased;\n}\n\n.grain {\n  position: fixed;\n  inset: 0;\n  z-index: 10;\n  pointer-events: none;\n  opacity: .32;\n  mix-blend-mode: multiply;\n  background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\");\n}\n\n.topbar {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 34px clamp(20px, 4vw, 64px) 22px;\n  border-bottom: 1px solid var(--rule);\n}\n\n.brand { display: flex; flex-direction: column; gap: 4px; }\n.brand__mark {\n  font: 400 40px/1 Georgia, serif;\n  letter-spacing: .22em;\n  transform: translateY(2px);\n}\n.brand__note {\n  font-size: 11px;\n  letter-spacing: .13em;\n  text-transform: uppercase;\n  color: var(--muted);\n}\n\n.topbar__right { display: flex; align-items: center; gap: 22px; }\n.pulse {\n  display: inline-flex;\n  align-items: center;\n  gap: 9px;\n  font-size: 12px;\n  color: var(--muted);\n}\n.pulse i {\n  width: 8px; height: 8px;\n  border-radius: 50%;\n  background: var(--sage);\n  box-shadow: 0 0 0 0 rgba(102, 119, 93, .45);\n  animation: breathe 3.2s infinite;\n}\n@keyframes breathe {\n  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 119, 93, .45); }\n  50% { box-shadow: 0 0 0 7px rgba(102, 119, 93, 0); }\n}\n\n.btn {\n  font: 600 12px/1 inherit;\n  letter-spacing: .06em;\n  border: 1px solid var(--ink);\n  border-radius: 999px;\n  padding: 11px 18px;\n  background: var(--paper-2);\n  color: var(--ink);\n  cursor: pointer;\n  transition: transform .22s var(--spring), box-shadow .22s ease, background .22s ease;\n  box-shadow: 0 3px 0 rgba(36, 33, 28, .14);\n}\n.btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 rgba(36, 33, 28, .12); }\n.btn:active { transform: translateY(2px); box-shadow: 0 0 0 rgba(0, 0, 0, 0); }\n.btn--ghost { border-color: var(--rule); background: transparent; color: var(--muted); }\n.btn--primary {\n  background: var(--ink);\n  color: var(--paper-2);\n  border-color: var(--ink);\n  padding: 14px 22px;\n  font-size: 13px;\n  white-space: nowrap;\n}\n.btn--primary span { opacity: .55; margin-left: 6px; }\n\n.layout {\n  display: grid;\n  grid-template-columns: 230px minmax(0, 1fr) 290px;\n  gap: clamp(18px, 3vw, 42px);\n  padding: 42px clamp(20px, 4vw, 64px) 60px;\n  align-items: start;\n}\n\n.rail { display: flex; flex-direction: column; gap: 16px; }\n.rail__title, .section-head__meta, .events__title {\n  font-size: 11px;\n  letter-spacing: .14em;\n  text-transform: uppercase;\n  color: var(--muted);\n}\n.rail__title { margin-bottom: 2px; }\n\n.stat {\n  position: relative;\n  overflow: hidden;\n  padding: 20px 18px 18px;\n  border-radius: 18px 22px 16px 20px;\n  background: var(--paper-2);\n  border: 1px solid var(--rule);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), var(--shadow);\n  transition: transform .3s var(--spring);\n}\n.stat:hover { transform: translateY(-3px) rotate(-.4deg); }\n.stat::after {\n  content: \"\";\n  position: absolute;\n  right: -18px; top: -18px;\n  width: 70px; height: 70px;\n  border-radius: 50%;\n  border: 1px solid currentColor;\n  opacity: .12;\n}\n.stat--ink { color: var(--accent); }\n.stat--sage { color: var(--sage); }\n.stat--gold { color: var(--gold); }\n.stat__num {\n  display: block;\n  font: 400 46px/.95 Georgia, serif;\n  letter-spacing: -.03em;\n}\n.stat__label {\n  display: block;\n  margin: 10px 0 4px;\n  font-size: 13px;\n  color: var(--ink);\n}\n.stat__hint { display: block; font-size: 11px; color: var(--muted); }\n.rail__note {\n  margin-top: 6px;\n  font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace;\n  color: var(--muted);\n}\n\n.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }\n.section-head h1 { margin: 0; font: 400 34px/1 Georgia, serif; letter-spacing: -.015em; }\n.section-head h2 { margin: 0; font: 400 24px/1 Georgia, serif; }\n.section-head--small { margin-bottom: 16px; }\n\n.cards { display: flex; flex-direction: column; gap: 12px; }\n.card {\n  position: relative;\n  display: grid;\n  grid-template-columns: 62px 1fr auto;\n  gap: 16px;\n  align-items: center;\n  padding: 16px 18px;\n  border: 1px solid var(--rule);\n  border-radius: 14px 18px 14px 16px;\n  background: var(--paper-2);\n  box-shadow: var(--shadow);\n  transition: transform .25s var(--spring), border-color .25s ease;\n}\n.card:hover { transform: translateX(4px); border-color: #c9bba3; }\n.card__num {\n  font: 12px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace;\n  color: var(--muted);\n}\n.card__title { font-size: 15px; }\n.card__meta { font-size: 12px; color: var(--muted); margin-top: 3px; }\n.card__right { text-align: right; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }\n.card__amount { font: 18px/1 Georgia, serif; white-space: nowrap; }\n.pill {\n  display: inline-block;\n  padding: 4px 9px;\n  border-radius: 999px;\n  font-size: 10px;\n  letter-spacing: .08em;\n  text-transform: uppercase;\n  border: 1px solid currentColor;\n}\n.pill--sent { color: var(--accent); }\n.pill--paid { color: var(--sage); }\n.pill--draft, .pill--done { color: var(--muted); }\n.linkbtn {\n  border: 0; background: none; padding: 0;\n  font: 600 11px/1 inherit; color: var(--accent);\n  cursor: pointer; letter-spacing: .04em;\n}\n.linkbtn:hover { text-decoration: underline; }\n\n.side { display: flex; flex-direction: column; gap: 24px; }\n.rhythm { display: flex; flex-direction: column; gap: 9px; }\n.beat {\n  display: flex; gap: 12px; align-items: flex-start;\n  padding: 12px 14px;\n  border-left: 2px solid var(--gold);\n  background: rgba(251, 247, 239, .65);\n  border-radius: 0 12px 12px 0;\n}\n.beat__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); margin-top: 7px; flex: none; }\n.beat__text { font-size: 13px; }\n.beat__date { font-size: 11px; color: var(--muted); margin-top: 3px; }\n.beat--task { border-left-color: var(--sage); }\n.beat--task .beat__dot { background: var(--sage); }\n\n.events ol { list-style: none; margin: 10px 0 0; padding: 0; }\n.events li {\n  display: flex; gap: 9px; padding: 7px 0;\n  border-bottom: 1px dashed var(--rule);\n  font-size: 12px; color: var(--muted);\n}\n.events li time { font: 11px/1.5 ui-monospace, Consolas, monospace; opacity: .7; flex: none; }\n\n.composer {\n  position: fixed;\n  left: 0; right: 0; bottom: 0;\n  z-index: 8;\n  padding: 18px clamp(20px, 4vw, 64px) 22px;\n  background: linear-gradient(180deg, rgba(243, 237, 226, 0), var(--paper) 22%);\n}\n.composer__inner {\n  max-width: 1120px;\n  margin: 0 auto;\n  padding: 16px 18px 12px;\n  border: 1px solid #cfc3ae;\n  border-radius: 20px 24px 18px 22px;\n  background: var(--paper-2);\n  box-shadow: 0 -10px 50px -30px rgba(40, 30, 20, .6), inset 0 1px 0 #fff;\n}\n.modes { display: flex; gap: 6px; margin-bottom: 12px; }\n.mode {\n  border: 1px solid transparent;\n  background: transparent;\n  padding: 7px 13px;\n  border-radius: 999px;\n  font: 600 11px/1 inherit;\n  letter-spacing: .06em;\n  color: var(--muted);\n  cursor: pointer;\n  transition: all .2s ease;\n}\n.mode:hover { color: var(--ink); }\n.mode.is-active {\n  background: var(--ink); color: var(--paper-2);\n  transform: translateY(-1px);\n  box-shadow: 0 3px 0 rgba(36, 33, 28, .16);\n}\n.composer__row { display: flex; gap: 12px; align-items: stretch; }\ntextarea {\n  flex: 1;\n  resize: none;\n  min-height: 58px;\n  padding: 13px 15px;\n  border: 1px solid var(--rule);\n  border-radius: 12px 15px 12px 14px;\n  background: #fffdf8;\n  color: var(--ink);\n  font: 14px/1.5 inherit;\n  outline: none;\n  transition: border-color .2s, box-shadow .2s;\n}\ntextarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(182, 85, 58, .12); }\n.composer__foot {\n  display: flex; justify-content: space-between;\n  margin-top: 9px; font-size: 11px; color: var(--muted);\n}\n\n.drawer { position: fixed; inset: 0; z-index: 20; background: rgba(30, 26, 20, .42); backdrop-filter: blur(3px); }\n.drawer__sheet {\n  position: absolute; right: 0; top: 0; bottom: 0;\n  width: min(520px, 92vw);\n  padding: 42px 34px;\n  background: var(--paper-2);\n  box-shadow: -20px 0 60px -30px rgba(0, 0, 0, .5);\n  animation: slide .32s var(--spring);\n}\n@keyframes slide { from { transform: translateX(30px); opacity: .4; } }\n.drawer__close { position: absolute; top: 18px; right: 22px; border: 0; background: none; font-size: 28px; cursor: pointer; color: var(--muted); }\n.drawer__title { font: 400 26px/1 Georgia, serif; margin-bottom: 22px; }\n.drawer pre { white-space: pre-wrap; font: 13px/1.7 ui-monospace, Consolas, monospace; color: var(--ink); }\n\n.toast {\n  position: fixed; left: 50%; bottom: 200px; z-index: 30;\n  transform: translateX(-50%);\n  padding: 12px 20px;\n  border-radius: 999px;\n  background: var(--ink); color: var(--paper-2);\n  font-size: 13px;\n  box-shadow: 0 14px 30px -16px rgba(0, 0, 0, .6);\n  animation: rise .3s var(--spring);\n}\n@keyframes rise { from { transform: translate(-50%, 12px); opacity: 0; } }\n\n.empty { padding: 30px; text-align: center; color: var(--muted); font-size: 13px; border: 1px dashed var(--rule); border-radius: 16px; }\n\n@media (max-width: 1100px) {\n  .layout { grid-template-columns: 190px minmax(0, 1fr); }\n  .side { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; }\n  .side > * { flex: 1 1 260px; }\n}\n@media (max-width: 720px) {\n  body { padding-bottom: 240px; }\n  .layout { grid-template-columns: 1fr; }\n  .rail { flex-direction: row; flex-wrap: wrap; }\n  .stat { flex: 1 1 140px; }\n  .topbar { align-items: flex-start; flex-direction: column; }\n  .card { grid-template-columns: 48px 1fr; }\n  .card__right { grid-column: 2; align-items: flex-start; }\n  .composer__row { flex-direction: column; }\n  .btn--primary { align-self: flex-end; }\n}\n", "app.js": "const $ = (selector) => document.querySelector(selector);\nconst $$ = (selector) => Array.from(document.querySelectorAll(selector));\n\nlet mode = \"invoice\";\nlet toastTimer;\n\nasync function api(path, options = {}) {\n  const response = await fetch(path, {\n    headers: { \"Content-Type\": \"application/json\" },\n    ...options,\n  });\n  if (!response.ok) {\n    const body = await response.json().catch(() => ({ detail: response.statusText }));\n    throw new Error(body.detail || response.statusText);\n  }\n  return response.json();\n}\n\nconst escapeHtml = (value) =>\n  String(value ?? \"\").replace(/[&<>\"']/g, (char) =>\n    ({ \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" })[char]\n  );\n\nconst money = (value) =>\n  new Intl.NumberFormat(\"ru-RU\", { style: \"currency\", currency: \"RUB\", maximumFractionDigits: 2 }).format(value || 0);\n\nfunction toast(message, isError = false) {\n  const node = $(\"#toast\");\n  node.textContent = message;\n  node.style.background = isError ? \"#8c3b2b\" : \"#24211c\";\n  node.hidden = false;\n  clearTimeout(toastTimer);\n  toastTimer = setTimeout(() => { node.hidden = true; }, 3600);\n}\n\nfunction statusLabels(kind, status) {\n  if (kind === \"capture\") return [\"done\", \"импорт\"];\n  return [status === \"paid\" ? \"paid\" : \"sent\", status === \"paid\" ? \"оплачено\" : \"в работе\"];\n}\n\nfunction renderDocuments(documents) {\n  const container = $(\"#documents\");\n  if (!documents.length) {\n    container.innerHTML = '<div class=\"empty\">Пока тихо. Вставь текст ниже — и появится первый документ.</div>';\n    return;\n  }\n  container.innerHTML = documents.map((doc) => {\n    const [pillClass, pillText] = statusLabels(doc.kind, doc.status);\n    const number = `${doc.kind === \"capture\" ? \"И\" : \"С\"}-${String(doc.id).padStart(4, \"0\")}`;\n    const due = doc.due_date ? `оплата до ${escapeHtml(doc.due_date)}` : escapeHtml(String(doc.created_at).slice(0, 10));\n    const files = doc.kind === \"invoice\"\n      ? `<a class=\"linkbtn\" href=\"/api/documents/${doc.id}/download?key=invoice_file\" target=\"_blank\">счёт ↗</a>\n         <a class=\"linkbtn\" href=\"/api/documents/${doc.id}/download?key=act_file\" target=\"_blank\">акт ↗</a>`\n      : `<span class=\"card__meta\">${escapeHtml(doc.payload?.rows ?? 0)} строк</span>`;\n    const pay = doc.kind === \"invoice\" && doc.status !== \"paid\"\n      ? `<button class=\"linkbtn\" data-paid=\"${doc.id}\">отметить оплату</button>` : \"\";\n    return `<article class=\"card\">\n      <div class=\"card__num\">${number}</div>\n      <div>\n        <div class=\"card__title\">${escapeHtml(doc.title)}</div>\n        <div class=\"card__meta\">${escapeHtml(doc.client_name)} · ${due}</div>\n      </div>\n      <div class=\"card__right\">\n        <div class=\"card__amount\">${money(doc.amount)}</div>\n        <span class=\"pill pill--${pillClass}\">${pillText}</span>\n        <div>${files}${pay}</div>\n      </div>\n    </article>`;\n  }).join(\"\");\n}\n\nfunction renderRhythm(data) {\n  const container = $(\"#rhythm\");\n  const beats = [];\n  for (const task of data.tasks || []) {\n    beats.push(`<div class=\"beat beat--task\">\n      <span class=\"beat__dot\"></span>\n      <div><div class=\"beat__text\">${escapeHtml(task.title)}</div>\n      <div class=\"beat__date\">${task.due_date ? `до ${escapeHtml(task.due_date)}` : \"без срока\"} · задача</div></div>\n    </div>`);\n  }\n  for (const doc of data.documents || []) {\n    if (doc.due_date && doc.status !== \"paid\" && doc.kind === \"invoice\") {\n      beats.push(`<div class=\"beat\">\n        <span class=\"beat__dot\"></span>\n        <div><div class=\"beat__text\">${escapeHtml(doc.client_name)} — ${money(doc.amount)}</div>\n        <div class=\"beat__date\">до ${escapeHtml(doc.due_date)} · оплата</div></div>\n      </div>`);\n    }\n  }\n  container.innerHTML = beats.length ? beats.join(\"\") : '<div class=\"empty\">Ритм спокойный.</div>';\n}\n\nconst eventNames = {\n  \"document.created\": \"новый документ\",\n  \"document.updated\": \"документ обновлён\",\n  \"payment.received\": \"оплата пришла\",\n  \"task.created\": \"задача записана\",\n  \"task.done\": \"задача закрыта\",\n  \"reminder.sent\": \"напоминание ушло\",\n};\n\nfunction renderEvents(events) {\n  $(\"#events\").innerHTML = (events || []).map((event) => {\n    const time = String(event.created_at || \"\").slice(11, 16);\n    return `<li><time>${escapeHtml(time)}</time><span>${escapeHtml(eventNames[event.kind] || event.kind)} · ${escapeHtml(event.detail)}</span></li>`;\n  }).join(\"\") || '<li>Событий пока нет.</li>';\n}\n\nasync function load() {\n  try {\n    const data = await api(\"/api/overview\");\n    const counts = data.counts;\n    $(\"#stat-unpaid\").textContent = counts.unpaid;\n    $(\"#stat-overdue\").textContent = counts.overdue ? `${counts.overdue} просрочено` : \"просрочек нет\";\n    $(\"#stat-tasks\").textContent = counts.open_tasks;\n    $(\"#stat-docs\").textContent = counts.documents;\n    $(\"#feed-meta\").textContent = `${counts.documents} документов · ${counts.pending_reminders} напоминаний`;\n    renderDocuments(data.documents);\n    renderRhythm(data);\n    renderEvents(data.events);\n  } catch (error) {\n    toast(`Не загрузилось: ${error.message}`, true);\n  }\n}\n\nasync function markPaid(id) {\n  try {\n    await api(`/api/documents/${id}/paid`, { method: \"POST\" });\n    toast(\"Отмечено оплаченным\");\n    await load();\n  } catch (error) {\n    toast(error.message, true);\n  }\n}\n\nasync function submit() {\n  const input = $(\"#input\");\n  const text = input.value.trim();\n  if (!text) { toast(\"Напиши хоть что-нибудь\", true); return; }\n  const endpoints = {\n    invoice: [\"/api/invoices\", { text, due_days: 7 }],\n    capture: [\"/api/capture\", { text }],\n    task: [\"/api/tasks\", { text, source: \"web\" }],\n  };\n  const [path, body] = endpoints[mode];\n  const button = $(\"#submit\");\n  button.disabled = true;\n  $(\"#status\").textContent = \"делаем…\";\n  try {\n    const result = await api(path, { method: \"POST\", body: JSON.stringify(body) });\n    const messages = {\n      invoice: `Счёт №${result.id} готов`,\n      capture: `Импортировано строк: ${result.rows}`,\n      task: `Задача #${result.id} записана`,\n    };\n    toast(messages[mode]);\n    input.value = \"\";\n    await load();\n  } catch (error) {\n    toast(error.message, true);\n  } finally {\n    button.disabled = false;\n    $(\"#status\").textContent = \"\";\n  }\n}\n\nfunction tickClock() {\n  const now = new Date();\n  $(\"#clock\").textContent = new Intl.DateTimeFormat(\"ru-RU\", {\n    day: \"2-digit\", month: \"long\", hour: \"2-digit\", minute: \"2-digit\",\n  }).format(now);\n}\n\n$$(\".mode\").forEach((button) => {\n  button.addEventListener(\"click\", () => {\n    mode = button.dataset.mode;\n    $$(\".mode\").forEach((item) => item.classList.toggle(\"is-active\", item === button));\n    const placeholders = {\n      invoice: \"Вставь договор или переписку: клиент, сумма, срок…\",\n      capture: \"Вставь таблицу с разделителем | или ;\",\n      task: \"Что нужно сделать? Можно с датой: «до 25 ноября»\",\n    };\n    $(\"#input\").placeholder = placeholders[mode];\n    $(\"#input\").focus();\n  });\n});\n\n$(\"#submit\").addEventListener(\"click\", submit);\n$(\"#documents\").addEventListener(\"click\", (event) => {\n  const id = event.target.dataset.paid;\n  if (id) markPaid(id);\n});\n\n$(\"#report-btn\").addEventListener(\"click\", async () => {\n  try {\n    const data = await api(\"/api/reports/weekly\");\n    $(\"#report-text\").textContent = data.text;\n    $(\"#drawer\").hidden = false;\n  } catch (error) {\n    toast(error.message, true);\n  }\n});\n$(\"#drawer-close\").addEventListener(\"click\", () => { $(\"#drawer\").hidden = true; });\n$(\"#drawer\").addEventListener(\"click\", (event) => {\n  if (event.target === $(\"#drawer\")) $(\"#drawer\").hidden = true;\n});\n\ndocument.addEventListener(\"keydown\", (event) => {\n  if (event.key === \"Escape\") $(\"#drawer\").hidden = true;\n  if ((event.ctrlKey || event.metaKey) && event.key === \"Enter\") { event.preventDefault(); submit(); }\n  if (event.key === \"/\" && document.activeElement !== $(\"#input\")) {\n    event.preventDefault();\n    $(\"#input\").focus();\n  }\n});\n\ntickClock();\nsetInterval(tickClock, 30000);\nload();\n"};

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

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
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

function underThousand(number) {
  const parts = [];
  const hundreds = Math.floor(number / 100);
  const rest = number % 100;
  if (hundreds) parts.push(HUNDREDS[hundreds]);
  if (rest < 20) {
    if (rest) parts.push(ONES[rest]);
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    parts.push(TENS[tens]);
    if (ones) parts.push(ONES[ones]);
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
  const rubles = Math.floor(amount);
  const kopecks = Math.floor((amount - rubles) * 100 + 1e-6);
  let thousands = Math.floor(rubles / 1000);
  const rest = rubles % 1000;
  const millions = Math.floor(thousands / 1000);
  thousands %= 1000;
  const words = [];
  if (millions) words.push(`${underThousand(millions)} ${plural(millions, "миллион", "миллиона", "миллионов")}`);
  if (thousands) words.push(`${underThousand(thousands)} ${plural(thousands, "тысяча", "тысячи", "тысяч")}`);
  const rubleForm = plural(rubles, "рубль", "рубля", "рублей");
  words.push(rest ? `${underThousand(rest)} ${rubleForm}` : rubleForm);
  words.push(`${pad2(kopecks)} ${plural(kopecks, "копейка", "копейки", "копеек")}`);
  const result = words.filter(Boolean).join(" ");
  return result.charAt(0).toUpperCase() + result.slice(1);
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
  if (lowered.includes("завтра")) return isoDateOnly(base, 1);
  if (lowered.includes("послезавтра")) return isoDateOnly(base, 2);
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
  const match = text.match(/(^|[^0-9])(\d{3,}(?:[.,]\d{1,2})?)(?![0-9A-Za-zА-Яа-яЁё])/);
  if (match) return normaliseNumber(match[2]);
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
  const lines = cleanText(text).split("\n").map((line) => line.trim()).filter(Boolean);
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
  const text = String(value ?? "");
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
      model: model || env.AI_MODEL || "gpt-4o-mini",
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
      model: env.AI_VISION_MODEL || "gpt-4o-mini",
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

async function aiTranscribe(env, bytes, filename = "voice.ogg") {
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
    for (const key of ["client_name", "inn", "email", "title", "due_date"]) {
      const value = String(fields?.[key] ?? "").trim();
      if (value) parsed[key] = value.slice(0, 160);
    }
    if (fields?.amount !== undefined && fields?.amount !== null && fields?.amount !== "") {
      const amount = Number(fields.amount);
      if (Number.isFinite(amount)) parsed.amount = round2(amount);
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
  const dueDate = parsed.due_date || isoDateOnly(new Date(), dueDays);
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
    payload: { file, csv_text: content, preview: rows.slice(0, 5), rows: rows.length },
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
    (doc) => String(doc.created_at || "").slice(0, 10) >= weekAgo
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
  return response.json();
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

async function handleTelegramCommand(env, chatId, command, argument) {
  switch (command) {
    case "start":
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
  return new Response(body, { status: 200, headers: { "Content-Type": contentType } });
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
  return number;
}

function validateChatId(body) {
  const value = body?.notify_chat_id;
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (!/^-?\d+$|^@[A-Za-z0-9_]+$/.test(text)) fail(422, "Укажите notify_chat_id");
  return text;
}

async function routeApi(request, env, url, path, method) {
  if (path === "/api/health" && method === "GET") return json({ status: "ok", product: "takt" });

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
        const supplied = telegram[1] || "";
        if (configured ? supplied !== configured : supplied !== "") return httpError(404, "Не найдено");
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
  },
};
