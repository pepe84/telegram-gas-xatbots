/**
 * Represents a Collection
 *
 * @constructor
 * @param {string} ssId
 * @param {string} shName
 * @param {object} mapCol
 * @param {string} idKey - Optional (default: "id")
 * @param {number} skipRows - Optional (default: 1)
 */
var SpreadsheetCollection = function(ssId, shName, mapCol, idKey, skipRows) {
  // Public properties
  // Spreadsheet and sheet
  this.ss = ssId ? SpreadsheetApp.openById(ssId) : SpreadsheetApp.getActiveSpreadsheet();
  this.sh = shName ? this.ss.getSheetByName(shName) : this.ss.getActiveSheet();
  // ID key (optional)
  this.idKey = idKey || "id";
  // Skip first rows (optional)
  this.skip = skipRows === undefined ? 1 : skipRows;
  // Private properties
  // Index map  {model ID => collection index}
  // Row map    {model ID => spreadsheet row}
  // Column map {model attr => spreadsheet column}
  // List map {model attr => attr is list}
  this.mapInd_ = {};
  this.mapRow_ = {};
  this.mapCol_ = {};
  this.mapList_ = {};
  for (var attr in mapCol) {
    var col = mapCol[attr];
    if (attr.endsWith("[]")) {
      // Replace attr
      attr = attr.replace("[]", "");
      // Mark as list
      this.mapList_[attr] = true;
    }
    this.mapCol_[attr] = col;
  }
  // Iteration
  this.collection_ = [];
  this.nextIndex_ = 0;
};

// Getters

/**
 * Get spreadsheet ID
 *
 * @return {string} the spreadsheet id
 */
SpreadsheetCollection.prototype.getId = function() {
  return this.ss.getId(); // Proxy pattern
};

/**
 * Get sheet rows
 *
 * @return {object} the sheet values
 */
SpreadsheetCollection.prototype.getAll = function() {
  var firstRow = 1 + this.skip;
  var firstCol = 1;
  var numRow = this.sh.getLastRow() - this.skip;
  var numCol = this.sh.getLastColumn();
  // Load all items
  Logger.log("[SpreadsheetCollection] Loading " + numRow + " rows, starting at ("+ firstRow +","+ firstCol +").");
  this.collection_ = (numRow > 0) ? this.sh.getRange(firstRow, firstCol, numRow, numCol).getValues() : [];
  // Reset iteration
  this.nextIndex_ = 0;

  return this.collection_;
};

/**
 * Get sheet last row
 *
 * @return {object} the row values
 */
SpreadsheetCollection.prototype.getLast = function() {
  var firstRow = this.sh.getLastRow();
  var firstCol = 1;
  var numRow = 1;
  var numCol = this.sh.getLastColumn();
  // Load item
  Logger.log("[SpreadsheetCollection] Loading row " + firstRow);
  var data = this.sh.getRange(firstRow, firstCol, numRow, numCol).getValues();
  var item = data.length ? this.factory(data[0]) : {};
  // Update collection?
  this.updateCollection_(item);
  // Returns model object
  return item;
};

/**
 * Get collection item by ID
 *
 * @return {object} the model
 */
SpreadsheetCollection.prototype.getById = function(id) {
  Logger.log("[SpreadsheetCollection] Get item with '" + this.idKey + "' = " + id);

  // Adaptation to reuse getItemIndex_ function
  var search = {};
  search[this.idKey] = id;
  var index = this.getItemIndex_(search);

  if (typeof index == "number") {
    // Item is already loaded
    Logger.log("[SpreadsheetCollection] Item found (already loaded)");
    return this.collection_[index];
  } else {
    // Otherwise, we need to load collection
    for (var item of this) {
      if (item[this.idKey] == id) {
        Logger.log("[SpreadsheetCollection] Item found");
        return item;
      }
    }
  }

  Logger.log("[SpreadsheetCollection] Item not found :-(");
  return null;
}

/**
 * Get number of collection items
 *
 * @return {number} the count
 */
SpreadsheetCollection.prototype.count = function() {
  return this.sh.getLastRow() - this.skip;
}

// Private methods

// If you want one or more methods of your script to not be visible (nor usable) to your library users,
// you can end the name of the method with an underscore. For example, myPrivateMethod_().

