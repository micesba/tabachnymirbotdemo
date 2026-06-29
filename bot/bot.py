import asyncio
import json
import os
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com/miniapp/index.html")
MANAGER_CHAT_ID = os.getenv("MANAGER_CHAT_ID", "")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is missing. Create .env from .env.example")

bot = Bot(BOT_TOKEN)
dp = Dispatcher()


def main_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛒 Открыть бот-каталог", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="📄 Получить прайс", callback_data="price"), InlineKeyboardButton(text="📍 Адрес ФУТСИТИ", callback_data="address")],
        [InlineKeyboardButton(text="🚚 Доставка", callback_data="delivery"), InlineKeyboardButton(text="👤 Менеджер", callback_data="manager")],
    ])


@dp.message(CommandStart())
async def start(message: Message):
    await message.answer(
        "Добро пожаловать в демо бот-каталог «Табачный мир».\n\n"
        "Здесь клиент может открыть каталог, выбрать категорию, запросить прайс и оставить заявку менеджеру.",
        reply_markup=main_keyboard()
    )


@dp.callback_query(F.data == "price")
async def price(callback):
    await callback.message.answer("Чтобы получить прайс, откройте каталог и отправьте заявку, либо напишите менеджеру: @manager_username")
    await callback.answer()


@dp.callback_query(F.data == "address")
async def address(callback):
    await callback.message.answer("ФУТСИТИ. Точный адрес и ориентир добавим после подтверждения владельцем.")
    await callback.answer()


@dp.callback_query(F.data == "delivery")
async def delivery(callback):
    await callback.message.answer("Доставка по Москве и отправка в регионы согласовываются с менеджером после заявки.")
    await callback.answer()


@dp.callback_query(F.data == "manager")
async def manager(callback):
    await callback.message.answer("Менеджер: @manager_username")
    await callback.answer()


@dp.message(F.web_app_data)
async def webapp_order(message: Message):
    try:
        data = json.loads(message.web_app_data.data)
    except Exception:
        await message.answer("Получили заявку, но не смогли прочитать данные. Менеджер свяжется вручную.")
        return

    client = data.get("client", {})
    items = data.get("items", [])
    items_text = "\n".join([f"• {x.get('title')} — {x.get('category')} — {x.get('price')} × {x.get('qty', 1)}" for x in items]) or "Прайс / консультация"
    text = (
        "🆕 Новая заявка из демо бот-каталога\n\n"
        f"Клиент: {client.get('name', '-')}\n"
        f"Город: {client.get('city', '-')}\n"
        f"Контакт: {client.get('contact', '-')}\n"
        f"Комментарий: {client.get('comment', '-')}\n\n"
        f"Интересует:\n{items_text}\n\n"
        f"Пользователь Telegram: @{message.from_user.username or '-'} / ID {message.from_user.id}"
    )

    if MANAGER_CHAT_ID:
        await bot.send_message(MANAGER_CHAT_ID, text)
    await message.answer("Заявка отправлена менеджеру. Скоро с вами свяжутся.")


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
