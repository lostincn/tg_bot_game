const telegramApi = require("node-telegram-bot-api");
const { restart } = require("nodemon");
const { gameOptions, restartOptions } = require("./options");
const token = "5656952066:AAHc7eyo7Sr4Gyu350iKZiQ4OSAJ3FS-1Yk";

const bot = new telegramApi(token, { polling: true });

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(
    chatId,
    "Бот загадывает цифру от 0 до 9, а ты должен её отгадать!"
  );
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  console.log(chats[chatId]);
  await bot.sendMessage(chatId, "Можешь начинать", gameOptions);
};

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начало работы и приветствие от бота" },
    { command: "info", description: "Получить информацию о пользователе" },
    {
      command: "/game",
      description: "Отгадай число",
    },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    const firstName = msg.chat.first_name;
    const lastName = msg.chat.last_name;

    if (text === "/start") {
      await bot.sendMessage(chatId, `Добро пожаловать, ${firstName}!`);
      return bot.sendSticker(
        chatId,
        "https://cdn.tlgrm.app/stickers/d54/fa4/d54fa4ea-7d30-41b3-9ff1-01d4f85a2bd7/192/9.webp"
      );
    }
    if (text === "/info") {
      return bot.sendMessage(
        chatId,
        `Тебя зовут ${firstName ? firstName : ""} ${lastName ? lastName : ""}`
      );
    }
    if (text === "/game") {
      return startGame(chatId);
    }
    return bot.sendMessage(chatId, "Я тебя не понимаю, попробуй ещё раз!");
  });
  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;

    if (data === "/again") {
      return startGame(chatId);
    }
    if (data === chats[chatId]) {
      return bot.sendMessage(
        chatId,
        `Поздравляю! Ты отгадал цифру ${chats[chatId]}`,
        restartOptions
      );
    } else {
      return bot.sendMessage(
        chatId,
        `Ты выбрал не ту цифру. Бот загадал ${chats[chatId]}. Попробуй снова!`,
        restartOptions
      );
    }
  });
};

start();
