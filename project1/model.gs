// Constructor (class inheritance)

var ParticipantCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "ParticipantsTest",
  {
    id: 13,
    username: 14,
    lang: 15,
    name: 2,
    surname: 3,
    nif: 4,
    photo: 5,
    email: 6,
    adress: 7,
    postalcode: 8,
    city: 9,
    workshop1: 10,
    workshop2: 11,
    timestamp: 1
  }
]);

// Constructor (class inheritance)

var WorkshopCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Programa",
  {
    id: 3,
    name: 4,
    hour: 2,
    category: 1,
    author: 5
  }
]);

// Constructor (class inheritance)

var ImageCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Imatges",
  {
    id: 1,
    uid: 2,
    filename: 3,
    url: 4,
    timestamp: 5
  }
]);

// Constructor (class inheritance)

var LogCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Log",
  {
    "timestamp": 1,
    "uid": 2,
    "text": 3,
    "lang": 4
  },
  "timestamp"
]);

// GAS context

(function(g) {
  // Data models
  g.DocumentModel = GAX.FileModel;
  g.FileModel = GAX.FileModel;
  g.QRModel = GAX.QRModel;
  // Data collections
  g.ParticipantCollection = new ParticipantCollection();
  g.WorkshopCollection = new WorkshopCollection();
  g.ImageCollection = new ImageCollection();
  g.Logs = new LogCollection();
  // Web services
  g.TelegramBotAPI = new Telegram.BotAPI(TELEGRAM_BOT_TOKEN);
})(this);
