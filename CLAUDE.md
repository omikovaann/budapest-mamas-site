# Budapest Mamas Project

Полное описание архитектуры, монетизации, free/paid структуры и известных проблем — в
[`docs/architecture.md`](docs/architecture.md). Этот файл — короткая практическая шпаргалка.

## Репозитории

- Приватный (полный проект, рабочая копия): `github.com/omikovaann/budapest-mamas`, ветка `main`
- Публичный (только `website/` + `docs/`, для чтения Claude.ai через raw.githubusercontent.com):
  `github.com/omikovaann/budapest-mamas-site`, ветка `master`
- Локально: ветка `main-archive-backup` хранит полную старую историю с архивом чата
  (книги + переписка) — не пушится никуда, не трогать

## Важные файлы

- `telegram-bot/config.py` — НЕ коммитить (токены)
- `website/` — сайт, Netlify следит за `main` и деплоит сам при `git push` (base directory `website`)
- `website/netlify/functions/check-code.js` — серверная проверка кода доступа
- `.gitignore` — исключает `archive/` и другие дампы переписки чата (личные данные
  участниц + чужие книги). Не возвращать их в git.

## Команды

### Задеплоить сайт
Обычно не нужно — Netlify подключён к GitHub и деплоит сам при `git push` в `main`.
Ручной запуск (форс-мажор):
```bash
cd website
netlify deploy --prod --dir .
```

### Обновить переменную окружения Netlify (например, новый SheetDB URL)
```bash
cd website
netlify env:set SHEETDB_API_URL "https://sheetdb.io/api/v1/..."
netlify deploy --prod --dir .   # переменная требует редеплоя
```

### Обработать новый экспорт чата
Бота убрали из группового чата — живого сбора сообщений больше нет.
Вместо этого: Telegram Desktop → `⋮` на чате → Export chat history → формат **JSON** → скормить файл:
```bash
cd telegram-bot
python import_export.py путь/к/result.json
```
Категоризация (LLM), сохранение и загрузка в NotebookLM работают как раньше — поменялся
только способ получить сами сообщения.

### Создать NotebookLM блокнот
```bash
cd C:\Users\styl\Documents\notebooklm-py
.\venv\Scripts\activate
python -m notebooklm create "Budapest Mamas Knowledge Base"
```

## Рабочий процесс еженедельного обновления

1. Экспортируешь чат вручную из Telegram Desktop (JSON) → `import_export.py` категоризирует (LLM)
2. `analyze.py` предлагает правки по категориям
3. Человек утверждает
4. `apply.py` применяет правки к нужной странице, проверяет целостность разметки
5. Git commit → `git push` → Netlify деплоит сам

Подробности пайплайна, монетизации и free/paid раскладки по страницам — в
`docs/architecture.md`.
