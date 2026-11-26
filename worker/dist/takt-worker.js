const ASSETS = {"index.html": "<!doctype html>\n<html lang=\"ru\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Такт — администратор рутины</title>\n  <link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3CradialGradient id='g' cx='35%25' cy='28%25'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='.45' stop-color='%23bfe9ff'/%3E%3Cstop offset='1' stop-color='%230c6fa6'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='32' cy='32' r='29' fill='url(%23g)'/%3E%3Cellipse cx='23' cy='19' rx='10' ry='6' fill='%23ffffff' opacity='.85' transform='rotate(-25 23 19)'/%3E%3C/svg%3E\">\n  <link rel=\"stylesheet\" href=\"/web/styles.css\">\n</head>\n<body>\n  <div class=\"sky\" aria-hidden=\"true\"></div>\n  <div class=\"grain\" aria-hidden=\"true\"></div>\n\n  <header class=\"topbar\">\n    <div class=\"brand\">\n      <span class=\"brand__orb\" aria-hidden=\"true\"></span>\n      <span class=\"brand__text\">\n        <span class=\"brand__mark\">ТАКТ</span>\n        <span class=\"brand__note\">тихий администратор рутины</span>\n      </span>\n    </div>\n    <div class=\"topbar__right\">\n      <span class=\"win-controls\" aria-hidden=\"true\"><i></i><i></i><i></i></span>\n      <span class=\"pulse\"><i></i> работает без тебя</span>\n      <button class=\"btn btn--ghost\" id=\"report-btn\">Отчёт за неделю</button>\n    </div>\n  </header>\n\n  <main class=\"layout\">\n    <section class=\"rail\" aria-label=\"Сводка\">\n      <div class=\"rail__title\">Сегодня</div>\n      <div class=\"stat stat--ink\">\n        <span class=\"stat__num\" id=\"stat-unpaid\">—</span>\n        <span class=\"stat__label\">ждут оплаты</span>\n        <span class=\"stat__hint\" id=\"stat-overdue\">просрочек нет</span>\n      </div>\n      <div class=\"stat stat--sage\">\n        <span class=\"stat__num\" id=\"stat-tasks\">—</span>\n        <span class=\"stat__label\">открытых задач</span>\n        <span class=\"stat__hint\">записано и не забыто</span>\n      </div>\n      <div class=\"stat stat--gold\">\n        <span class=\"stat__num\" id=\"stat-docs\">—</span>\n        <span class=\"stat__label\">документов всего</span>\n        <span class=\"stat__hint\">счета, акты, импорты</span>\n      </div>\n      <div class=\"rail__note\" id=\"clock\">—</div>\n    </section>\n\n    <section class=\"feed\">\n      <div class=\"section-head\">\n        <h1>Поток дел</h1>\n        <span class=\"section-head__meta\" id=\"feed-meta\">загружаем…</span>\n      </div>\n      <div class=\"cards\" id=\"documents\"></div>\n    </section>\n\n    <aside class=\"side\">\n      <div class=\"section-head section-head--small\">\n        <h2>Ритм</h2>\n        <span class=\"section-head__meta\">напоминания и задачи</span>\n      </div>\n      <div class=\"rhythm\" id=\"rhythm\"></div>\n      <div class=\"events\">\n        <div class=\"events__title\">Что случилось только что</div>\n        <ol id=\"events\"></ol>\n      </div>\n    </aside>\n  </main>\n\n  <section class=\"composer\" aria-label=\"Быстрый ввод\">\n    <div class=\"composer__inner\">\n      <div class=\"modes\" role=\"tablist\">\n        <button class=\"mode is-active\" data-mode=\"invoice\" role=\"tab\">Счёт и акт</button>\n        <button class=\"mode\" data-mode=\"capture\" role=\"tab\">Таблица</button>\n        <button class=\"mode\" data-mode=\"task\" role=\"tab\">Задача</button>\n      </div>\n      <div class=\"composer__row\">\n        <textarea id=\"input\" rows=\"2\" placeholder=\"Вставь договор, переписку, таблицу или просто скажи, что нужно сделать…\"></textarea>\n        <button class=\"btn btn--primary\" id=\"submit\">Отпустить <span>↵</span></button>\n      </div>\n      <div class=\"composer__foot\">\n        <span id=\"hint\">Ctrl+Enter — отправить · / — фокус</span>\n        <span id=\"status\" aria-live=\"polite\"></span>\n      </div>\n    </div>\n  </section>\n\n  <div class=\"drawer\" id=\"drawer\" hidden>\n    <div class=\"drawer__sheet\">\n      <button class=\"drawer__close\" id=\"drawer-close\" aria-label=\"Закрыть\">×</button>\n      <div class=\"drawer__title\">Отчёт за неделю</div>\n      <pre id=\"report-text\"></pre>\n    </div>\n  </div>\n\n  <div class=\"toast\" id=\"toast\" hidden></div>\n  <script src=\"/web/app.js\"></script>\n</body>\n</html>\n", "styles.css": "/* Такт — Frutiger Aero / старый добрый Web 2.0.\n   Стекло, глянец, пузыри, мягкий синий воздух — без лишнего шума. */\n\n:root {\n  --sea: #0c6fa6;\n  --sea-deep: #064c77;\n  --sea-soft: #4aa9d8;\n  --ice: #f4fbff;\n  --sky: #cfeaff;\n  --lime: #8dc63f;\n  --amber: #ffb544;\n  --coral: #ff7d5c;\n  --ink: #0b3f60;\n  --muted: #4f7b98;\n  --rule: rgba(18, 105, 155, .18);\n  --glass: linear-gradient(145deg, rgba(255, 255, 255, .96), rgba(224, 243, 255, .82) 45%, rgba(176, 219, 245, .7));\n  --glass-line: rgba(255, 255, 255, .92);\n  --shadow: 0 16px 32px -16px rgba(4, 55, 88, .6);\n  --spring: cubic-bezier(.18, .89, .32, 1.28);\n}\n\n* { box-sizing: border-box; }\n\nhtml, body { min-height: 100%; }\n\nbody {\n  margin: 0;\n  padding-bottom: 210px;\n  color: var(--ink);\n  font: 14px/1.55 \"Segoe UI\", Tahoma, Verdana, sans-serif;\n  background:\n    radial-gradient(circle at 12% 4%, rgba(255, 255, 255, .95) 0 5%, transparent 26%),\n    radial-gradient(circle at 86% 16%, rgba(146, 223, 255, .6), transparent 30%),\n    radial-gradient(circle at 48% 100%, rgba(144, 205, 241, .85), transparent 58%),\n    linear-gradient(180deg, #eaf9ff 0%, #d8f0ff 42%, #c2e5fa 100%);\n  -webkit-font-smoothing: antialiased;\n}\n\n/* Пузыри и зерно — декоративный фон, ничего не ловят. */\n.sky {\n  position: fixed;\n  inset: 0;\n  z-index: 0;\n  overflow: hidden;\n  pointer-events: none;\n}\n.sky::before {\n  content: \"\";\n  position: absolute;\n  inset: -18%;\n  background:\n    radial-gradient(circle at 9% 14%, #fff 0 3px, rgba(255, 255, 255, .72) 9px, rgba(75, 169, 218, .22) 19px, transparent 20px),\n    radial-gradient(circle at 27% 68%, #fff 0 4px, rgba(255, 255, 255, .65) 12px, rgba(75, 169, 218, .18) 25px, transparent 26px),\n    radial-gradient(circle at 63% 18%, #fff 0 2px, rgba(255, 255, 255, .6) 8px, rgba(75, 169, 218, .2) 17px, transparent 18px),\n    radial-gradient(circle at 78% 76%, #fff 0 5px, rgba(255, 255, 255, .6) 14px, rgba(75, 169, 218, .16) 29px, transparent 30px),\n    radial-gradient(circle at 94% 42%, #fff 0 3px, rgba(255, 255, 255, .55) 10px, rgba(75, 169, 218, .15) 21px, transparent 22px);\n  opacity: .85;\n  animation: drift 26s ease-in-out infinite alternate;\n}\n.sky::after {\n  content: \"\";\n  position: absolute;\n  right: -90px;\n  top: 12%;\n  width: 260px;\n  height: 260px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, .96), rgba(255, 255, 255, .35) 30%, rgba(66, 164, 214, .25) 68%, transparent 72%);\n  box-shadow: inset -18px -22px 40px rgba(14, 89, 134, .18), inset 12px 14px 26px rgba(255, 255, 255, .9);\n  animation: hover 12s ease-in-out infinite;\n}\n@keyframes drift {\n  from { transform: translate3d(0, 0, 0); }\n  to { transform: translate3d(-28px, 32px, 0); }\n}\n@keyframes hover {\n  0%, 100% { transform: translateY(0) scale(1); }\n  50% { transform: translateY(-22px) scale(1.04); }\n}\n\n.grain {\n  position: fixed;\n  inset: 0;\n  z-index: 12;\n  pointer-events: none;\n  opacity: .14;\n  background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\");\n}\n\n/* Верхняя панель — глянцевая, как старый системный заголовок. */\n.topbar {\n  position: relative;\n  z-index: 3;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 22px clamp(20px, 4vw, 64px) 18px;\n  border-bottom: 1px solid rgba(255, 255, 255, .9);\n  background: linear-gradient(180deg, rgba(255, 255, 255, .8), rgba(255, 255, 255, .22));\n  box-shadow: 0 1px 0 rgba(10, 90, 140, .22), 0 12px 30px -22px rgba(6, 70, 110, .7);\n  backdrop-filter: blur(8px);\n}\n\n.brand { display: flex; align-items: center; gap: 14px; }\n.brand__text { display: flex; flex-direction: column; gap: 2px; }\n.brand__orb {\n  position: relative;\n  flex: none;\n  width: 54px;\n  height: 54px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 34% 26%, #fff 0 8%, #c8edff 24%, #35a9dc 58%, #0a6da6 100%);\n  box-shadow: inset -6px -8px 16px rgba(0, 61, 100, .38), inset 5px 6px 12px rgba(255, 255, 255, .95), 0 9px 20px -8px rgba(8, 83, 130, .75);\n  animation: hover 9s ease-in-out infinite;\n}\n.brand__orb::after {\n  content: \"\";\n  position: absolute;\n  left: 13%;\n  top: 10%;\n  width: 38%;\n  height: 22%;\n  border-radius: 50%;\n  background: rgba(255, 255, 255, .9);\n  filter: blur(2px);\n  transform: rotate(-24deg);\n}\n.brand__mark {\n  font: 700 30px/1 \"Trebuchet MS\", \"Segoe UI\", sans-serif;\n  letter-spacing: .16em;\n  color: #0a6296;\n  text-shadow: 0 1px 0 #fff, 0 -1px 0 rgba(4, 66, 105, .4);\n}\n.brand__note {\n  font: 10px/1.2 Tahoma, Verdana, sans-serif;\n  letter-spacing: .14em;\n  text-transform: uppercase;\n  color: var(--muted);\n}\n\n.topbar__right { display: flex; align-items: center; gap: 18px; }\n.win-controls { display: flex; gap: 6px; }\n.win-controls i {\n  position: relative;\n  width: 22px; height: 20px;\n  border: 1px solid rgba(255, 255, 255, .9);\n  border-radius: 5px;\n  background: linear-gradient(180deg, #fff 0%, #d9f1ff 44%, #78bbe3 52%, #4e9ecd 100%);\n  box-shadow: inset 0 1px 0 #fff, inset 0 -2px 3px rgba(9, 88, 137, .25), 0 2px 0 rgba(10, 90, 140, .35);\n}\n.win-controls i::after {\n  position: absolute;\n  left: 0; right: 0; top: 4px;\n  text-align: center;\n  font: 700 10px/1 Tahoma, sans-serif;\n  color: #0a6296;\n  text-shadow: 0 1px 0 #fff;\n}\n.win-controls i:nth-child(1)::after { content: \"_\"; }\n.win-controls i:nth-child(2)::after { content: \"□\"; font-size: 9px; }\n.win-controls i:nth-child(3)::after { content: \"×\"; font-size: 13px; color: #b3472f; }\n.pulse {\n  display: inline-flex;\n  align-items: center;\n  gap: 9px;\n  padding: 7px 12px;\n  border-radius: 999px;\n  font-size: 11px;\n  color: #176487;\n  background: linear-gradient(180deg, rgba(255, 255, 255, .92), rgba(209, 239, 255, .72));\n  border: 1px solid rgba(255, 255, 255, .95);\n  box-shadow: inset 0 1px 0 #fff, 0 4px 12px -8px rgba(5, 70, 110, .7);\n}\n.pulse i {\n  width: 9px; height: 9px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 35% 30%, #dcffb0, var(--lime) 60%, #5d961f);\n  box-shadow: 0 0 0 0 rgba(141, 198, 63, .5), inset 0 1px 1px rgba(255, 255, 255, .8);\n  animation: breathe 3.2s infinite;\n}\n@keyframes breathe {\n  0%, 100% { box-shadow: 0 0 0 0 rgba(141, 198, 63, .5); }\n  50% { box-shadow: 0 0 0 8px rgba(141, 198, 63, 0); }\n}\n\n/* Глянцевые кнопки с «нажимом». */\n.btn {\n  position: relative;\n  font: 700 12px/1 \"Trebuchet MS\", \"Segoe UI\", sans-serif;\n  letter-spacing: .04em;\n  border: 1px solid #0e74a9;\n  border-radius: 12px;\n  padding: 11px 18px;\n  color: #073f63;\n  background: linear-gradient(180deg, #fff 0%, #e3f5ff 35%, #9dd4f2 52%, #64b4e2 100%);\n  text-shadow: 0 1px 0 rgba(255, 255, 255, .8);\n  box-shadow: inset 0 1px 0 #fff, inset 0 -2px 4px rgba(9, 92, 142, .22), 0 5px 0 #2c83b5, 0 10px 18px -8px rgba(6, 70, 110, .65);\n  cursor: pointer;\n  transition: transform .2s var(--spring), box-shadow .2s ease, filter .2s ease;\n}\n.btn::after {\n  content: \"\";\n  position: absolute;\n  left: 8%; right: 8%; top: 2px;\n  height: 40%;\n  border-radius: 999px;\n  background: linear-gradient(180deg, rgba(255, 255, 255, .85), rgba(255, 255, 255, 0));\n  pointer-events: none;\n}\n.btn:hover { transform: translateY(-2px); filter: saturate(1.1); box-shadow: inset 0 1px 0 #fff, inset 0 -2px 4px rgba(9, 92, 142, .2), 0 7px 0 #2c83b5, 0 14px 22px -8px rgba(6, 70, 110, .65); }\n.btn:active { transform: translateY(4px); box-shadow: inset 0 2px 5px rgba(9, 92, 142, .3), 0 1px 0 #2c83b5; }\n.btn--ghost { border-color: rgba(14, 116, 169, .5); background: linear-gradient(180deg, rgba(255, 255, 255, .85), rgba(200, 234, 252, .55)); }\n.btn--primary {\n  border-color: #c47718;\n  color: #4a2b06;\n  background: linear-gradient(180deg, #fff0c8 0%, #ffd477 32%, #ffb544 52%, #f28a22 100%);\n  box-shadow: inset 0 1px 0 #fff5d9, inset 0 -2px 4px rgba(150, 83, 8, .25), 0 5px 0 #b96513, 0 10px 18px -8px rgba(120, 68, 8, .6);\n  padding: 13px 22px;\n  font-size: 13px;\n  white-space: nowrap;\n}\n.btn--primary:hover { box-shadow: inset 0 1px 0 #fff5d9, 0 7px 0 #b96513, 0 14px 22px -8px rgba(120, 68, 8, .6); }\n.btn--primary:active { box-shadow: inset 0 2px 5px rgba(150, 83, 8, .3), 0 1px 0 #b96513; }\n.btn--primary span { opacity: .6; margin-left: 6px; }\n\n/* Основная сетка. */\n.layout {\n  position: relative;\n  z-index: 2;\n  display: grid;\n  grid-template-columns: 230px minmax(0, 1fr) 290px;\n  gap: clamp(18px, 3vw, 42px);\n  padding: 38px clamp(20px, 4vw, 64px) 60px;\n  align-items: start;\n}\n\n.rail { display: flex; flex-direction: column; gap: 16px; }\n.rail__title, .section-head__meta, .events__title {\n  font: 700 10px/1.2 Tahoma, Verdana, sans-serif;\n  letter-spacing: .16em;\n  text-transform: uppercase;\n  color: #4a82a3;\n}\n.rail__title { margin-bottom: 2px; }\n\n.stat {\n  position: relative;\n  overflow: hidden;\n  padding: 20px 18px 18px;\n  border-radius: 18px;\n  background: var(--glass);\n  border: 1px solid var(--glass-line);\n  box-shadow: inset 0 1px 0 #fff, inset 0 -16px 28px rgba(91, 172, 216, .14), var(--shadow), 0 0 0 1px var(--rule);\n  transition: transform .3s var(--spring), box-shadow .3s ease;\n}\n.stat:hover { transform: translateY(-3px) rotate(-.4deg); box-shadow: inset 0 1px 0 #fff, var(--shadow), 0 16px 30px -14px rgba(4, 55, 88, .7); }\n.stat::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 0 auto;\n  height: 5px;\n  background: linear-gradient(90deg, rgba(255, 255, 255, .9), currentColor 60%, rgba(255, 255, 255, .3));\n}\n.stat::after {\n  content: \"\";\n  position: absolute;\n  right: -20px; top: -20px;\n  width: 82px; height: 82px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, .95), rgba(255, 255, 255, .2) 42%, currentColor 72%, transparent 74%);\n  opacity: .22;\n}\n.stat--ink { color: var(--sea); }\n.stat--sage { color: #5f9e2d; }\n.stat--gold { color: #e89518; }\n.stat__num {\n  display: block;\n  font: 700 46px/.95 \"Trebuchet MS\", sans-serif;\n  letter-spacing: -.03em;\n  color: currentColor;\n  text-shadow: 0 1px 0 #fff, 0 -1px 0 rgba(3, 60, 95, .25);\n}\n.stat__label {\n  display: block;\n  margin: 10px 0 4px;\n  font-size: 13px;\n  font-weight: 700;\n  color: var(--ink);\n}\n.stat__hint { display: block; font-size: 11px; color: var(--muted); }\n.rail__note {\n  margin-top: 6px;\n  padding: 8px 12px;\n  border: 1px solid rgba(255, 255, 255, .9);\n  border-radius: 10px;\n  background: linear-gradient(180deg, rgba(255, 255, 255, .9), rgba(199, 232, 251, .72));\n  box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 rgba(9, 88, 137, .22), 0 4px 10px -8px rgba(4, 55, 88, .7);\n  font: 12px/1.5 \"Courier New\", monospace;\n  color: #2f6f92;\n  text-align: center;\n}\n\n.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }\n.section-head h1, .section-head h2 {\n  margin: 0;\n  font: 700 30px/1 \"Trebuchet MS\", sans-serif;\n  letter-spacing: -.01em;\n  color: #0a6296;\n  text-shadow: 0 1px 0 #fff, 0 -1px 0 rgba(5, 65, 102, .25);\n}\n.section-head h2 { font-size: 23px; }\n.section-head--small { margin-bottom: 16px; }\n\n.cards { display: flex; flex-direction: column; gap: 12px; }\n.card {\n  position: relative;\n  overflow: hidden;\n  display: grid;\n  grid-template-columns: 62px 1fr auto;\n  gap: 16px;\n  align-items: center;\n  padding: 16px 18px;\n  border-radius: 16px;\n  background: linear-gradient(135deg, rgba(255, 255, 255, .97), rgba(224, 244, 255, .85) 55%, rgba(190, 229, 250, .75));\n  border: 1px solid rgba(255, 255, 255, .95);\n  box-shadow: inset 0 1px 0 #fff, inset 0 -12px 24px rgba(87, 168, 213, .12), 0 12px 26px -16px rgba(4, 55, 88, .6), 0 0 0 1px var(--rule);\n  transition: transform .25s var(--spring), box-shadow .25s ease;\n}\n.card::before {\n  content: \"\";\n  position: absolute;\n  left: 0; top: 0; bottom: 0;\n  width: 4px;\n  background: linear-gradient(180deg, #9adaf8, #0b7ab3);\n  box-shadow: 1px 0 0 rgba(255, 255, 255, .8);\n}\n.card:hover { transform: translateX(4px); box-shadow: inset 0 1px 0 #fff, 0 16px 30px -14px rgba(4, 55, 88, .7), 0 0 0 1px rgba(14, 116, 169, .3); }\n.card__num {\n  font: 700 12px/1.2 \"Courier New\", monospace;\n  color: #3a7799;\n  text-shadow: 0 1px 0 #fff;\n}\n.card__title { font-weight: 700; }\n.card__meta { font-size: 12px; color: var(--muted); margin-top: 3px; }\n.card__right { text-align: right; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }\n.card__amount { font: 700 18px/1 \"Trebuchet MS\", sans-serif; white-space: nowrap; color: #0a6296; text-shadow: 0 1px 0 #fff; }\n.pill {\n  display: inline-block;\n  padding: 4px 10px;\n  border-radius: 999px;\n  font: 700 10px/1.2 Tahoma, sans-serif;\n  letter-spacing: .08em;\n  text-transform: uppercase;\n  color: #fff;\n  border: 1px solid rgba(255, 255, 255, .8);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .55), 0 2px 6px -3px rgba(4, 55, 88, .6);\n}\n.pill--sent { background: linear-gradient(180deg, #ffd27a, #f09a25); }\n.pill--paid { background: linear-gradient(180deg, #bde77e, #6fae2c); }\n.pill--draft, .pill--done { background: linear-gradient(180deg, #d8ecf8, #8ab6d0); color: #0b4e76; }\n.linkbtn {\n  border: 0;\n  background: none;\n  padding: 0;\n  font: 700 11px/1 \"Trebuchet MS\", sans-serif;\n  color: #0875ad;\n  cursor: pointer;\n  letter-spacing: .03em;\n  text-shadow: 0 1px 0 #fff;\n}\n.linkbtn:hover { text-decoration: underline; }\n\n.side { display: flex; flex-direction: column; gap: 24px; }\n.rhythm { display: flex; flex-direction: column; gap: 9px; }\n.beat {\n  display: flex;\n  gap: 12px;\n  align-items: flex-start;\n  padding: 12px 14px;\n  border-left: 4px solid #e89518;\n  background: linear-gradient(180deg, rgba(255, 255, 255, .92), rgba(216, 241, 255, .7));\n  border-radius: 4px 12px 12px 4px;\n  box-shadow: inset 0 1px 0 #fff, 0 6px 14px -10px rgba(4, 55, 88, .6);\n}\n.beat__dot { width: 8px; height: 8px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffe09c, #e89518); margin-top: 6px; flex: none; box-shadow: 0 1px 2px rgba(4, 55, 88, .3); }\n.beat__text { font-size: 13px; }\n.beat__date { font-size: 11px; color: var(--muted); margin-top: 3px; }\n.beat--task { border-left-color: #5f9e2d; }\n.beat--task .beat__dot { background: radial-gradient(circle at 35% 30%, #d6f5a8, #6fae2c); }\n\n.events ol { list-style: none; margin: 10px 0 0; padding: 0; }\n.events li {\n  display: flex; gap: 9px; padding: 8px 0;\n  border-bottom: 1px solid rgba(18, 105, 155, .14);\n  font-size: 12px; color: var(--muted);\n}\n.events li time { font: 11px/1.5 \"Courier New\", monospace; color: #3a7799; flex: none; }\n\n/* Нижняя панель — как старый taskbar, только стеклянный. */\n.composer {\n  position: fixed;\n  left: 0; right: 0; bottom: 0;\n  z-index: 8;\n  padding: 16px clamp(20px, 4vw, 64px) 20px;\n  background: linear-gradient(180deg, rgba(10, 105, 160, 0), rgba(9, 84, 132, .78) 32%, rgba(5, 61, 100, .94));\n  border-top: 1px solid rgba(255, 255, 255, .65);\n  box-shadow: 0 -10px 34px -14px rgba(3, 45, 75, .7);\n  backdrop-filter: blur(6px);\n}\n.composer__inner {\n  max-width: 1120px;\n  margin: 0 auto;\n  padding: 16px 18px 12px;\n  border-radius: 18px;\n  background: linear-gradient(155deg, rgba(255, 255, 255, .96), rgba(215, 241, 255, .88) 55%, rgba(180, 223, 247, .82));\n  border: 1px solid rgba(255, 255, 255, .95);\n  box-shadow: inset 0 1px 0 #fff, 0 14px 32px -14px rgba(2, 50, 85, .8), 0 0 0 1px rgba(9, 88, 137, .25);\n}\n.modes { display: flex; gap: 7px; margin-bottom: 12px; }\n.mode {\n  border: 1px solid rgba(14, 116, 169, .35);\n  background: linear-gradient(180deg, #fff, #d7eefc);\n  padding: 7px 14px;\n  border-radius: 10px;\n  font: 700 11px/1 \"Trebuchet MS\", sans-serif;\n  color: #4a82a3;\n  cursor: pointer;\n  box-shadow: inset 0 1px 0 #fff, 0 2px 0 rgba(18, 111, 160, .22);\n  transition: transform .18s var(--spring), box-shadow .18s ease, color .18s ease;\n}\n.mode:hover { color: var(--ink); transform: translateY(-1px); }\n.mode.is-active {\n  color: #fff;\n  border-color: #0a6fa8;\n  background: linear-gradient(180deg, #6fc5ee, #1583bd 52%, #0a6fa8);\n  text-shadow: 0 1px 0 rgba(0, 55, 90, .45);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .55), 0 3px 0 #07527f, 0 6px 12px -6px rgba(4, 55, 88, .7);\n}\n.composer__row { display: flex; gap: 12px; align-items: stretch; }\ntextarea {\n  flex: 1;\n  resize: none;\n  min-height: 58px;\n  padding: 13px 15px;\n  border: 1px solid #8fc7e8;\n  border-radius: 12px;\n  background: linear-gradient(180deg, #fbfeff, #e8f6ff);\n  color: var(--ink);\n  font: 14px/1.5 \"Segoe UI\", Tahoma, sans-serif;\n  outline: none;\n  box-shadow: inset 0 2px 6px rgba(16, 88, 130, .14), 0 1px 0 #fff;\n  transition: border-color .2s, box-shadow .2s;\n}\ntextarea::placeholder { color: #6f9db8; }\ntextarea:focus { border-color: #2aa7dd; box-shadow: inset 0 2px 6px rgba(16, 88, 130, .12), 0 0 0 3px rgba(47, 177, 226, .24); }\n.composer__foot {\n  display: flex; justify-content: space-between;\n  margin-top: 9px; font-size: 11px; color: #4a82a3;\n}\n\n/* Выдвижная панель отчёта. */\n.drawer { position: fixed; inset: 0; z-index: 20; background: rgba(3, 52, 86, .48); backdrop-filter: blur(4px); }\n.drawer__sheet {\n  position: absolute; right: 0; top: 0; bottom: 0;\n  width: min(520px, 92vw);\n  padding: 42px 34px;\n  background: linear-gradient(160deg, rgba(255, 255, 255, .97), rgba(214, 240, 255, .92));\n  border-left: 1px solid #fff;\n  box-shadow: -20px 0 60px -30px rgba(2, 45, 75, .8), inset 1px 0 0 rgba(255, 255, 255, .8);\n  animation: slide .32s var(--spring);\n}\n@keyframes slide { from { transform: translateX(30px); opacity: .4; } }\n.drawer__close { position: absolute; top: 18px; right: 22px; border: 1px solid rgba(14, 116, 169, .35); background: linear-gradient(180deg, #fff, #d7eefc); border-radius: 10px; width: 34px; height: 34px; font-size: 22px; cursor: pointer; color: var(--ink); box-shadow: inset 0 1px 0 #fff, 0 2px 0 rgba(18, 111, 160, .22); }\n.drawer__title { font: 700 26px/1 \"Trebuchet MS\", sans-serif; color: #0a6296; text-shadow: 0 1px 0 #fff; margin-bottom: 22px; }\n.drawer pre { white-space: pre-wrap; font: 13px/1.7 \"Courier New\", monospace; color: var(--ink); }\n\n.toast {\n  position: fixed; left: 50%; bottom: 200px; z-index: 30;\n  transform: translateX(-50%);\n  padding: 12px 20px;\n  border-radius: 12px;\n  background: linear-gradient(180deg, #fff, #d9f0ff);\n  border: 1px solid rgba(255, 255, 255, .95);\n  color: #0a6296;\n  font: 700 13px/1 \"Trebuchet MS\", sans-serif;\n  box-shadow: inset 0 1px 0 #fff, 0 14px 30px -14px rgba(3, 52, 86, .7);\n  animation: rise .3s var(--spring);\n}\n@keyframes rise { from { transform: translate(-50%, 12px); opacity: 0; } }\n\n.empty { padding: 30px; text-align: center; color: var(--muted); font-size: 13px; border: 1px dashed rgba(18, 105, 155, .35); border-radius: 16px; background: rgba(255, 255, 255, .4); }\n\n/* Старомодный скроллбар, чтобы не выбивался из вайба. */\n::-webkit-scrollbar { width: 12px; }\n::-webkit-scrollbar-track { background: #d9effc; }\n::-webkit-scrollbar-thumb { border-radius: 10px; border: 2px solid #d9effc; background: linear-gradient(180deg, #fff, #8fc9e9 45%, #4d9fcb); }\n\n@media (max-width: 1100px) {\n  .layout { grid-template-columns: 190px minmax(0, 1fr); }\n  .side { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; }\n  .side > * { flex: 1 1 260px; }\n}\n@media (max-width: 720px) {\n  body { padding-bottom: 240px; }\n  .layout { grid-template-columns: 1fr; }\n  .rail { flex-direction: row; flex-wrap: wrap; }\n  .stat { flex: 1 1 140px; }\n  .topbar { align-items: flex-start; flex-direction: column; }\n  .brand__mark { font-size: 25px; }\n  .brand__orb { width: 44px; height: 44px; }\n  .card { grid-template-columns: 48px 1fr; }\n  .card__right { grid-column: 2; align-items: flex-start; }\n  .composer__row { flex-direction: column; }\n  .btn--primary { align-self: flex-end; }\n}\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation: none !important; transition: none !important; }\n}\n", "app.js": "const $ = (selector) => document.querySelector(selector);\nconst $$ = (selector) => Array.from(document.querySelectorAll(selector));\n\nlet mode = \"invoice\";\nlet toastTimer;\n\nasync function api(path, options = {}) {\n  const response = await fetch(path, {\n    headers: { \"Content-Type\": \"application/json\" },\n    ...options,\n  });\n  if (!response.ok) {\n    const body = await response.json().catch(() => ({ detail: response.statusText }));\n    const detail = typeof body.detail === \"string\"\n      ? body.detail\n      : JSON.stringify(body.detail ?? body);\n    throw new Error(detail || response.statusText);\n  }\n  return response.json();\n}\n\nconst escapeHtml = (value) =>\n  String(value ?? \"\").replace(/[&<>\"']/g, (char) =>\n    ({ \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" })[char]\n  );\n\nconst money = (value) =>\n  new Intl.NumberFormat(\"ru-RU\", { style: \"currency\", currency: \"RUB\", maximumFractionDigits: 2 }).format(value || 0);\n\nfunction toast(message, isError = false) {\n  const node = $(\"#toast\");\n  node.textContent = message;\n  node.style.background = isError ? \"#8c3b2b\" : \"#24211c\";\n  node.hidden = false;\n  clearTimeout(toastTimer);\n  toastTimer = setTimeout(() => { node.hidden = true; }, 3600);\n}\n\nfunction statusLabels(kind, status) {\n  if (kind === \"capture\") return [\"done\", \"импорт\"];\n  return [status === \"paid\" ? \"paid\" : \"sent\", status === \"paid\" ? \"оплачено\" : \"в работе\"];\n}\n\nfunction renderDocuments(documents) {\n  const container = $(\"#documents\");\n  if (!documents.length) {\n    container.innerHTML = '<div class=\"empty\">Пока тихо. Вставь текст ниже — и появится первый документ.</div>';\n    return;\n  }\n  container.innerHTML = documents.map((doc) => {\n    const [pillClass, pillText] = statusLabels(doc.kind, doc.status);\n    const docId = escapeHtml(String(doc.id));\n    const number = `${doc.kind === \"capture\" ? \"И\" : \"С\"}-${String(doc.id).padStart(4, \"0\")}`;\n    const due = doc.due_date ? `оплата до ${escapeHtml(doc.due_date)}` : escapeHtml(String(doc.created_at).slice(0, 10));\n    const files = doc.kind === \"invoice\"\n      ? `<a class=\"linkbtn\" href=\"/api/documents/${docId}/download?key=invoice_file\" target=\"_blank\" rel=\"noopener\">счёт ↗</a>\n         <a class=\"linkbtn\" href=\"/api/documents/${docId}/download?key=act_file\" target=\"_blank\" rel=\"noopener\">акт ↗</a>`\n      : `<span class=\"card__meta\">${escapeHtml(doc.payload?.rows ?? 0)} строк</span>`;\n    const excel = `<a class=\"linkbtn\" href=\"/api/documents/${docId}/export.xlsx\">Excel ↓</a>`;\n    const pay = doc.kind === \"invoice\" && doc.status !== \"paid\"\n      ? `<button class=\"linkbtn\" data-paid=\"${docId}\">отметить оплату</button>` : \"\";\n    return `<article class=\"card\">\n      <div class=\"card__num\">${number}</div>\n      <div>\n        <div class=\"card__title\">${escapeHtml(doc.title)}</div>\n        <div class=\"card__meta\">${escapeHtml(doc.client_name)} · ${due}</div>\n      </div>\n      <div class=\"card__right\">\n        <div class=\"card__amount\">${money(doc.amount)}</div>\n        <span class=\"pill pill--${pillClass}\">${pillText}</span>\n        <div>${files}${excel}${pay}</div>\n      </div>\n    </article>`;\n  }).join(\"\");\n}\n\nfunction renderRhythm(data) {\n  const container = $(\"#rhythm\");\n  const beats = [];\n  for (const task of data.tasks || []) {\n    beats.push(`<div class=\"beat beat--task\">\n      <span class=\"beat__dot\"></span>\n      <div><div class=\"beat__text\">${escapeHtml(task.title)}</div>\n      <div class=\"beat__date\">${task.due_date ? `до ${escapeHtml(task.due_date)}` : \"без срока\"} · задача</div></div>\n    </div>`);\n  }\n  for (const doc of data.documents || []) {\n    if (doc.due_date && doc.status !== \"paid\" && doc.kind === \"invoice\") {\n      beats.push(`<div class=\"beat\">\n        <span class=\"beat__dot\"></span>\n        <div><div class=\"beat__text\">${escapeHtml(doc.client_name)} — ${money(doc.amount)}</div>\n        <div class=\"beat__date\">до ${escapeHtml(doc.due_date)} · оплата</div></div>\n      </div>`);\n    }\n  }\n  container.innerHTML = beats.length ? beats.join(\"\") : '<div class=\"empty\">Ритм спокойный.</div>';\n}\n\nconst eventNames = {\n  \"document.created\": \"новый документ\",\n  \"document.updated\": \"документ обновлён\",\n  \"payment.received\": \"оплата пришла\",\n  \"task.created\": \"задача записана\",\n  \"task.done\": \"задача закрыта\",\n  \"reminder.sent\": \"напоминание ушло\",\n};\n\nfunction renderEvents(events) {\n  $(\"#events\").innerHTML = (events || []).map((event) => {\n    const time = String(event.created_at || \"\").slice(11, 16);\n    return `<li><time>${escapeHtml(time)}</time><span>${escapeHtml(eventNames[event.kind] || event.kind)} · ${escapeHtml(event.detail)}</span></li>`;\n  }).join(\"\") || '<li>Событий пока нет.</li>';\n}\n\nasync function load() {\n  try {\n    const data = await api(\"/api/overview\");\n    const counts = data.counts;\n    $(\"#stat-unpaid\").textContent = counts.unpaid;\n    $(\"#stat-overdue\").textContent = counts.overdue ? `${counts.overdue} просрочено` : \"просрочек нет\";\n    $(\"#stat-tasks\").textContent = counts.open_tasks;\n    $(\"#stat-docs\").textContent = counts.documents;\n    $(\"#feed-meta\").textContent = `${counts.documents} документов · ${counts.pending_reminders} напоминаний`;\n    renderDocuments(data.documents);\n    renderRhythm(data);\n    renderEvents(data.events);\n  } catch (error) {\n    toast(`Не загрузилось: ${error.message}`, true);\n  }\n}\n\nasync function markPaid(id) {\n  try {\n    await api(`/api/documents/${id}/paid`, { method: \"POST\" });\n    toast(\"Отмечено оплаченным\");\n    await load();\n  } catch (error) {\n    toast(error.message, true);\n  }\n}\n\nasync function submit() {\n  const button = $(\"#submit\");\n  if (button.disabled) return;\n  const input = $(\"#input\");\n  const text = input.value.trim();\n  if (!text) { toast(\"Напиши хоть что-нибудь\", true); return; }\n  const activeMode = mode;\n  const endpoints = {\n    invoice: [\"/api/invoices\", { text, due_days: 7 }],\n    capture: [\"/api/capture\", { text }],\n    task: [\"/api/tasks\", { text, source: \"web\" }],\n  };\n  const [path, body] = endpoints[activeMode];\n  button.disabled = true;\n  $(\"#status\").textContent = \"делаем…\";\n  try {\n    const result = await api(path, { method: \"POST\", body: JSON.stringify(body) });\n    const messages = {\n      invoice: `Счёт №${result.id} готов`,\n      capture: `Импортировано строк: ${result.rows}`,\n      task: `Задача #${result.id} записана`,\n    };\n    toast(messages[activeMode]);\n    input.value = \"\";\n    await load();\n  } catch (error) {\n    toast(error.message, true);\n  } finally {\n    button.disabled = false;\n    $(\"#status\").textContent = \"\";\n  }\n}\n\nfunction tickClock() {\n  const now = new Date();\n  $(\"#clock\").textContent = new Intl.DateTimeFormat(\"ru-RU\", {\n    day: \"2-digit\", month: \"long\", hour: \"2-digit\", minute: \"2-digit\",\n  }).format(now);\n}\n\n$$(\".mode\").forEach((button) => {\n  button.addEventListener(\"click\", () => {\n    mode = button.dataset.mode;\n    $$(\".mode\").forEach((item) => item.classList.toggle(\"is-active\", item === button));\n    const placeholders = {\n      invoice: \"Вставь договор или переписку: клиент, сумма, срок…\",\n      capture: \"Вставь таблицу с разделителем | или ;\",\n      task: \"Что нужно сделать? Можно с датой: «до 25 ноября»\",\n    };\n    $(\"#input\").placeholder = placeholders[mode];\n    $(\"#input\").focus();\n  });\n});\n\n$(\"#submit\").addEventListener(\"click\", submit);\n$(\"#documents\").addEventListener(\"click\", (event) => {\n  const id = event.target.dataset.paid;\n  if (id) markPaid(id);\n});\n\n$(\"#report-btn\").addEventListener(\"click\", async () => {\n  try {\n    const data = await api(\"/api/reports/weekly\");\n    $(\"#report-text\").textContent = data.text;\n    $(\"#drawer\").hidden = false;\n  } catch (error) {\n    toast(error.message, true);\n  }\n});\n$(\"#drawer-close\").addEventListener(\"click\", () => { $(\"#drawer\").hidden = true; });\n$(\"#drawer\").addEventListener(\"click\", (event) => {\n  if (event.target === $(\"#drawer\")) $(\"#drawer\").hidden = true;\n});\n\ndocument.addEventListener(\"keydown\", (event) => {\n  if (event.key === \"Escape\") $(\"#drawer\").hidden = true;\n  if ((event.ctrlKey || event.metaKey) && event.key === \"Enter\") { event.preventDefault(); submit(); }\n  if (event.key === \"/\" && document.activeElement !== $(\"#input\")) {\n    event.preventDefault();\n    $(\"#input\").focus();\n  }\n});\n\ntickClock();\nsetInterval(tickClock, 30000);\nload();\n"};

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
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(`AI HTTP ${response.status}: ${detail}`);
  }
  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

