var ItemModel,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ItemModel = (function() {
  function ItemModel(item, collection) {
    this.collection = collection;
    this.save = bind(this.save, this);
    this["delete"] = bind(this["delete"], this);
    this.remove = bind(this.remove, this);
    _.extend(this, item);
  }

  ItemModel.prototype.remove = function() {
    return this.collection.remove(this);
  };

  ItemModel.prototype["delete"] = function() {
    return this.collection["delete"](this);
  };

  ItemModel.prototype.save = function() {
    return this.collection.update(this);
  };

  return ItemModel;

})();

var Collection,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function() {
  var module;
  module = angular.module('ng-bundle-collection', []);

  /**
  	 * @ngdoc service
  	 * @name ng-bundle-collection.ngBundleCollection
  	 * @description
  	 * wraps Collection class into angular factory
  	 * @requires $q
  	 * @requires $timeout
   */
  return module.factory('ngBundleCollection', function($q, $timeout) {
    return function(rest, config) {
      return new Collection($q, $timeout, rest, config);
    };
  });
})();

Collection = (function() {
  function Collection($q1, $timeout1, rest1, config1) {
    this.$q = $q1;
    this.$timeout = $timeout1;
    this.rest = rest1;
    this.config = config1 != null ? config1 : {};
    this.__rest = bind(this.__rest, this);
    this.getCached = bind(this.getCached, this);
    this.isCached = bind(this.isCached, this);
    this.__initCaching = bind(this.__initCaching, this);
    this.__initImmediateCaching = bind(this.__initImmediateCaching, this);
    this.__determineResponse = bind(this.__determineResponse, this);
    this.__error = bind(this.__error, this);
    this.__success = bind(this.__success, this);
    this.__private_fetch = bind(this.__private_fetch, this);
    this.__removeMock = bind(this.__removeMock, this);
    this.__setMock = bind(this.__setMock, this);
    this.__invalidateParams = bind(this.__invalidateParams, this);
    this.invalidate = bind(this.invalidate, this);
    this.cancelAllRequests = bind(this.cancelAllRequests, this);
    this.fetch = bind(this.fetch, this);
    this.extendFetch = bind(this.extendFetch, this);
    this.extendAdd = bind(this.extendAdd, this);
    this.extendRemove = bind(this.extendRemove, this);
    this.extendUpdate = bind(this.extendUpdate, this);
    this.clear = bind(this.clear, this);
    this.remove = bind(this.remove, this);
    this["delete"] = bind(this["delete"], this);
    this.update_locally = bind(this.update_locally, this);
    this.update = bind(this.update, this);
    this.create = bind(this.create, this);
    this.add = bind(this.add, this);
    this.add_withToCache = bind(this.add_withToCache, this);
    this.isLoading = bind(this.isLoading, this);
    this.dec = bind(this.dec, this);
    this.inc = bind(this.inc, this);
    this._initPublicProperties = bind(this._initPublicProperties, this);
    this._initConfig = bind(this._initConfig, this);
    Collection.instances.push(this);
    this._initConfig();
    this._initPublicProperties();
    if (this.config.withCaching) {
      this.__initCaching();
    } else {
      this.__initImmediateCaching();
    }
  }


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.ngBundleCollection#defaultMockDelay
  	 * @propertyOf ng-bundle-collection.ngBundleCollection
  	 * @description
  	 * number of milliseconds for responding with mock
   */

  Collection.prototype.defaultMockDelay = 500;


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.ngBundleCollection#_initConfig
  	 * @methodOf ng-bundle-collection.ngBundleCollection
  	 * @description
  	 * populating collection config with defaults
  	 * @example
  	 * collection._initConfig()
   */

  Collection.prototype._initConfig = function() {
    if (this.config.withCaching == null) {
      this.config.withCaching = true;
    }
    if (this.config.id_field == null) {
      this.config.id_field = 'id';
    }
    if (this.config.respondWithPayload == null) {
      return this.config.respondWithPayload = true;
    }
  };

  Collection.prototype._initPublicProperties = function() {
    return _.extend(this, {
      cache: {},
      objById: {},
      arr: [],
      loading: 0,
      extendFns: {
        add: {
          b: [],
          a: []
        },
        remove: [],
        update: [],
        fetch: {
          b: [],
          s: [],
          e: [],
          f: []
        }
      }
    });
  };

  Collection.prototype.inc = function() {
    return this.loading++;
  };

  Collection.prototype.dec = function() {
    return this.loading--;
  };

  Collection.prototype.isLoading = function() {
    return this.loading;
  };

  Collection.prototype.add_withToCache = function(data, params) {
    var paramsMark, ref;
    this.add(data);
    paramsMark = this.__calcParamsMark(params);
    if ((this.cache[paramsMark] != null) && (ref = data[this.config.id_field], indexOf.call(_.pluck(this.cache[paramsMark].results, this.config.id_field), ref) < 0)) {
      return this.cache[paramsMark].results.push(data);
    }
  };

  Collection.prototype.add = function(data, params) {
    var item, j, len, results1;
    if (_.isArray(data)) {
      results1 = [];
      for (j = 0, len = data.length; j < len; j++) {
        item = data[j];
        results1.push(this.__addOne(item, params));
      }
      return results1;
    } else {
      return this.__addOne.apply(this, arguments);
    }
  };

  Collection.prototype.__addOne = function(item, params) {
    var fn, j, l, len, len1, ref, ref1, ref2, results1;
    if (ref = item[this.config.id_field], indexOf.call(_.pluck(this.objById, this.config.id_field), ref) < 0) {
      ref1 = this.extendFns.add.b;
      for (j = 0, len = ref1.length; j < len; j++) {
        fn = ref1[j];
        fn(item);
      }
      item = new ItemModel(item, this);
      if (this.config.model != null) {
        item = new this.config.model(item);
      }
      this.arr.push(item);
      this.objById[item[this.config.id_field]] = item;
      ref2 = this.extendFns.add.a;
      results1 = [];
      for (l = 0, len1 = ref2.length; l < len1; l++) {
        fn = ref2[l];
        results1.push(fn(item));
      }
      return results1;
    }
  };

  Collection.prototype.create = function(data, scb, ecb) {
    var promise;
    this.inc();
    promise = this.__rest(data).post(data).then((function(_this) {
      return function(response) {
        _this.add(response);
        if (typeof scb === "function") {
          scb(response);
        }
        return response;
      };
    })(this), function(response) {
      return typeof ecb === "function" ? ecb(response) : void 0;
    });
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec();
      };
    })(this));
    return promise;
  };

  Collection.prototype.update = function(data, scb, ecb) {
    var promise;
    this.inc();
    promise = this.__rest(data).one(data[this.config.id_field].toString()).patch(data).then((function(_this) {
      return function(response) {
        _this.update_locally(response);
        if (typeof scb === "function") {
          scb(response);
        }
        return response;
      };
    })(this), function(error) {
      return typeof ecb === "function" ? ecb(error) : void 0;
    });
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec();
      };
    })(this));
    return promise;
  };

  Collection.prototype.update_locally = function(item) {
    var elem, index, j, len, ref;
    this.objById[item[this.config.id_field]] = item;
    ref = this.arr;
    for (index = j = 0, len = ref.length; j < len; index = ++j) {
      elem = ref[index];
      if (elem[this.config.id_field] === item[this.config.id_field]) {
        this.arr[index] = item;
        break;
      }
    }
    return this.__callExtendFns(this.extendFns.update, item);
  };

  Collection.prototype["delete"] = function(item, scb, ecb) {
    var promise;
    this.inc();
    promise = this.__rest(item).one(item[this.config.id_field].toString()).remove().then((function(_this) {
      return function(response) {
        _this.remove(item);
        if (typeof scb === "function") {
          scb(response);
        }
        return response;
      };
    })(this), function(response) {
      return typeof ecb === "function" ? ecb(response) : void 0;
    });
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec();
      };
    })(this));
    return promise;
  };

  Collection.prototype.remove = function(item) {
    if (item == null) {
      return;
    }
    delete this.objById[item[this.config.id_field]];
    _.remove(this.arr, (function(_this) {
      return function(elem) {
        return elem[_this.config.id_field] === item[_this.config.id_field];
      };
    })(this));
    return this.__callExtendFns(this.extendFns.remove, item);
  };

  Collection.prototype.clear = function(withExtendFns) {
    var item, j, len, ref;
    if (withExtendFns) {
      this._initExtendFns();
    }
    ref = angular.copy(this.arr);
    for (j = 0, len = ref.length; j < len; j++) {
      item = ref[j];
      this.remove(item);
    }
    return this.obj = {};
  };

  Collection.prototype.extendUpdate = function(fn) {
    return this.extendFns.update.push(fn);
  };

  Collection.prototype.extendRemove = function(fn) {
    return this.extendFns.remove.push(fn);
  };

  Collection.prototype.extendAdd = function(fns) {
    var k, results1, v;
    results1 = [];
    for (k in fns) {
      v = fns[k];
      results1.push(this.extendFns.add[k].push(v));
    }
    return results1;
  };

  Collection.prototype.extendFetch = function(fns, once) {
    var fn, k, results1, v;
    results1 = [];
    for (k in fns) {
      v = fns[k];
      if (once) {
        fn = (function(extendFns, k, v) {
          return function() {
            v.apply(null, arguments);
            return extendFns.fetch[k]["delete"](v);
          };
        })(this.extendFns, k, v);
        fn.once = true;
        results1.push(this.extendFns.fetch[k].push(fn));
      } else {
        results1.push(this.extendFns.fetch[k].push(v));
      }
    }
    return results1;
  };

  Collection.prototype.at = function(index) {
    return this.arr[index];
  };

  Collection.prototype.by = function(id) {
    return this.objById[id];
  };

  Collection.prototype.fetch = function(params) {
    var id, paramsStr;
    if (params == null) {
      params = {};
    }
    id = params[this.config.id_field];
    if (this.objById[id] != null) {
      return this.$q.when(this.objById[id]);
    } else {
      paramsStr = this.__calcParamsMark(params);
      if (this.cache[paramsStr] != null) {
        return this.$q.when(this.cache[paramsStr]);
      } else {
        return this.__private_fetch(params);
      }
    }
  };

  Collection.prototype.cancelAllRequests = function() {
    var cached, key, ref, results1;
    ref = this.cache;
    results1 = [];
    for (key in ref) {
      cached = ref[key];
      if (cached != null) {
        if (cached.__selfReject != null) {
          cached.__selfReject({
            cancelled: true
          });
          results1.push(delete this.cache[key]);
        } else {
          results1.push(void 0);
        }
      }
    }
    return results1;
  };

  Collection.prototype.invalidate = function(data) {
    var j, len, params;
    if (_.isArray(data)) {
      for (j = 0, len = data.length; j < len; j++) {
        params = data[j];
        this.__invalidateParams(params);
      }
    } else {
      this.__invalidateParams(data || {});
    }
    return this;
  };

  Collection.prototype.__invalidateParams = function(params) {
    var clearedKeyParams, key, keyParams, results1, valid;
    results1 = [];
    for (key in this.cache) {
      keyParams = JSON.parse(key);
      valid = true;
      clearedKeyParams = _.pick(keyParams, function(value, key) {
        return params[key] != null;
      });
      if (_.isEqual(clearedKeyParams, params)) {
        results1.push(delete this.cache[key]);
      } else {
        results1.push(void 0);
      }
    }
    return results1;
  };

  Collection.prototype.__callExtendFns = function(fns_arr, p1, p2, p3, p4, p5) {
    var fn, index, results1;
    if (!(fns_arr && _.isArray(fns_arr))) {
      return;
    }
    index = 0;
    results1 = [];
    while (index < fns_arr.length) {
      fn = fns_arr[index];
      if (typeof fn === "function") {
        fn(p1, p2, p3, p4, p5);
      }
      if (!(fn != null ? fn.once : void 0)) {
        results1.push(index++);
      } else {
        results1.push(void 0);
      }
    }
    return results1;
  };

  Collection.prototype.__setMock = function(mock, mockDelay) {
    this.mock = mock;
    this.mockDelay = mockDelay;
  };

  Collection.prototype.__removeMock = function() {
    this.mock = null;
    return this.mockDelay = null;
  };

  Collection.prototype.__private_fetch = function(params) {
    var deferred, paramsStr, paramsToSend, rest;
    this.inc();
    this.__callExtendFns(this.extendFns.fetch.b, params);
    rest = this.__rest(params);
    paramsStr = this.__calcParamsMark(params);
    deferred = this.$q.defer();
    if (this.mock) {
      this.$timeout((function(_this) {
        return function() {
          _this.__success(_this.mock, params);
          return deferred.resolve(_this.mock);
        };
      })(this), this.mockDelay || this.defaultMockDelay);
    } else {
      paramsToSend = params;
      if (params[this.config.id_field] != null) {
        rest = rest.one(params[this.config.id_field].toString());
        paramsToSend = _.omit(paramsToSend, this.config.id_field);
      }
      rest.customGET('', paramsToSend).then((function(_this) {
        return function(response) {
          return deferred.resolve(_this.__success(response, params));
        };
      })(this), (function(_this) {
        return function(response) {
          if (response.status === 304) {
            return deferred.resolve(_this.__success({
              results: response.data
            }, params));
          } else {
            _this.__error(response, params);
            return deferred.reject(response);
          }
        };
      })(this));
    }
    deferred.promise["finally"](this.dec);
    _.extend(deferred.promise, {
      __selfResolve: deferred.resolve,
      __selfReject: deferred.reject
    });
    return this.cache[paramsStr] = deferred.promise;
  };

  Collection.prototype.__success = function(response, params) {
    var response_formatted;
    if (!this.config.dontCollect) {
      if ((response != null ? response.results : void 0) != null) {
        this.add(response.results);
      } else {
        this.add(response);
      }
    }
    response_formatted = this.__determineResponse(response, params);
    this.__callExtendFns(this.extendFns.fetch.s, response_formatted, params);
    this.__callExtendFns(this.extendFns.fetch.f, response_formatted, params);
    return response_formatted;
  };

  Collection.prototype.__error = function(response, params) {
    this.__callExtendFns(this.extendFns.fetch.e, response, params);
    return this.__callExtendFns(this.extendFns.fetch.f, response, params);
  };

  Collection.prototype.__calcParamsMark = function(params) {
    return JSON.stringify(params);
  };

  Collection.prototype.__determineResponse = function(response, params) {
    var item, results;
    response = (function() {
      var j, l, len, len1, len2, m, ref, results1, results2;
      if (this.config.dontCollect) {
        if ((this.config.model != null) && _.isArray(response)) {
          results1 = [];
          for (j = 0, len = response.length; j < len; j++) {
            item = response[j];
            results1.push(new this.config.model(item));
          }
          return results1;
        } else {
          return response;
        }
      } else {
        if (_.isArray(response)) {
          results2 = [];
          for (l = 0, len1 = response.length; l < len1; l++) {
            item = response[l];
            results2.push({
              results: this.objById[item[this.config.id_field]]
            });
          }
          return results2;
        } else {
          if ((response != null ? response.results : void 0) != null) {
            if (params[this.config.id_field] && !params._single) {
              if (response.results[0] != null) {
                return this.objById[response.results[0][this.config.id_field]];
              } else {
                return null;
              }
            } else {
              results = [];
              ref = response.results;
              for (m = 0, len2 = ref.length; m < len2; m++) {
                item = ref[m];
                results.push(this.objById[item[this.config.id_field]]);
              }
              return _.extend(response, {
                results: results
              });
            }
          } else {
            return this.objById[response[this.config.id_field]];
          }
        }
      }
    }).call(this);
    if (this.config.respondWithPayload) {
      response.__payload = params;
    }
    return response;
  };

  Collection.prototype.__initImmediateCaching = function() {
    return this.extendFetch({
      s: (function(_this) {
        return function(response, params) {
          return delete _this.cache[_this.__calcParamsMark(params)];
        };
      })(this)
    });
  };

  Collection.prototype.__initCaching = function() {
    return this.extendFetch({
      s: (function(_this) {
        return function(response, params, method) {
          return _this.cache[_this.__calcParamsMark(params)] = angular.copy(response);
        };
      })(this),
      e: (function(_this) {
        return function(response, params) {
          return delete _this.cache[_this.__calcParamsMark(params)];
        };
      })(this)
    });
  };

  Collection.prototype.isCached = function(params) {
    return this.getCached(params) != null;
  };

  Collection.prototype.getCached = function(params) {
    return this.cache[this.__calcParamsMark(params)];
  };

  Collection.prototype.__rest = function(params) {
    if (_.isFunction(this.rest)) {
      return this.rest(params);
    } else {
      return this.rest;
    }
  };


  /*
  	 * Static properties
   */

  Collection.instances = [];

  Collection.invalidate = function() {
    var i, j, len, ref, results1;
    ref = this.instances;
    results1 = [];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      results1.push(i.invalidate());
    }
    return results1;
  };

  Collection.cancelAllRequests = function() {
    var i, j, len, ref, results1;
    ref = this.instances;
    results1 = [];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      results1.push(i.cancelAllRequests());
    }
    return results1;
  };

  Collection.clear = function(withExtendFns) {
    var i, j, len, ref, results1;
    ref = this.instances;
    results1 = [];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      results1.push(i.clear(withExtendFns));
    }
    return results1;
  };

  return Collection;

})();
