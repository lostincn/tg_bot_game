const telegramApi = require("node-telegram-bot-api");
const { restart } = require("nodemon");
const { gameOptions, restartOptions } = require("./options");
const { token } = require("./token");
const sequelize = require("./db");
const UserModel = require("./models");

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

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`Всё работает`);
  } catch (error) {
    console.log("Что-то сломалось при подключении к ДБ", error);
  }
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

    try {
      if (text === "/start") {
        await UserModel.create({ chatId });
        await bot.sendMessage(chatId, `Добро пожаловать, ${firstName}!`);
        return bot.sendSticker(
          chatId,
          "https://cdn.tlgrm.app/stickers/d54/fa4/d54fa4ea-7d30-41b3-9ff1-01d4f85a2bd7/192/9.webp"
        );
      }
      if (text === "/info") {
        const user = await UserModel.findOne({ chatId });
        return bot.sendMessage(
          chatId,
          `Тебя зовут ${firstName ? firstName : ""} ${
            lastName ? lastName : ""
          }. В игре у тебя Правильных ответов - ${
            user.right
          }, Неправильных ответов - ${user.wrong}`
        );
      }
      if (text === "/game") {
        return startGame(chatId);
      }
      return bot.sendMessage(chatId, "Я тебя не понимаю, попробуй ещё раз!");
    } catch (error) {
      return bot.sendMessage(chatId, "Произошла ошибка");
    }
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;

    if (data === "/again") {
      return startGame(chatId);
    }
    const user = await UserModel.findOne({ chatId });
    if (data == chats[chatId]) {
      user.right += 1;
      await bot.sendMessage(
        chatId,
        `Поздравляю! Ты отгадал цифру ${chats[chatId]}`,
        restartOptions
      );
    } else {
      user.wrong += 1;
      await bot.sendMessage(
        chatId,
        `Ты выбрал не ту цифру. Бот загадал ${chats[chatId]}. Попробуй снова!`,
        restartOptions
      );
    }
    await user.save();
  });
};

start();
