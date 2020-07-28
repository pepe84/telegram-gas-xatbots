/**
 * Represents Weather API
 * @see https://openweathermap.org/api
 *
 * @constructor
 * @param {string} apiKey
 * @param {string} language
 * @param {string} units - Optional
 */
function WeatherAPI(apiKey, language, units) {
  this.apiKey = apiKey;
  this.lang = language;
  this.units = units || "metric";
  // API properties
  this.apiVersion = "2.5";
  this.apiUrl = "http://api.openweathermap.org/data/" + this.apiVersion;
}

// Private methods

WeatherAPI.prototype.getUrlQuery_ = function(data) {
  // Add common data
  data["APPID"] = this.apiKey;
  data["lang"] = this.lang;
  data["units"] = this.units;

  // Generate URL query
  var params = Object.keys(data).map(function(key){
    return key + "=" + data[key];
  });

  return "?" + params.join("&");
}

// Public methods

/**
 * Get current weather data
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {object} the data
 */
WeatherAPI.prototype.getCurrentWeatherData = function(lat, lon){
  var url = this.apiUrl + "/weather" + this.getUrlQuery_({
    "lat": lat,
    "lon": lon
  });
  Logger.log("[WeatherAPI] New request: " + url);
  var resp = UrlFetchApp.fetch(url).getContentText();
  return JSON.parse(resp);
};

/**
 * Get current weather data
 *
 * @param {string} icon
 * @returns {string} the URL
 */
WeatherAPI.prototype.getIconUrl = function(icon) {
  return "http://openweathermap.org/img/wn/" + icon + ".png";
};
