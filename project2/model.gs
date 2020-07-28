// Constructor (class inheritance)

var LogCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Logs",
  {
    "timestamp": 1,
    "uid": 2,
    "text": 3,
    "lang": 4
  },
  "timestamp"
]);

// Constructor (class inheritance)

var UserCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Usuaris",
  {
    "id": 1,
    "roles[]": 2,
    "lang": 3,
    "lastAccess": 4,
    "qdone[]": 5,
    "qpoints[]": 6,
    "qualification": 7
  }
]);

// Constructor (class inheritance)

var QuizCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Preguntes",
  {
    "id": 1,
    "question": 2,
    "option1": 3,
    "option2": 4,
    "option3": 5,
    "answer": 6 // correct option
  }
]);

// GAS context

(function(g) {
  // Data collections
  g.Logs      = new LogCollection();
  g.Users     = new UserCollection();
  g.Questions = new QuizCollection();
  // Web services
  g.TelegramBotAPI = new Telegram.BotAPI(TELEGRAM_BOT_TOKEN);
})(this);
