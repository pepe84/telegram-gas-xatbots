/*************
 * FUNCTIONS *
 *************/

function genera_qr(uid) {
  var url = GAX.Helpers.Web.generateUrl(SCRIPT_URL, {
    "accio": "validar",
    "uid": uid
  });
  var qrModel = new QRModel(url);

  return qrModel.getImage();
}

function envia_mis() {

  // Obtindre dades
  var pa = ParticipantCollection.getLast();

  // Generem codi QR enllaçat a l'execució del script
  var img = genera_qr(pa.id);

  // Enviem correu d'inscripció
  var subject = "[" + TELEGRAM_BOT_NAME + "] " + "Inscripció III Jornades";
  var body =
    "Gracies per la teva inscripció " + pa['name'] + "!\n\n" +
    "Has formalitzat la teva inscripció a les III Jornades\n" +
    "T'has inscrit als tallers:\n" +
    " * Franja 1: " + pa['workshop1'] + "\n"
    " * Franja 2: " + pa['workshop2'] + "\n\n"
    "Mostra el codi QR que t'adjuntem a l'entrada per validar la teva presència.";

  MailApp.sendEmail(pa.email, subject, body, {
    name: TELEGRAM_BOT_NAME, // optional
    htmlBody: body.replace("\n", "<br/>"),
    attachments: [img]
  });
}

function genera_diploma(exportType) {
  // Generar nou document a partir de la plantilla
  var docTpl = new DocumentModel(DOCUMENT_ID);
  var docCopy = docTpl.multiclone("Diplomes", ParticipantCollection, {
    "name": "{nom}",
    "surname": "{cognoms}",
    "nif": "{nif}"
  });

  // Moure document
  var file1 = new FileModel(paCollection.getId());
  var file2 = new FileModel(docCopy.getId());
  file2.move(file1.getFolder());

  // Exportar document?
  if (exportType) {
    var file3 = file2.export(exportType);
    file3.move(file1.getFolder());
  }

  return docCopy;
}

/***********
 * WEB APP *
 ***********/

function doGet(e) {
  var accio = e.parameter.accio;
  var id = e.parameter.uid;

  switch (accio) {
    case 'validar' :
      return ContentService.createTextOutput("He rebut acció validar del id = " + id ) ;
  }
}

function doPost(e) {
  // Assigna les dades pasades per Telegram en format JSON
  var data    = JSON.parse(e.postData.contents);
  var update_id  = data.update_id;

  var vars    = data.message || data.callback_query;
  var message = data.message || data.callback_query.message;

  var id         = vars.message_id || vars.id;

  var uid        = vars.from.id;
  var is_bot     = vars.from.is_bot;
  var name       = vars.from.first_name;
  var username   = vars.from.username;
  var lang       = vars.from.language_code;

  var message_id = message.message_id;
  var chat_id    = message.chat.id;
  var date       = message.date;

  var text       = vars.text || vars.data;

  var lang = assigna_idioma(uid, lang);

  try {

    if(data.message.photo /*&& text && text.indexOf("Jornades") > -1*/) {
      // Log data
      Logs.store({
        timestamp: new Date(),
        uid: uid,
        text: JSON.stringify(data.message.photo[0]),
        lang: lang
      });
      // Upload photo
      uploadImage(chat_id, data.message.photo[0], lang);
    } else {
      // Log command
      Logs.store({
        timestamp: new Date(),
        uid: uid,
        text: text,
        lang: lang
      });
      // Separa les paraules entrades en una matriu/array per obtenir la comanda i els valors
      var entrada = text.split('@')[0].split(' '),
          comanda = entrada[0],
          args    = entrada[1];

      switch (comanda) {
        case '/start':
          TelegramBotAPI.sendText(chat_id, translate('Benvingut/Benvinguda al xatbot', lang));
          break;
        case '/ajuda':
          ajuda(chat_id, lang);
          break;
        case '/lang':
          menu_idioma(chat_id, lang);
          break;
        case '/config':
          canvia_idioma(uid, args);
        case '/info':
          info(chat_id, lang);
          break;
        case '/entrada':
          qr(chat_id, lang);
          break;
        case '/tallers':
          TelegramBotAPI.sendText(chat_id, translate("No implementat", lang));
          break;
        case '/certificat':
          TelegramBotAPI.sendText(chat_id, translate("No implementat", lang));
          break;
        default:
          TelegramBotAPI.sendText(uid, translate("No entenc el que em demanes:", lang) + text);
      }
    }
  } catch (e) {
    Logs.store({
      timestamp: new Date(),
      uid: uid,
      text: e.message,
      lang: lang
    });
  }
}

