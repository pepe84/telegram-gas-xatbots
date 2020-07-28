/***********
 * WEB APP *
 ***********/

function doGet(e) {
  var params = e.parameter;
  params['lang'] = params['lang'] || DEFAULT_LANG;

  switch (params['action']) {
    case 'confirmation':
      confirmation(params['uid'], params['token'], params['lang']);
      break;
    default:
      // Nothing to do
      return;
  }

  var text = "Action '" + params['action']  + "' (uid = '" + params['uid'] + "')";

  // Log
  Logs.store({
    timestamp: new Date(),
    uid: (params['uid'] || 'anonymous'),
    text: ("[GET]" + text),
    lang: params['lang']
  });

  return ContentService.createTextOutput(text);
}

function confirmation(uid, token, lang) {
  // User exists?
  var user = Users.getById(uid);
  var text;

  if (user) {
    if (user.status == 1) {
      // User already confirmed
      text = translate("Usuari '" + uid + "' ja validat.",lang);
    } else if (user.token == token) {
      // Valid token
      text = translate("Compte confirmat.",lang);
      // Success!
      user.status = 1;
      user.lastAccess = new Date();
      Users.store(user);
      // Confirmation mail
      var subject = "[" + TELEGRAM_BOT_NAME + "] " + translate("Registre finalitzat", lang);
      var body = translate("Procés de registre finalitzat correctament.", lang);
      MailApp.sendEmail(user.mail, subject, body, {
        name: TELEGRAM_BOT_NAME, // optional
        htmlBody: body.replace("\n", "<br/>")
      });
      // Confirmation message
      TelegramBotAPI.sendText(uid, body);
      return true;
    } else {
      // Invalid token
      text = translate("Token '" + token + "' no vàlid.",lang);
    }
  } else {
    // Error: User doesn't exists
    text = translate("Usuari inexistent.",lang);
  }

  Logs.store({
    timestamp: new Date(),
    uid: uid,
    text: text,
    lang: lang
  });
}

function doPost(e) {
  try {
    // Assigna les dades pasades per Telegram en format JSON
    var data    = JSON.parse(e.postData.contents);
    var vars    = data.message || data.callback_query;
    var message = data.message || data.callback_query.message;

    var uid     = vars.from.id;
    var lang    = vars.from.language_code;
    var chat_id = message.chat.id;
    var text    = vars.text || vars.data;

    var comanda, args;

    if (message.photo) {
      text = JSON.stringify(message.photo[0]);
      comanda = "upload";
      args = [];
    } else {
      var entrada = text.split(' ');
      comanda = entrada[0];
      args = entrada.slice(1);
    }

    // Log
    Logs.store({
      timestamp: new Date(),
      uid: uid,
      text: ("[POST]" + text),
      lang: lang
    });

    switch (comanda) {
      case '/start':
        TelegramBotAPI.sendText(chat_id, translate('Benvingut/Benvinguda al xatbot', lang) );
        menu(uid, lang);
        break;
      case '/ajuda':
        ajuda(chat_id, lang);
        break;
      case '/idioma':
        idioma(uid, lang);
        break;
      case '/setlang':
        if (args.length) {
          setlang(uid, args[0]);
        } else {
          TelegramBotAPI.sendText(uid, translate("Falta introduir l'idioma a continuació de la comanda.", lang));
        }
        break;
      case '/registre':
        if (args.length) {
          registre(uid, args[0], lang);
        } else {
          TelegramBotAPI.sendText(uid, translate("Falta introduir el teu correu electrònic a continuació de la comanda.", lang));
        }
        break;
      case '/spots':
        spots(uid, lang);
        break;
      case '/sessio':
        calendar(uid, lang);
        break;
      case '/fotos':
        drive(uid, lang);
        break;
      case 'upload':
        upload(uid, message.photo[0], lang);
        break;
      default:
        TelegramBotAPI.sendText(uid, translate("No entenc el que em demanes:", lang) + text);
    }
  } catch (exception) {
    Logs.store({
      timestamp: new Date(),
      uid: uid,
      text: "[ERROR] " + exception.message + "\n[RESP]" + JSON.stringify(e),
      lang: lang
    });
  }
}

function translate(msg, lang) {
  return (lang == DEFAULT_LANG) ? msg : LanguageApp.translate(msg, DEFAULT_LANG, lang);
}

function ajuda(chat_id, lang) {
  var msg =
      "Comandes del bot disponibles: \n\n" +
      "/ajuda - Informació sobre el bot \n" +
      "/registre - Registra el teu compte d'usuari \n" +
      "/idioma - Configura l'idioma \n" +
      "/perfil - Configura el teu servei de previsió meteorològica \n" +
      "/spots - Informació sobre els spots on podem anar. \n" +
      "/sessio - Crea una nova sessio surfera \n" +
      "/fotos - Veure fotos de sessions \n\n";
      "També pots pujar fotos públiques de les teves sessions.";

  TelegramBotAPI.sendText(chat_id,translate(msg,lang));
  return true;
}

