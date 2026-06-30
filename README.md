# Демо бот-каталог «Табачный мир» — версия для показа владельцу

Готовая сборка для Vercel + Telegram webhook.

## Что исправлено в этой версии

- Удобнее оформление заявки с телефона.
- Добавлена кнопка «Скрыть клавиатуру» в форме заявки.
- Добавлена плавающая кнопка «Готово», когда открыта мобильная клавиатура.
- Поля формы автоматически прокручиваются в видимую область.
- При нажатии на категории, товары, отправку и закрытие заявки клавиатура закрывается.
- Улучшены размеры кнопок и поведение панели заявки на мобильном экране.
- Токен и ID группы по-прежнему задаются только через Vercel Environment Variables.

## Что внутри

- `miniapp/` — Telegram mini-app каталог.
- `api/webhook.py` — Telegram webhook для Vercel. Принимает `/start`, кнопки и заявки из mini-app.
- `bot/` — локальная версия бота через polling. Для Vercel она не нужна, оставлена как резерв.
- `index.html` — редирект на `miniapp/index.html`.
- `vercel.json` — открывает mini-app с корня домена.

## Как запустить на Vercel

1. Загрузить все файлы из этой папки в GitHub-репозиторий.
2. В Vercel сделать Redeploy.
3. В Vercel → Settings → Environment Variables добавить:

```env
BOT_TOKEN=токен_от_BotFather
WEBAPP_URL=https://tabachnymirbotdemo.vercel.app/miniapp/index.html
MANAGER_CHAT_ID=-100xxxxxxxxxx
```

`MANAGER_CHAT_ID` — ID группы менеджеров. Бота нужно добавить в эту группу.

4. Сделать Redeploy после добавления переменных.
5. Проверить webhook:

```text
https://tabachnymirbotdemo.vercel.app/api/webhook
```

Должен быть ответ:

```json
{"ok": true, "service": "tabachny-mir-telegram-webhook"}
```

6. Подключить webhook Telegram:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://tabachnymirbotdemo.vercel.app/api/webhook
```

После этого локальный `python bot.py` не нужен.

## Проверка

В Telegram открыть своего бота и написать `/start`.

Потом:

```text
Открыть бот-каталог → добавить товар в заявку → заполнить форму → отправить заявку
```

Заявка должна прийти в группу менеджеров.

## Важно

Не загружать `.env` и токены в GitHub. Все секреты хранить только в Vercel Environment Variables.