function audioMime(filename) {
  const ext = String(filename || "").split(".").pop().toLowerCase();
  return ({ ogg: "audio/ogg", oga: "audio/ogg", mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4" })[ext] || "audio/ogg";
}

async function aiTranscribeGemini(env, bytes, mime = "audio/ogg") {
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
            { inline_data: { mime_type: mime, data: bytesToBase64(bytes) } },
          ],
        }],
        generationConfig: { temperature: 0 },
      }),
    }
  );
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(`Gemini HTTP ${response.status}: ${detail}`);
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => String(part?.text || "")).join("").trim();
  if (!text) throw new Error("Gemini вернул пустую расшифровку");
  return text;
}

async function aiTranscribe(env, bytes, filename = "voice.ogg") {
  const mime = audioMime(filename);
  if (isGemini(env)) return aiTranscribeGemini(env, bytes, mime);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), filename);
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
  if (/^\/api\/(?:agent|settings|reminders|ai)/.test(path)) {
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

  if (path === "/api/ai/check" && method === "GET") {
    if (!aiEnabled(env)) return json({ ok: false, reason: "AI не настроен" }, 503);
    const probeModel = String(url.searchParams.get("model") || "").trim().slice(0, 80) || aiModel(env);
    try {
      const response = await fetch(aiUrl(env, "chat/completions"), {
        method: "POST",
        headers: { Authorization: `Bearer ${env.AI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: probeModel,
          messages: [{ role: "user", content: "Ответь одним словом: готово" }],
          temperature: 0,
        }),
      });
      if (!response.ok) {
        const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 200);
        return json({ ok: false, reason: `AI HTTP ${response.status}: ${detail}` }, 502);
      }
      const data = await response.json();
      const answer = String(data?.choices?.[0]?.message?.content || "").trim();
      if (!answer) return json({ ok: false, reason: "AI вернул пустой ответ" }, 502);
      return json({
        ok: true,
        provider: isGemini(env) ? "gemini" : "openai-compatible",
        model: probeModel,
        answer: answer.slice(0, 80),
      });
    } catch {
      return json({ ok: false, reason: "AI недоступен" }, 502);
    }
  }

  if (path === "/api/ai/models" && method === "GET") {
    if (!aiEnabled(env)) return json({ ok: false, reason: "AI не настроен" }, 503);
    try {
      const response = await fetch(aiUrl(env, "models"), {
        headers: { Authorization: `Bearer ${env.AI_API_KEY}` },
      });
      if (!response.ok) return json({ ok: false, reason: `AI HTTP ${response.status}` }, 502);
      const data = await response.json();
      const all = Array.isArray(data?.data)
        ? data.data.map((item) => String(item?.id || item?.name || "")).filter(Boolean)
        : [];
      const models = all.filter((id) => id.includes("gemini"));
      return json({ ok: true, models, all: all.slice(0, 40), keys: Object.keys(data || {}) });
    } catch {
      return json({ ok: false, reason: "AI недоступен" }, 502);
    }
  }

  // Админская проверка фото/голоса через те же функции, что использует бот.
  if (path === "/api/ai/probe" && method === "POST") {
    if (!aiEnabled(env)) return json({ ok: false, reason: "AI не настроен" }, 503);
    const body = await readBody(request);
    const kind = String(body?.kind || "").trim();
    const encoded = String(body?.data || "");
    if (!["vision", "audio"].includes(kind)) fail(422, "kind должен быть vision или audio");
    if (!encoded || encoded.length > 8_000_000) fail(422, "Некорректный размер данных");
    let bytes;
    try {
      const binary = atob(encoded);
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    } catch {
      fail(422, "Некорректный base64");
    }
    try {
      const text = kind === "vision"
        ? await aiVisionToText(env, bytes, String(body?.mime || "image/jpeg"))
        : await aiTranscribe(env, bytes, String(body?.filename || "voice.ogg"));
      return json({ ok: Boolean(String(text).trim()), text: String(text).slice(0, 4000) });
    } catch (error) {
      return json({ ok: false, reason: String(error?.message || error).slice(0, 200) }, 502);
    }
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
