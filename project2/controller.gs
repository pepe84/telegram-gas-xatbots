/*************
 * FUNCTIONS *
 *************/

function meteo_channel() {
  meteo(TELEGRAM_CHANNEL_ID, DEFAULT_LANG);
}

/***********
 * WEB APP *
 ***********/

function doPost(e) {
  // Assigna les dades pasades per Telegram en format JSON
  var data    = JSON.parse(e.postData.contents);
  var vars    = data.message || data.callback_query;
  var message = data.message || data.callback_query.message;

  var uid     = vars.from.id;
  var lang    = vars.from.language_code;
  var chat_id = message.chat.id;
  var text    = vars.text || vars.data;

  var entrada = text.split('@')[0].split(' '),
      comanda = entrada[0],
      args    = entrada[1];

  // Log
  Logs.store({
    timestamp: new Date(),
    uid: uid,
    text: text,
    lang: lang
  });

  switch (comanda) {
    case '/start':
      TelegramBotAPI.sendText(chat_id, translate('Benvingut/Benvinguda al xatbot', lang));
      break;
    case '/ajuda':
      ajuda(chat_id, lang);
      break;
    case '/meteo':
      meteo(chat_id, lang);
      break;
    case '/test':
      test(uid, lang);
      break;
    case '/res':
      var values = args.split('-');
      resultat(uid, values[0], values[1], lang);
      break;
    case '/puntuacio':
      puntuacio(uid, lang);
      break;
    case '/menu':
      menu(uid, lang);
      break;
    case '/drive':
      drive(chat_id, lang);
      break;
    default:
      TelegramBotAPI.sendText(uid, translate("No entenc el que em demanes:", lang) + text);
  }
}

function translate(msg, lang) {
  return (lang == DEFAULT_LANG) ? msg : LanguageApp.translate(msg, DEFAULT_LANG, lang);
}

function ajuda(chat_id, lang) {
  var msg =
      "Aquest Xatbot té com objectiu gestionar una <b>aula</b>." +
      "Les comandes disponibles son: \n\n" +
      "/ajuda - Informació sobre el bot \n" +
      "/meteo - Previsió del temps al nostre institut \n" +
      "/test - Qüestionari \n" +
      "/puntuacio - Puntuació del qüestionari";

  TelegramBotAPI.sendText(chat_id,translate(msg,lang));
  return true;
}

function meteo(id, lang) {
  // OpenWeather request
  var api = new OpenWeather.WeatherAPI(OW_API_KEY, lang ? lang : DEFAULT_LANG);
  var data = api.getCurrentWeatherData(DEFAULT_LAT, DEFAULT_LON);

  // Telegram output
  var lineBreak = "%0A";
  var icon = api.getIconUrl(data.weather[0].icon);
  var caption = "[" + data.name + "]" + lineBreak +
    "Temperatura actual = " + data.main.temp + " ºC" + lineBreak +
    "Humitat = " + data.main.humidity + "%25" + lineBreak +
    "Pressió =  " + data.main.pressure + " mb" + lineBreak +
    "Temps general = " + data.weather[0].description + lineBreak;

  TelegramBotAPI.sendPhoto(id, icon, caption);
}

function validat(uid, lang) {
  // Load user
  var user = Users.getById(uid);

  if (user) {
    // Update user
    user.lastAccess = new Date();
    Users.store(user);
    return true;
  } else {
    // Access not allowed
    TelegramBotAPI.sendText(uid,translate("Accés no autoritzat.", lang));
    return false;
  }
}

