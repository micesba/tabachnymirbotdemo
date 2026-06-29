import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://tabachnymirbotdemo.vercel.app/miniapp/index.html")
MANAGER_CHAT_ID = os.environ.get("MANAGER_CHAT_ID", "")


def tg_api(method: str, payload: dict):
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is missing")
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main_keyboard():
    return {
        "inline_keyboard": [
            [{"text": "🛒 Открыть бот-каталог", "web_app": {"url": WEBAPP_URL}}],
            [
                {"text": "📄 Получить прайс", "callback_data": "price"},
                {"text": "📍 Адрес ФУТСИТИ", "callback_data": "address"},
            ],
            [
                {"text": "🚚 Доставка", "callback_data": "delivery"},
                {"text": "👤 Менеджер", "callback_data": "manager"},
            ],
        ]
    }


def send_message(chat_id, text, reply_markup=None):
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return tg_api("sendMessage", payload)


def answer_callback(callback_id: str):
    if callback_id:
        tg_api("answerCallbackQuery", {"callback_query_id": callback_id})


def handle_start(message):
    chat_id = message["chat"]["id"]
    send_message(
        chat_id,
        "Добро пожаловать в демо бот-каталог «Табачный мир».\n\n"
        "Здесь клиент может открыть каталог, выбрать категорию, "
        "запросить прайс и оставить заявку менеджеру.",
        main_keyboard(),
    )


def handle_callback(callback):
    data = callback.get("data")
    chat_id = callback["message"]["chat"]["id"]
    callback_id = callback.get("id")

    texts = {
        "price": "Чтобы получить прайс, откройте каталог и отправьте заявку, либо напишите менеджеру.",
        "address": "ФУТСИТИ. Точный адрес и ориентир добавим после подтверждения владельцем.",
        "delivery": "Доставка по Москве и отправка в регионы согласовываются с менеджером после заявки.",
        "manager": "Менеджер свяжется с вами после заявки. В полной версии добавим актуальный контакт.",
    }

    answer_callback(callback_id)
    send_message(chat_id, texts.get(data, "Откройте каталог и отправьте заявку."))


def handle_webapp_order(message):
    chat_id = message["chat"]["id"]
    raw = message.get("web_app_data", {}).get("data", "{}")

    try:
        data = json.loads(raw)
    except Exception:
        send_message(chat_id, "Получили заявку, но не смогли прочитать данные. Менеджер свяжется вручную.")
        return

    client = data.get("client", {}) or {}
    items = data.get("items", []) or []
    items_text = "\n".join(
        [
            f"• {x.get('title', '-')} — {x.get('category', '-')} — {x.get('price', '-')} × {x.get('qty', 1)}"
            for x in items
        ]
    ) or "Прайс / консультация"

    user = message.get("from", {}) or {}
    username = user.get("username") or "-"
    user_id = user.get("id") or "-"

    text = (
        "🆕 Новая заявка из демо бот-каталога «Табачный мир»\n\n"
        f"Клиент: {client.get('name', '-')}\n"
        f"Город: {client.get('city', '-')}\n"
        f"Контакт: {client.get('contact', '-')}\n"
        f"Комментарий: {client.get('comment', '-')}\n\n"
        f"Интересует:\n{items_text}\n\n"
        f"Пользователь Telegram: @{username} / ID {user_id}"
    )

    if MANAGER_CHAT_ID:
        send_message(MANAGER_CHAT_ID, text)
    else:
        send_message(chat_id, "MANAGER_CHAT_ID не задан. Заявка не отправлена менеджеру.")
        return

    send_message(chat_id, "Заявка отправлена менеджеру. Скоро с вами свяжутся.")


def process_update(update):
    message = update.get("message")
    if message:
        if message.get("web_app_data"):
            handle_webapp_order(message)
            return
        text = message.get("text", "")
        if text.startswith("/start"):
            handle_start(message)
            return

    callback = update.get("callback_query")
    if callback:
        handle_callback(callback)
        return


class handler(BaseHTTPRequestHandler):
    def _send_json(self, code=200, payload=None):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(payload or {"ok": True}, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        self._send_json(200, {"ok": True, "service": "tabachny-mir-telegram-webhook"})

    def do_POST(self):
        try:
            length = int(self.headers.get("content-length", "0"))
            body = self.rfile.read(length).decode("utf-8")
            update = json.loads(body or "{}")
            process_update(update)
            self._send_json(200, {"ok": True})
        except Exception as e:
            # Telegram должен получить 200, иначе он будет повторять запросы.
            print("Webhook error:", repr(e))
            self._send_json(200, {"ok": False, "error": str(e)})
