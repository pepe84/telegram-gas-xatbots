/**
 * Represents a File
 *
 * @constructor
 * @param {File|string} fileOrId
 */
var FileModel = function(fileOrId) {
  if (typeof fileOrId === "object") {
    this.file = fileOrId;
  } else {
    this.file = DriveApp.getFileById(fileOrId);
  }
};

// Constants

FileModel.EXTENSION_ODT = 'application/vnd.oasis.opendocument.text';
FileModel.EXTENSION_PDF = 'application/pdf';

// Getters

/**
 * Get document ID
 *
 * @return {string} the file id
 */
FileModel.prototype.getId = function() {
  this.file.getId(); // Proxy pattern
};

/**
 * Get file folder
 *
 * @return {Folder} the file folder
 */
FileModel.prototype.getFolder = function() {
  var folder = null;
  var folders = this.file.getParents();

  while (folders.hasNext()){
    folder = folders.next();
  }

  return folder;
};

// Public methods

/**
 * Move file to folder
 *
 * @param {Folder}
 * @return {FileModel} this
 */
FileModel.prototype.move = function(folder) {
  folder.addFile(this.file);
  DriveApp.getRootFolder().removeFile(this.file);

  return this;
};

/**
 * Export file
 *
 * @param {string} fileType
 * @return {FileModel} the exported file
 */
FileModel.prototype.export = function(fileType) {
  var ext;
  switch (fileType) {
    case FileModel.EXTENSION_ODT:
      ext = ".odt";
      break;
    case FileModel.EXTENSION_PDF:
      ext = ".pdf";
      break;
    default:
      ext = null;
  }
  if (ext) {
    var blob = this.file.getAs(fileType);
    blob.setName(this.file.getName() + ext);
    return new FileModel(DriveApp.createFile(blob));
  } else {
    return null;
  }
};
