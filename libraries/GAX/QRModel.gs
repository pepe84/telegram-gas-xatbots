/**
 * Represents a QR
 *
 * @constructor
 * @param {string} url
 * @param {string} name - Optional argument
 * @param {number} width - Optional argument
 * @param {number} height - Optional argument
 */
var QRModel = function(url, name, width, height) {
  this.url = url;
  this.name = name || "QR";
  this.w = width || 250;
  this.h = height || 250;
};

// Getters

/**
 * Get QR code as image
 *
 * @return {Blob} the image
 */
QRModel.prototype.getImage = function() {
  return UrlFetchApp
  .fetch("https://chart.googleapis.com/chart?chs="+this.w+"x"+this.h+"&cht=qr&chl="+this.url)
  .getBlob()
  .setName(this.name);
};

/**
 * Get QR code as image (version 2)
 *
 * @return {Blob} the image
 */
QRModel.prototype.getImage2 = function() {
  var binaryData = UrlFetchApp
  .fetch("https://chart.googleapis.com/chart?chs="+this.w+"x"+this.h+"&cht=qr&chl="+this.url)
  .getContent();

  return Utilities.newBlob(binaryData, "image/jpeg", name || "QR");
};
