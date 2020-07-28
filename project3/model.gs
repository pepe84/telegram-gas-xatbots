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
    "mail": 2,
    "token": 3,
    "profile": 4,
    "lang": 5,
    "status": 6,
    "lastAccess": 7
  }
]);

// Constants

UserCollection.STATUS_INACTIVE = 0;
UserCollection.STATUS_ACTIVE = 1;

// Constructor (class inheritance)

var ServiceCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Serveis",
  {
    "id": 1,
    "name": 2,
    "url": 2
  }
]);

// Constants

ServiceCollection.SERVICE_WISUKI = 1;
ServiceCollection.SERVICE_PORTUS = 2;

// Public methods

ServiceCollection.prototype.generateUrl = function (service, code, lang) {
  var params = [];

  // Services customization
  switch (service.id) {
    case ServiceCollection.SERVICE_WISUKI:
      // Mandatory params
      params["spot"] = code;
      params["lang"] = lang;
      // Optional params
      params["windunit"] = "kh";
      params["waveunit"] = "me";
      params["tempunit"] = "c";
      break;
    case ServiceCollection.SERVICE_PORTUS:
      // Mandatory params
      params["code"] = code;
      params["locale"] = lang;
      break;
    default:
      Logger.log("Service '" + service.id + "' not available");
      return null;
  }

  return GAX.Helpers.Web.generateUrl(service.url, params);
};

/**

@TODO URL customization

Wisuki
------

 Paràmetres URL (versió detallada)

    windunit Unitat força de vent. Valors permesos: kn Knots (default), bf Beaufort, kh km/h, mh mph, ms m/s
    waveunit Unitat d'alçada de onada. Valors permesos: me Meters (default), ft Feet
    tempunit Unitat de temperatura. Valors permesos: c Celsius (default), f Fahrenheit
    spotinfo=1 Mostra un quadre amb informació addicional sobre el spot.
    tideinfo=1 Mostra un quadre amb informació addicional sobre la boia de referència de marees.
    interval1h=1 Permet intervals de 1h en lloc de les 3h per defecte.
    disabletide=1 Elimina el gràfic de marees.
    disableweather=1 Elimina la informació metereologica.
    disablenighttime=1 Elimina els espais nocturns de temps (i gràfic de marees).

Paràmetres URL (versió resum)

    windunit Unitat força de vent. Valors permesos: kn Knots (default), bf Beaufort, kh km/h, mh mph, ms m/s
    waveunit Unitat d'alçada de onada. Valors permesos: me Meters (default), ft Feet

Portus
------

Paràmetres URL

  resourceId: Tipo de predición: Valores (oleaje-atl, oleaje-med, viento, nivmar, corriente, temperatura, salinidad, corriente-radar)
  var: Variable asociada a la predicción. Valores (WAVE, WIND, SEA_LEVEL, CURRENTS, WATER_TEMP, SALINITY). Por defecto se usa WAVE.
  zoom: nivel del zoom del mapa. Por defecto 4.
  lon: longitud. Por defecto -5.5.
  lat: latitud. Por defecto 36.4.
  vec: permite activar la visualización de dirección de oleaje o viento. Valores (true, false). Por defecto false.
  locale: (en|es) locale de la aplicación. Por defecto es.

**/

// Constructor (class inheritance)

var SpotCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Spots",
  {
    "id": 1,
    "name": 2,
    "city": 3,
    "zone": 4,
    "url": 10
  }
]);

// Constructor (class inheritance)

var UploadCollection = GAX.Helpers.Class.extends(GAX.SpreadsheetCollection, [
  SPREADSHEET_ID,
  "Fotos",
  {
    "id": 1,
    "uid": 2,
    "filename": 3,
    "url": 4,
    "timestamp": 5
  }
]);

// GAS context

(function(g) {
  // Data models
  g.QRModel  = GAX.QRModel;
  // Data collections
  g.Logs     = new LogCollection();
  g.Users    = new UserCollection();
  g.Services = new ServiceCollection();
  g.Spots    = new SpotCollection();
  g.Uploads  = new UploadCollection();
  // Web services
  g.TelegramBotAPI = new Telegram.BotAPI(TELEGRAM_BOT_TOKEN);
})(this);
