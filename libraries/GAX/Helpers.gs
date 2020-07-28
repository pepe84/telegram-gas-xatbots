/**
 * Represents a helper
 *
 * @constructor
 */
var Helpers = function() {

};

// Public static methods

Helpers.Class = {
  /**
  * Extends (class inheritance)
  *
  * @param {object} inheritsFromClass
  * @param {array} args
  */
  extends: function (inheritsFromClass, args) {
    var myClass = function() {
      inheritsFromClass.apply(this, args);
    };
    myClass.prototype = Object.create(inheritsFromClass.prototype);
    myClass.prototype.constructor = myClass;

    return myClass;
  }
};

Helpers.Array = {
  /**
  * Sum array values
  *
  * @param {object} array
  */
  sum: function (array) {
    return array.length ? array.reduce(function(a, b){
      return Number(a) + Number(b);
    }, 0) : 0;
  },
  /**
  * Get subarray
  *
  * @param {object} array
  * @param {number} start
  * @param {number} end - optional
  */
  subarray: function(array, start, end) {
    return this.slice(start, array.length + 1 - ((end ? end : -1) * -1));
  }
}

Helpers.Web = {
  /**
   * Generates URL
   *
   * @param {string} url
   * @param {object} query
   */
  generateUrl: function(url, query) {
    // Generate URL query
    var params = Object.keys(query).map(function(param){
      return param + "=" + query[param];
    });

    return url + (params.length ? "?" + params.join("&") : "");
  }
};

Helpers.Random = {
  /**
   * Generates a random number and converts it to base 36 (0-9a-z)
   *
   */
  base36: function() {
    return Math.random().toString(36).substr(2); // remove `0.`
  },
  /**
   * Generates a random token
   *
   */
  token: function() {
    return this.base36() + this.base36(); // to make it longer
  }
};