function test(uid, lang){
  try {
    // Load user
    var user = Users.getById(uid);

    // Checks before continue
    // TODO fix lastAccess rows duplication
    if (!validat(uid, lang) || finalitzat_(user, lang)) {
      return;
    }

    // Otherwise, load next question
    // TODO fix load error
    var pending = [];
    for (var q of Questions) {
      var qid = String(q.id);
      if (!user.qdone.includes(qid)) {
        pending.push(q);
      }
    }
    var random = Math.floor((Math.random() * pending.length) + 1);
    var qRandom = pending[random];

    // Save next question as answered (before user answer)
    user.qdone.push(qRandom.id);
    Users.store(user);

    // Answer question using buttons
    TelegramBotAPI.sendText(uid, "<b><i>" + qRandom.question + "</i></b>", {
      inline_keyboard: [
        [{"text": "a) " + qRandom.option1, "callback_data": "/res " + qRandom.id + "-1"}],
        [{"text": "b) " + qRandom.option2, "callback_data": "/res " + qRandom.id + "-2"}],
        [{"text": "c) " + qRandom.option3, "callback_data": "/res " + qRandom.id + "-3"}]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return true;

  } catch (e) {
    Logs.store({
      timestamp: new Date(),
      uid: uid,
      text: e.message,
      lang: lang
    });
    return false;
  }
}

function puntuacio(uid, lang) {
  // Load user
  var user = Users.getById(uid);

  finalitzat_(user, lang) ;
}

function finalitzat_(user, lang) {
  // Load answers
  var totalP = GAX.Helpers.Array.sum(user.qpoints);
  var totalA = user.qdone.length;

  // Load questions
  var totalQ = Questions.count();

  // Quiz already finished?
  var qualification = totalP + "/" + totalA;

  if (totalA >= totalQ) {
    TelegramBotAPI.sendText(user.id, translate("Qüestionari finalitzat amb la puntuació: ", lang) + qualification);
    return true;
  } else {
    TelegramBotAPI.sendText(user.id, translate("Puntuació actual: ", lang) + qualification);
    return false;
  }
}

function resultat(uid, qid, answer, lang) {
  try {
    // Load user
    var user = Users.getById(uid);

    // Load question
    var q = Questions.getById(qid);

    // Correct answer?
    var point = (answer == q.answer) ? 1 : 0;

    // Save points
    user.qpoints.push(point);
    Users.store(user);

    // Load next question
    var totalA = user.qdone.length;
    var totalQ = Questions.count();

    if (!finalitzat_(user, lang)) {
      TelegramBotAPI.sendText(uid, translate("Vols continuar?", lang), {
        inline_keyboard: [
          [{"text": translate("Nova pregunta", lang), "callback_data": "/test"}]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      });
    }
    return true;

  } catch (e) {
    Logs.store({
      timestamp: new Date(),
      uid: uid,
      text: e.message,
      lang: lang
    });
    return false;
  }
}

function menu(uid, lang){
  try {
    var list = [];

    // All roles permissions (3 buttons/line)
    list.push([
      {"text": translate("CodiQR", lang), "callback_data": "/TODO"},
      {"text": translate("Qualificacions", lang), "callback_data": "/puntuacio"},
      {"text": translate("Test", lang), "callback_data": "/test"}
    ]);

    // Custom permissions (1 button/line)
    var user = Users.getById(uid);

    if (user.roles.includes("professor")) {
      list.push([
        {"text": translate("Llistat", lang), "callback_data": "/TODO"}
      ]);
    }

    if (user.roles.includes("professor") || user.roles.includes("delegat")) {
      list.push([
        {"text": translate("Reunions", lang), "callback_data": "/TODO"}
      ]);
    }

    TelegramBotAPI.sendText(uid, translate("Selecciona la teva opció:", lang), {
      inline_keyboard: list,
      resize_keyboard: true,
      one_time_keyboard: true
    });

    return true;

  } catch (e) {
    Logs.store({
      timestamp: new Date(),
      uid: uid,
      text: e.message,
      lang: lang
    });
    return false;
  }
}

function getFileEmoji (type) {
  var emoji;

  if (type.indexOf('image') > -1) {
    emoji = "🌆";
  } else if (type.indexOf('text') > -1) {
    emoji =  "📋";
  } else if (type.indexOf('ogg') > -1) {
    emoji = "🎧";
  } else if (type.indexOf('mp4') > -1) {
    emoji = "🎥";
  } else {
    emoji = "💾";
  }

  return emoji;
}

function drive(chat_id, lang) {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFiles();

  var list = [
    [{'text': "📂 " + folder.getName() , 'url': folder.getUrl()}]
  ];

  var buttonsRow = [];

  while (files.hasNext()) {

    var file = files.next();
    var type = file.getMimeType();
    var emoji = getFileEmoji(type);

    // Add button
    buttonsRow.push({'text': emoji + "  " + file.getName() , 'url': file.getUrl() });

    // Add button row?
    if (buttonsRow.length == 3) {
      list.push(buttonsRow);
      buttonsRow = []; // Reset
    }
  }

  // Add last button row?
  if (buttonsRow.length) {
    list.push(buttonsRow);
  }

  TelegramBotAPI.sendText(chat_id, translate("Fitxers Drive:", lang), {
    inline_keyboard: list,
    resize_keyboard: true,
    one_time_keyboard: true
  });

  return true;
}