function translate(msg, lang) {
  return (lang == DEFAULT_LANG) ? msg : LanguageApp.translate(msg, DEFAULT_LANG, lang);
}

function ajuda(chat_id, lang) {
  var msg =
      "Aquest Xatbot té com objectiu ajudar-te en el desenvolupament de les <b>III Jornades Docents </b> " +
      "Pots accedir a les comandes del xatbot clicant sobre la '/' i escollint l'opció desitjada \n\n " +
      "Les comandes que pots activar directament son: \n\n" +
      "/ajuda - Informació sobre el bot \n" +
      "/lang - Idiomes disponibles pel bot \n" +
      "/config - Selecciona idioma de comunicació del xatbot \n" +
      "/info - Informació sobre les Jornades \n" +
      "/entrada - Codi QR per entrar o validar-se \n" +
      "/tallers - Tallers assignats\n " +
      "/certificat - Certificat d'assistència";

  TelegramBotAPI.sendText(chat_id,translate(msg,lang));
  return true;
}

function assigna_idioma(uid, lang) {
  var item = ParticipantCollection.getById(uid);

  return item ? item.lang : DEFAULT_LANG;
}

function menu_idioma(chat_id, lang) {
  var command = "/config";
  var msg = translate("Ara tens configurat l'idioma:", lang) + " " + lang + "\n\n" +
            translate("Selecciona idioma", lang);

  TelegramBotAPI.sendText(chat_id, msg, {
    inline_keyboard: new Array(
      [{"text": translate("Castellà",lang), "callback_data": command + " es"},
       {'text': translate("Català",lang), "callback_data": command + " ca"},
       {"text": translate("Basc",lang),"callback_data": command + " eu"}],
      [{"text": translate("Anglès",lang),"callback_data": command + " en"},
       {"text": translate("Francés",lang),"callback_data": command + " fr"},
       {"text": translate("Gallego",lang),"callback_data": command + " gl"}],
      [{"text": translate("Àrab",lang), "callback_data": command + " ar"},
       {"text": "Tancar","callback_data": "/tancar"}]),
    resize_keyboard: true,
    one_time_keyboard: true
  });

  return true;
}

function canvia_idioma(uid, lang) {
  var item = ParticipantCollection.getById(uid);

  if (item) {
      // Save new language
      item.lang = lang;
      ParticipantCollection.store(item);
      // Notify
      TelegramBotAPI.sendText(uid,translate("El nou idioma ara és: ", lang) + lang);
      return true;
  } else {
    TelegramBotAPI.sendText(uid, translate("No s'ha pogut desar el canvi d'idioma: ", lang) + lang);
    return false;
  }
}

function info(uid, lang) {
  var msg = "<b> Programa III Jornades </b> \n\n";

  for (var item of WorkshopCollection) {
    msg = msg +
      item.hour + " " + " " + item.id + " " +
      "<i>" + item.name + "</i> (" + item.author + ")\n \n";
  }

  TelegramBotAPI.sendText(uid, translate(msg, lang));
  return true;
}

function qr(uid, lang) {
  // Generem codi QR enllaçat a l'execució del script
  var img = genera_qr(uid);
  var caption = translate("Entrada a les III Jornades", lang);

  TelegramBotAPI.sendPhoto3(uid, img, caption);

  return true;
}

function uploadImage(uid, photo, lang) {
  // Get image from Telegram
  var data = TelegramBotAPI.getFile(photo.file_id);
  var file = TelegramBotAPI.downloadFile(uid, data.result.file_path, FOLDER_ID);
  var fileUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();

  ImageCollection.store({
    "id": file.getId(),
    "uid": uid,
    "filename": file.getName(),
    "url": fileUrl,
    "timestamp": new Date()
  });

  TelegramBotAPI.sendText(uid, "Fitxer '" + file.getName() + "' desat (" + file.getSize() +" kb):\n" + fileUrl);

  return true;
}