function registre(uid, mail, lang) {
  // User exists?
  var user = Users.getById(uid);

  if (user) {
    if (user.mail == mail) {
      // Error: User already exists
      TelegramBotAPI.sendText(uid, translate('Ja has iniciat el procés de registre. Revisa el teu correu electrònic.', lang));
      return false;
    } else {
      // Work-around: User mail update
      user.mail = mail;
      user.token = GAX.Helpers.Random.token();
      user.status = 0;
    }
  } else {
    // Create new user (inactive)
    user = {
      "id": uid,
      "mail": mail,
      "token": GAX.Helpers.Random.token(),
      "lang": lang,
      "status": 0,
      "lastAccess": new Date()
    };
  }

  // Save changes
  Users.store(user);

  // QR code
  var url = GAX.Helpers.Web.generateUrl(SCRIPT_URL, {
    "action": "confirmation",
    "uid": user.id,
    "token": user.token,
    "lang": lang
  });
  var qrModel = new QRModel(url);
  var img = qrModel.getImage();

  // Registration mail
  var subject = "[" + TELEGRAM_BOT_NAME + "] " + translate("Registre en procés", lang);
  var body = translate("Si us plau, confirma el teu compte a través del següent enllaç:", lang) + "\n\n" + url;

  MailApp.sendEmail(user.mail, subject, body, {
    name: TELEGRAM_BOT_NAME, // optional
    htmlBody: body.replace("\n", "<br/>"),
    attachments: [img]
  });

  // Registration message
  TelegramBotAPI.sendText(uid, translate('Registre en procés. Revisa el teu correu electrònic.', lang));
  return true;
}

function getUser(uid, lang) {
  // Load user
  var user = Users.getById(uid);

  if (user) {
    // Update user
    user.lastAccess = new Date();
    Users.store(user);
    return user;
  } else {
    // Access not allowed
    TelegramBotAPI.sendText(uid,translate("Has de registrar-te primer!", lang));
    return null;
  }
}

function idioma(uid, lang){
  // Load user
  var user = getUser(uid, lang);
  if (!user) return;

  // Available languages
  var langs = {
    "ca": "🏴󠁥󠁳󠁣󠁴󠁿 Català",
    "es": "🇪🇸 Castellano / Español",
    "en": "🇬🇧 English",
    "fr": "🇫🇷 Français"
  };

  // Buttons
  var buttons = {};
  for (var i in langs) {
    buttons[i] = {
      "text": langs[i],
      "callback_data": "/setlang " + i
    };
  }

  TelegramBotAPI.sendText(uid, "<b>" + translate("Tria el teu idioma", lang) + "</b>", {
    inline_keyboard: [
      [ buttons["ca"], buttons["es"] ],
      [ buttons["en"], buttons["fr"] ]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  });
  return true;
}

function setlang(uid, lang) {
  // Load user
  var user = getUser(uid, lang);
  if (!user) return;

  if (user) {
    user.lang = lang;
    Users.store(user);
    TelegramBotAPI.sendText(uid, translate("Nou idioma desat: ", lang) + lang);
    return true;
  }

  return false;
}

function menu(uid, lang){
  // Load user
  var user = getUser(uid, lang);

  // Create menu
  var list = [];

  // Public access
  list.push(["/spots"]);

  // Private access
  if (user) {
    list.push(["/sessio", "/fotos"]);
  }

  TelegramBotAPI.sendText(uid, translate("Selecciona la teva opció:", lang), {
    keyboard: list,
    resize_keyboard: true,
    one_time_keyboard: true
  });

  return true;
}

function spots(uid, lang) {
  // Load spots as buttons
  var list = [];
  var buttonsRow = [];
  var pagination = 3;

  for (var spot of Spots) {
    // Add button
    if (spot.url) {
      buttonsRow.push({
        'text': spot.name,
        'url': spot.url
      });
    }
    // Add button row?
    if (buttonsRow.length == pagination) {
      list.push(buttonsRow);
      buttonsRow = []; // Reset
    }
  }

  // Add last button row?
  if (buttonsRow.length) {
    list.push(buttonsRow);
  }

  Logger.log(JSON.stringify(list));

  TelegramBotAPI.sendText(uid, translate("Consulta la previsió de:", lang), {
    inline_keyboard: list,
    resize_keyboard: true,
    one_time_keyboard: true
  });

  return true;
}

function calendar(uid, lang) {
  // @TODO
  TelegramBotAPI.sendText(uid, translate("Pendent d'implementar.", lang));
}

function calendar_channel() {
  // @TODO
  TelegramBotAPI.sendText(TELEGRAM_CHANNEL_ID, translate("Pendent d'implementar.", DEFAULT_LANG));
}

function upload(uid, photo, lang) {
  // Get image from Telegram
  var data = TelegramBotAPI.getFile(photo.file_id);
  var file = TelegramBotAPI.downloadFile(uid, data.result.file_path, FOLDER_ID);
  var fileUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();

  Uploads.store({
    "id": file.getId(),
    "uid": uid,
    "filename": file.getName(),
    "url": fileUrl,
    "timestamp": new Date()
  });

  TelegramBotAPI.sendText(uid, "Fitxer '" + file.getName() + "' desat (" + file.getSize() +" kb):\n" + fileUrl);

  return true;
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

function drive(uid, lang) {
  // Load user
  var user = getUser(uid, lang);
  if (!user) return;

  // Load images
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFiles();

  var list = [];
  list.push([{
    'text': "📂 " + folder.getName(),
    'url': folder.getUrl()
  }]);

  var buttonsRow = [];
  var pagination = 3;

  while (files.hasNext()) {

    var file = files.next();
    var type = file.getMimeType();
    var emoji = getFileEmoji(type);

    // Add button
    buttonsRow.push({
      'text': emoji + "  " + file.getName(),
      'url': file.getUrl()
    });
    // Add button row?
    if (buttonsRow.length == pagination) {
      list.push(buttonsRow);
      buttonsRow = []; // Reset
    }
  }

  // Add last button row?
  if (buttonsRow.length) {
    list.push(buttonsRow);
  }

  TelegramBotAPI.sendText(uid, translate("Galeria de sessions:", lang), {
    inline_keyboard: list,
    resize_keyboard: true,
    one_time_keyboard: true
  });

  return true;
}