SpreadsheetCollection.prototype.registerItem_ = function(item, index, row) {
  if (item[this.idKey]) {
    this.mapInd_[String(item[this.idKey])] = index;
    this.mapRow_[String(item[this.idKey])] = row;
  } else {
    Logger.log("[SpreadsheetCollection] Collection item has no ID: " + JSON.stringify(item));
  }
}

SpreadsheetCollection.prototype.getItemIndex_ = function(item) {
  Logger.log("[SpreadsheetCollection] Getting item INDEX: " + JSON.stringify(item));
  return item[this.idKey] ? this.mapInd_[String(item[this.idKey])] : null;
}

SpreadsheetCollection.prototype.getItemRow_ = function(item) {
  Logger.log("[SpreadsheetCollection] Getting item ROW: " + JSON.stringify(item));
  return item[this.idKey] ? this.mapRow_[String(item[this.idKey])] : null;
}

SpreadsheetCollection.prototype.updateCollection_ = function(item) {
  var index = this.getItemIndex_(item);
  // Already exists?
  if (typeof index == "number") {
    // Update collection
    this.collection_[index] = item;
  }

  return this;
}


// Public methods

/**
 * Factory pattern
 *
 * @param {object} data
 * @return {object} the model
 */
SpreadsheetCollection.prototype.factory = function(data) {
  var obj = {};
  for (var attr in this.mapCol_) {
    // Get column data
    var indexCol = this.mapCol_[attr]-1;
    var value = data[indexCol];
    // List case?
    if (this.mapList_[attr]) {
      value = (value === undefined || !String(value).length) ? [] : JSON.parse(value);
    }
    // Set column data
    obj[attr] = value;
  }
  // Customization
  this.afterFactory(obj);

  return obj;
};

/**
 * Customize model after factory
 *
 * @param {object} item
 * @return {SpreadsheetCollection} this
 */
SpreadsheetCollection.prototype.afterFactory = function(item) {
  // Overwrite expected
};

/**
 * Store model
 *
 * @param {object} item
 * @return {SpreadsheetCollection} this
 */
SpreadsheetCollection.prototype.store = function(item) {
  // Customization
  this.beforeStore(item);
  // Map row
  var row = this.getItemRow_(item),
      action;
  if (row) {
    action = "Update";
  } else {
    action = "Add";
    row = this.sh.getLastRow() + 1;
    // this.sh.appendRow(...);
  }
  Logger.log("[SpreadsheetCollection] " + action + " item " + item[this.idKey] + " at row " + row + ": " + JSON.stringify(item));
  // Map column
  for (var attr in this.mapCol_) {
    // Get column and data
    var col = this.mapCol_[attr];
    var value = item[attr];
    // List case?
    if (this.mapList_[attr]) {
      value = (typeof value == "object") ? JSON.stringify(value) : value;
    }
    // Store data
    if (value === undefined) {
      Logger.log("[SpreadsheetCollection] WARNING: Attribute '" + attr + "' has no value");
    } else {
      this.sh.getRange(row,col).setValue(value);
    }
  }
  // Update collection?
  this.updateCollection_(item);

  return this;
}

/**
 * Customize model before store
 *
 * @param {object} item
 * @return {SpreadsheetCollection} this
 */
SpreadsheetCollection.prototype.beforeStore = function(item) {
  // Overwrite expected
};

// V8 runtime (ECMAScript 6) custom iterator
// Iterator Protocol and Iterable
// @see https://developers.google.com/apps-script/guides/v8-runtime/migration#dont_build_custom_iterator_functions_using_iterator_
// @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols

// Iterable
SpreadsheetCollection.prototype.next = function() {
  // Lazy loading
  if (!this.collection_.length) {
    this.getAll();
  }
  // Iterate
  if (this.nextIndex_ < this.collection_.length) {
    // Load and register item
    var row = this.nextIndex_ + 1 + this.skip;
    var item = this.factory(this.collection_[this.nextIndex_]);
    this.registerItem_(item, this.nextIndex_, row);
    // Update iteration counter
    this.nextIndex_++;
    // Continue iteration
    return  {
      value: item,
      done: false
    };
  } else {
    // Reset iteration counter?
    this.nextIndex_ = 0;
    // Finish iteration
    return  {
      done: true
    };
  }
};

// Iterator Protocol
SpreadsheetCollection.prototype[Symbol.iterator] = function() {
  return this;
};
