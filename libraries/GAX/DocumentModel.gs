/**
 * Represents a Document
 *
 * @constructor
 * @param {Document|string} docOrId
 */
var DocumentModel = function(docOrId) {
  if (typeof docOrId === "object") {
    this.doc = docOrId;
  } else {
    this.doc = DocumentApp.openById(docOrId);
  }
};

// Getters

/**
 * Get document ID
 *
 * @return {string} the document id
 */
DocumentModel.prototype.getId = function() {
  return this.doc.getId(); // Proxy pattern
};

// Private methods
// If you want one or more methods of your script to not be visible (nor usable) to your library users,
// you can end the name of the method with an underscore. For example, myPrivateMethod_().

DocumentModel.prototype.cloneDoc_ = function(copyName, copyProp, copyContent) {
  // If empty name, copy original name
  var original = this.doc;
  var name = copyName ? copyName : original.getName() + "-copy";
  // Create new document
  var copy = DocumentApp.create(name + "-" + Date.now());
  // Copy document properties (default)
  if (copyProp === undefined || copyProp) {
    copy.getBody()
    .setPageWidth(original.getBody().getPageWidth())
    .setPageHeight(original.getBody().getPageHeight())
    .setMarginBottom(original.getBody().getMarginBottom())
    .setMarginLeft(original.getBody().getMarginLeft())
    .setMarginRight(original.getBody().getMarginRight())
    .setMarginTop(original.getBody().getMarginTop());
  }
  // Copy document content (default)
  if (copyContent === undefined || copyContent) {
    original.getParagraphs().forEach(function(p){
      copy.getBody().appendParagraph(p);
    });
  }

  return copy;
}

// Public methods

/**
 * Clone document
 *
 * @param {string} copyName
 * @param {bool} copyProp - Optional
 * @param {bool} copyContent - Optional
 * @return {DocumentModel} the document copy
 */
DocumentModel.prototype.clone = function(copyName, copyProp, copyContent) {
  // Clone document
  var copy = this.cloneDoc_(copyName, copyProp, copyContent);

  // Save changes
  copy.saveAndClose();

  return new DocumentModel(copy);
};

/**
 * Multiclone document
 *
 * @param {string} copyName
 * @param {object[]} data
 * @param {string[]} map
 * @return {DocumentModel} the document copy
 */
DocumentModel.prototype.multiclone = function(copyName, data, map) {
  // Clone document
  var copy = this.cloneDoc_(copyName, true, false);

  // Multiclone content
  var original = this.doc;

  // For each item
  for (var item of data) {
    // Clone paragraphs
    original.getParagraphs().forEach(function(p){
      var pCopy = p.copy();
      // Replacing keys
      for(var key in map) {
        copy.replaceText(map[key], item[key]);
      }
      copy.getBody().appendParagraph(pCopy);
    });
    // Add page break
    copy.getBody().appendPageBreak();
  }

  // Save changes
  copy.saveAndClose();

  return new DocumentModel(copy);
};
