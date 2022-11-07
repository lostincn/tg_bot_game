const { Sequelize } = require("sequelize");
module.exports = new Sequelize("telegram_bot", "postgres", "limpoposhka", {
  host: "localhost",
  port: "7000",
  dialect: "postgres",
});
