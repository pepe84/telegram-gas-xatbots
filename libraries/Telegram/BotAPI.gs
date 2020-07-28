/**
 *
 * Telegram Bot API
 *
 * @see https://core.telegram.org/bots/api#making-requests
 * @see https://api.telegram.org/botAPI_KEY/getUpadtes
 * @see https://api.telegram.org/botAPI_KEY/setWebhook?url=url_WebAppUrl
 *
 * Codis HTML permessos per Telegram:
 *
 * <b> negreta </b>, <strong> negreta </strong>
 * <i> cursiva </i>, <em> cursiva </em>
 * <u> subratllar </u>, <ins> subratllar </ins>
 * <s> strikethrough </s>, <strike> strikethrough </strike>, <del> strikethrough </del>
 * <b> negreta <i> cursiva negreta <s> cursiva en negreta en cursiva </s> <u> subratlla en negreta en cursiva </u> </i> negreta </b>
 * <a href="http://www.example.com/"> URL en línia </a>
 * <a href="tg://user?id=123456789"> esment en línia d'un usuari </a>
 * <code> codi d'amplada fixa en línia </code>
 * <pre> Bloc de codi de l'amplada fixa preformatat </pre>
 * <pre> <code class = "language-python"> bloc de codi preformatat d’amplada fixa escrit en el llenguatge de programació de Python </code> </pre>
 *
 */

// Constructor

var BotAPI = function(token){
  this.token = token;
  var baseUrl  = "https://api.telegram.org";
  this.apiUrl  = baseUrl + "/bot" + token;
  this.fileUrl = baseUrl + "/file/bot"  + token;
};

(function(g, api){

  // Private methods

  var _getResponse = function (url, options){
    var response = UrlFetchApp.fetch(url, options ? options : {});
    Logger.log(response.getContentText());
    return response;
  };

  // Public methods

  api.prototype.sendDocument = function(chat_id, file) {
    var url = this.apiUrl + "/sendDocument?chat_id=" + chat_id + "&document=" + file;
    return _getResponse(url);
  };

  api.prototype.sendDocument2 = function(chat_id, file_id, caption) {
    var img = DriveApp.getFileById(file_id);
    var blob2 = img.getBlob().getAs("text/plain");

    var url = this.apiUrl + '/';

    return _getResponse(url, {
      method: "POST",
      payload: {
        method: "sendDocument",
        chat_id: String(chat_id),
        photo: blob2,
        caption : caption,
        parse_mode: "HTML"
        //disable_web_page_preview: true,
      },
      muteHttpExceptions : true
    });
  };

  api.prototype.sendText = function(chat_id,text,keyBoard) {

    keyBoard = keyBoard || 0;

    var payload = {
        method: "sendMessage",
        chat_id: String(chat_id),
        text: text,
        parse_mode: "HTML"
    };

    if (keyBoard.inline_keyboard || keyBoard.keyboard) {
      payload.reply_markup = JSON.stringify(keyBoard);
    }

    var url = this.apiUrl + '/';

    return _getResponse(url, {
      method: "POST",
      payload: payload
    });
  };

  api.prototype.sendText3 = function(chat_id,text) {
    // var url = this.apiUrl + "/sendMessage?chat_id=" + chat_id + "&text=" +text +"&parse_mode=html";
    var url = this.apiUrl + "/sendMessage?chat_id=" + chat_id + "&text=" +text ;
    return _getResponse(url);
  };

  api.prototype.sendPhoto = function(chat_id,photo,caption) {
    var url = this.apiUrl + "/sendPhoto?chat_id=" + chat_id + "&photo=" + photo +"&caption=" + caption;
    return _getResponse(url);
  };

  api.prototype.sendPhoto2 = function(chat_id,file_id,caption) {
    var img = DriveApp.getFileById(file_id);
    var blob2 = img.getBlob();

    return this.sendPhoto3(chat_id,blob2,caption);
  };

  api.prototype.sendPhoto3 = function(chat_id,blob2,caption) {

    var url = this.apiUrl + '/';

    return _getResponse(url, {
      method: "POST",
      payload: {
        method: "sendPhoto",
        chat_id: String(chat_id),
        photo: blob2,
        caption : caption,
        parse_mode: "HTML"
        //disable_web_page_preview: true,
      },
      muteHttpExceptions : true
    });
  };

  api.prototype.sendVideo = function(chat_id,fitxer) {
    var url = this.apiUrl + "/sendVideo?chat_id=" + chat_id + "&video=" + fitxer;
    return _getResponse(url);
  };

  api.prototype.sendLocation = function(chat_id,lat,long) {
    var url = this.apiUrl + "/sendlocation?chat_id=" + chat_id + "&latitude=" + lat + "&longitude=" + long ;
    return _getResponse(url);
  };

  api.prototype.deleteMessage = function(chat_id,messageId) {
    var url = this.apiUrl + "/deleteMessage?chat_id=" + chat_id + "&message_id=" + messageId;
    return _getResponse(url);
  };

  api.prototype.getFile = function(file_id) {
    var url = this.apiUrl + "/getFile?file_id=" + file_id;
    var response = _getResponse(url);
    var rc = response.getResponseCode();

    return (rc == 200) ? JSON.parse(response.getContentText()) : null;
  };

  api.prototype.downloadFile = function(chat_id, file_path, folder_id) {
    var fileUrl = this.fileUrl + "/" + file_path;
    var response = _getResponse(fileUrl, {
      muteHttpExceptions: true
    });
    var rc = response.getResponseCode();

    if (rc == 200) {
      var blob = response.getBlob();
      var folder = DriveApp.getFolderById(folder_id)
      return folder ? folder.createFile(blob) : blob;
    } else {
      return null;
    }
  };

  // GAS context
  g.TelegramBotAPI = api;

})(this, BotAPI);
