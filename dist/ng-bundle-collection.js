
/**
 * @ngdoc object
 * @name ItemModel
 * @description
 * <p>Class that represents default model for each collection item</p>
 * <p>Can be extended by custom item model</p>
 * @param {object} item
 * Object that represents item data
 * @param {object} methods
 * Collection-level methods from the instance to which the item belongs
 * @example
<pre>
	//custom user model
	class User extends ItemModel
		constructor: ->
			//!important. if overriding default constructor, dont forget to specify `super` call to invoke parent constructor
			super
			//constructor
			if this.calculateMailingAgent() isnt 'gmail'
				this.notGoogleEmail = yes

		calculateMailingAgent: =>
			this.email.match(/\@(.*)\./)[1]

	//somewhere in controller...
	$scope.users = new Collection Restangular.all('users'), model: User
	$scope.users.fetch()

	//HTML
	<ul>
		<li ng-repeat='user users.arr'>
			<div>Name: {{user.name}}</div>
			<div>Mailing agent: {{user.calculateMailingAgent()}}</div>
		</li>
	</ul>
</pre>
 */
var ItemModel,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ItemModel = (function() {
  function ItemModel(item) {
    this.save = bind(this.save, this);
    this.update_locally = bind(this.update_locally, this);
    this.put = bind(this.put, this);
    this.patch = bind(this.patch, this);
    this.update = bind(this.update, this);
    this["delete"] = bind(this["delete"], this);
    this.remove = bind(this.remove, this);
    this.post = bind(this.post, this);
    this.create = bind(this.create, this);
    _.extend(this, (item != null ? item.unrestangularized : void 0) || item);
  }


  /**
  	 * @ngdoc
  	 * @name ItemModel#create
  	 * @methodOf ItemModel
  	 * @returns {object}
  	 * Removed item
  	 * @description
  	 * <p>Removes the item from collection locally.</p>
  	 * @param {object} item
  	 * Item data, must contain id-field
   */

  ItemModel.prototype.create = function(data) {
    data[this.config.id_field] = this[this.config.id_field];
    return this.methods.create(data);
  };

  ItemModel.prototype.post = function() {
    return this.create.apply(this, arguments);
  };


  /**
  	 * @ngdoc
  	 * @name ItemModel#remove
  	 * @methodOf ItemModel
  	 * @returns {object}
  	 * Removed item
  	 * @description
  	 * <p>Removes the item from collection locally.</p>
  	 * @param {object} item
  	 * Item data, must contain id-fiel
   */

  ItemModel.prototype.remove = function() {
    return this.methods.remove(this);
  };


  /**
  	 * @ngdoc
  	 * @name ItemModel#delete
  	 * @methodOf ItemModel
  	 * @returns {promise}
  	 * Promise which resolves with deleted item or rejects with error response
  	 * @description
  	 * <p>Removes item from collection and deletes it at backend using specified REST configuration.</p>
  	 * <p>Makes `DELETE` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
   */

  ItemModel.prototype["delete"] = function() {
    return this.methods["delete"](this);
  };


  /**
  	 * @ngdoc
  	 * @name ItemModel#update
  	 * @methodOf ItemModel
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Updates item in collection and at backend using specified REST configuration.</p>
  	 * <p>Makes `PATCH` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * @param {object} data
  	 * Object with fields that should be updated or added
   */

  ItemModel.prototype.update = function(data) {
    this.update_locally(data);
    return this.save(data);
  };

  ItemModel.prototype.patch = function(data) {
    return this.save(data, 'patch');
  };

  ItemModel.prototype.put = function(data) {
    return this.save(data, 'put');
  };


  /**
  	 * @ngdoc
  	 * @name ItemModel#update_locally
  	 * @methodOf ItemModel
  	 * @returns {object} 
  	 * Updated item
  	 * @description
  	 * <p>Updates item in collection locally (doesnt affect backend).</p>
  	 * @param {object} item
  	 * Item data to be written to item
   */

  ItemModel.prototype.update_locally = function(data) {
    return _.extend(this, data);
  };


  /**
  	 * @ngdoc
  	 * @name ItemModel#save
  	 * @methodOf ItemModel
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Saves the current item state at backend using specified REST configuration.</p>
  	 * <p>Makes `PATCH` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
   */

  ItemModel.prototype.save = function(data, method) {
    if (method == null) {
      method = 'update';
    }
    if (data != null) {
      data[this.config.id_field] = this[this.config.id_field];
    }
    if (data != null) {
      return this.methods[method](data);
    } else {
      return this.methods[method](this);
    }
  };

  return ItemModel;

})();

var Collection,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function() {

  /**
  	 * @ngdoc object
  	 * @name ng-bundle-collection
  	 * @description
  	 * Main module which contains {@link ng-bundle-collection.Collection Collection} factory
   */
  var module;
  module = angular.module('ng-bundle-collection', ['restangular']);

  /**
  	 * @ngdoc service
  	 * @name ng-bundle-collection.Collection
  	 * @description
  	 * Wraps Collection class into angular factory
  	 * @requires $q
  	 * @requires $timeout
  	 * @param {object} rest
  	 * Restangular instance
  	 * @param {object} config
  	 * <p>Configuration for collection.</p>
  	 * <p>Please see {@link ng-bundle-collection.Collection.config ng-bundle-collection.Collection.config} for available config properties.</p>
  	 * @example
  	 * <p>Creating collection:</p>
  	<pre>
  		var collection = new Collection(Restangular.all('users'), {
  			withCaching: true,
  			id_field: 'id',
  			respondWithPayload: true,
  			dontCollect: false,
  			model: SomeModelClass,
  			params: {
  				some_parameter: 'some value'
  			}
  		});
  	</pre>
  	 * <p>Collection can be wrapped with a service and be used as a single source of truth in your application:</p>
  	<pre>
  		var module = angular.module('App', []);
  
  		module.service('users', function(Collection, Restangular){
  			return new Collection(Restangular.all('users'), {
  				//... config
  			});
  		});
  	</pre>
  	 * <p>You also can use ng-bundle-collection as a **local** collection (without work with backend) of any items to leverage the local api</p>
  	<pre>
  		//For example, items collection for some select
  		var selectItems = new Collection;
  		selectItems.add([
  			{id: 23, name: 'Option 1', color: 'red'},
  			{id: 24, name: 'Option 2', color: 'red', default: true},
  			{id: 25, name: 'Option 3', color: 'black'},
  		);
  
  		//...
  
  		console.log(selectItems.at(1));
  		//{id: 24, name: 'Option 2', color: 'red', default: true}
  
  		console.log(selectItems.by(24));
  		//{id: 24, name: 'Option 2', color: 'red', default: true}
  
  		console.log(selectItems.where({color: 'red'}));
  		//[{id: 23, name: 'Option 1', color: 'red'}, {id: 24, name: 'Option 2', color: 'red', default: true}]
  
  		console.log(selectItems.singleWhere({default: true}));
  		//{id: 24, name: 'Option 2', color: 'red', default: true}
  
  		console.log(selectItems.arr);
  		//array of collection items
  
  		console.log(selectItems.objById);
  		//object with collection items with keys as items ids
  	</pre>
   */
  return module.factory('Collection', [
    '$q', '$timeout', function($q, $timeout) {
      return function(rest, config) {
        return new Collection($q, $timeout, rest, config);
      };
    }
  ]);
})();


/**
 * @ngdoc object
 * @name Private_methods
 * @description
 * Private methods of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}
 */

Collection = (function() {
  function Collection($q1, $timeout1, rest1, config1) {
    this.$q = $q1;
    this.$timeout = $timeout1;
    this.rest = rest1;
    this.config = config1 != null ? config1 : {};
    this.__extractHeaders = bind(this.__extractHeaders, this);
    this.__extractParams = bind(this.__extractParams, this);
    this.__extractPayload = bind(this.__extractPayload, this);
    this.__rest = bind(this.__rest, this);
    this.getCached = bind(this.getCached, this);
    this.isCached = bind(this.isCached, this);
    this.__initCaching = bind(this.__initCaching, this);
    this.__initCacheClearing = bind(this.__initCacheClearing, this);
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
    this.singleWhere = bind(this.singleWhere, this);
    this.where = bind(this.where, this);
    this.by = bind(this.by, this);
    this.at = bind(this.at, this);
    this.addFetchInterceptor = bind(this.addFetchInterceptor, this);
    this.addInterceptor = bind(this.addInterceptor, this);
    this.extendFetch = bind(this.extendFetch, this);
    this.extendAdd = bind(this.extendAdd, this);
    this.extendRemove = bind(this.extendRemove, this);
    this.extendUpdate = bind(this.extendUpdate, this);
    this.clear = bind(this.clear, this);
    this.remove = bind(this.remove, this);
    this["delete"] = bind(this["delete"], this);
    this.update_locally = bind(this.update_locally, this);
    this.__update = bind(this.__update, this);
    this.update = bind(this.update, this);
    this.patch = bind(this.patch, this);
    this.put = bind(this.put, this);
    this.create = bind(this.create, this);
    this.__wrapWithModel = bind(this.__wrapWithModel, this);
    this.__addOne = bind(this.__addOne, this);
    this.add_withToCache = bind(this.add_withToCache, this);
    this.add = bind(this.add, this);
    this.isLoading = bind(this.isLoading, this);
    this.dec = bind(this.dec, this);
    this.inc = bind(this.inc, this);
    this._initInterceptors = bind(this._initInterceptors, this);
    this._initExtendFns = bind(this._initExtendFns, this);
    this._initProgressExposing = bind(this._initProgressExposing, this);
    this._initPublicProperties = bind(this._initPublicProperties, this);
    this._initConfig = bind(this._initConfig, this);
    Collection.instances.push(this);
    this._initConfig();
    this._initPublicProperties();
    this._initProgressExposing();
    this._initExtendFns();
    this._initInterceptors();
    if (this.config.withCaching) {
      this.__initCaching();
    } else {
      this.__initCacheClearing();
    }
  }


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#defaultMockDelay
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Number of milliseconds for responding with mock
   */

  Collection.prototype.defaultMockDelay = 500;


  /**
  	 * @ngdoc
  	 * @name Private_methods#_initConfig
  	 * @methodOf Private_methods
  	 * @description
  	 * Populating collection config with defaults
   */


  /**
  	 * @ngdoc object
  	 * @name ng-bundle-collection.Collection.config
  	 * @description
  	 * Configuration object of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} instances
  	 * @property {boolean} withCaching=true
  	 * Controls whether to initialize caching mechanism for collection
  	 * @property {string} id_field="id"
  	 * Name of identification field for each collection item
  	 * @property {boolean} respondWithPayload=true
  	 * Controls whether to add payload of each request as a **`__payload`** field in response
  	 * @property {class} model
  	 * <p>Decorator model class for collection items</p>
  	 * <p>*Note:* this has to be a function as javascript classes can be defined only as functions. Of course, the CoffeeScript classes are welcome :)</p>
  	 * @property {boolean} dontCollect=false
  	 * <p>If set to `true`, the collection wouldnt collect the responses in its `arr` and `objById` containers.</p>
  	 * <p>This wouldnt affect caching ability, the cache will work as usual.</p>
  	 * <p>This can be used to use collection only as fetching agent, which is useful i.e. when the data is not a collection, but the object, maybe some settings object or else.</p>
  	 * @property {object} params
  	 * Default params to be included into each get request made by {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}`.fetch`
   */

  Collection.prototype._initConfig = function() {
    if (this.config.withCaching == null) {
      this.config.withCaching = true;
    }
    if (this.config.id_field == null) {
      this.config.id_field = 'id';
    }
    if (this.config.respondWithPayload == null) {
      this.config.respondWithPayload = true;
    }
    if (this.config.model == null) {
      this.config.model = ItemModel;
    } else {
      _.extend(this.config.model.prototype, ItemModel.prototype);
    }
    _.extend(this.config.model.prototype, {
      methods: {
        create: this.create,
        update: this.update,
        patch: this.patch,
        put: this.put,
        "delete": this["delete"],
        remove: this.remove
      },
      config: this.config
    });
    if (this.config.dontCollect == null) {
      return this.config.dontCollect = false;
    }
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#_initPublicProperties
  	 * @methodOf Private_methods
  	 * @description
  	 * Initialization of public properties of collection
   */


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#cache
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Object, storage of cached responses:
  	 * - Keys of cache are stringified params for request.
  	 * - Values of cache are ones of:
  	 *   - promises of pending requests
  	 *   - responses of requests
   */


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#objById
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Object, storage of collection items. Keys of object are item ids.<p>
  	 * <p>The id is the {@link ng-bundle-collection.Collection.config ng-bundle-collection.Collection.config}`.id_field` field of each item.</p>
  	 * <p>E.g.: <p>
  	<pre>
  		collection.add(item);
  		(collection.objId[item[collection.config.id_field]] === item) === true;
  	</pre>
  	 * *Note:* more handy and convenient way to take an item from `objById` storage is {@link ng-bundle-collection.Collection#by collection.by} method
   */


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#arr
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Array, storage of collection items.
   */


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#loading
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Number, flag which indicates the number of current pending requests through collection
   */


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#promises
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Promises container. All requests promises are consolidated into promises of this container.
  	 * Contains fields:
  	 * - `global` (all requests)
  	 * - `fetch` (get requests)
  	 * - `put` (put requests)
  	 * - `patch` (patch requests)
  	 * - `update` (put+patch requests)
  	 * - `create` (post requests)
  	 * - `delete` (delete requests)
   */

  Collection.prototype._initPublicProperties = function() {
    return _.extend(this, {
      cache: {},
      objById: {},
      arr: [],
      loading: 0,
      promises: {
        global: this.$q.when(),
        fetch: this.$q.when(),
        put: this.$q.when(),
        patch: this.$q.when(),
        update: this.$q.when(),
        create: this.$q.when(),
        "delete": this.$q.when()
      }
    });
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#_initProgressExposing
  	 * @methodOf Private_methods
  	 * @description
  	 * Binding to call extenal functions config.inc and config.dec when local increasement or decreasement of loading flag is happened
   */

  Collection.prototype._initProgressExposing = function() {
    if (_.isFunction(this.config.inc)) {
      this.inc = _.wrap(this.inc, (function(_this) {
        return function(original, data) {
          original(data);
          return _this.config.inc(data);
        };
      })(this));
    }
    if (_.isFunction(this.config.dec)) {
      return this.dec = _.wrap(this.dec, (function(_this) {
        return function(original, data) {
          original(data);
          return _this.config.dec(data);
        };
      })(this));
    }
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#_initExtendFns
  	 * @methodOf Private_methods
  	 * @description
  	 * Initialization of extending functions
   */


  /**
  	 * @ngdoc object
  	 * @name ng-bundle-collection.Collection#extendFns
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Object, storage of functions which extend collection actions
   */

  Collection.prototype._initExtendFns = function() {
    return _.extend(this, {
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


  /**
  	 * @ngdoc
  	 * @name Private_methods#_initInterceptors
  	 * @methodOf Private_methods
  	 * @description
  	 * Initialization of interceptors
   */


  /**
  	 * @ngdoc object
  	 * @name ng-bundle-collection.Collection#interceptors
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Object, storage of functions which can decorate response.</p>
  	 * <p>The interceptors are called as a chain in the order in which they were added.</p>
  	 * <p>Interceptors accept response as parameter and the ongoing response is replaced by the value returned from interceptor.</p>
  	 * <p>**Important**: so, the difference between {@link ng-bundle-collection.Collection collection}`.extendFns`
  	 * and {@link ng-bundle-collection.Collection collection}`.interceptors` is that interceptors can not only decorate the response
  	 * with some properties or implement some extending functionality, but they can replace the response with anything.</p>
   */

  Collection.prototype._initInterceptors = function() {
    return _.extend(this, {
      interceptors: {
        fetch: []
      }
    });
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#inc
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Increases the collection.loading flag by 1
  	 * @returns {number} Resulting collection.loading value
  	 * @example
  	 * collection.inc()
   */

  Collection.prototype.inc = function() {
    return this.loading++;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#dec
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {number} Resulting collection.loading value
  	 * @description
  	 * Decreases the collection.loading flag by 1
  	 * @example
  	 * collection.dec()
   */

  Collection.prototype.dec = function() {
    return this.loading--;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#isLoading
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {boolean} Whether the colletion is loading something or not
  	 * @example
  	 * collection.isLoading()
   */

  Collection.prototype.isLoading = function() {
    return this.loading;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#add
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {object|array} Added item or array of items
  	 * @description
  	 * Adds an item to collection.
  	 * Overwrites existing item if the id-field of item exists in collection
  	 * @param {object|array} data
  	 * <p>Item to be added or array of items.</p>
  	 * <p>Item must contain an id-field named the same as the config parameter {@link ng-bundle-collection.Collection.config collection.config}`.id_field` (by default it equals `'id'`)</p>
  	 * @param {object} params
  	 * Params object of request which responded with this item or array of items.
  	 * @example
  	<pre>
  		collection.add({
  			id: 0,
  			name: 'User Name',
  			email: 'email@email.com'
  		})
  	</pre>
   */

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


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#add_withToCache
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {object|array}
  	 * Added item or array of items
  	 * @description
  	 * Adds item to collection and extends cache record, specified by `Params` parameter
  	 * @param {object|array} data
  	 * <p>Item to be added or array of items.</p>
  	 * <p>Item must contain an id-field named the same as the config parameter `collection.config.id_field` (by default it equals `'id'`)</p>
  	 * @param {object} params
  	 * Params object that identifies which cache record should be the item added to
  	 * @example	
  	<pre>
  		collection.add({
  			id: 0,
  			name: 'User Name',
  			email: 'email@email.com'
  		}, {
  			name: 'User ',
  			email: 'email'
  		})
  	</pre>
  	This will add an item into cache record {@link ng-bundle-collection.Collection#cache collection.cache}`[JSON.stringify({
  			name: 'User ',
  			email: 'email'
  	})]`
   */

  Collection.prototype.add_withToCache = function(data, params) {
    var item, j, len, paramsMark, ref, response;
    response = this.add(data);
    paramsMark = this.__calcCacheMark(params);
    if (!_.isArray(data)) {
      data = [data];
    }
    for (j = 0, len = data.length; j < len; j++) {
      item = data[j];
      if ((this.cache[paramsMark] != null) && (ref = item[this.config.id_field], indexOf.call(_.pluck(this.cache[paramsMark].results, this.config.id_field), ref) < 0)) {
        this.cache[paramsMark].results.push(item);
      }
    }
    return response;
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__addOne
  	 * @methodOf Private_methods
  	 * @returns {object}
  	 * Added item
  	 * @description
  	 * <p>Adds single item to collection.</p>
  	 * <p>To add an item, please use `collection.add` or `collection.add_withToCache`</p>
  	 * @param {object} item
  	 * Item to be added.
  	 * @param {object} params
  	 * Params object of request which responded with this item.
   */

  Collection.prototype.__addOne = function(item, params) {
    var fn, j, l, len, len1, ref, ref1, ref2, results1;
    if (ref = item[this.config.id_field], indexOf.call(_.pluck(this.objById, this.config.id_field), ref) < 0) {
      ref1 = this.extendFns.add.b;
      for (j = 0, len = ref1.length; j < len; j++) {
        fn = ref1[j];
        fn(item);
      }
      if (this.config.model != null) {
        item = this.__wrapWithModel(item);
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


  /**
  	 * @ngdoc
  	 * @name Private_methods#__wrapWithModel
  	 * @methodOf Private_methods
  	 * @returns {object}
  	 * Wrapped item
  	 * @description
  	 * <p>Wraps an item with {@link ng-bundle-collection.Collection.config config}`.model`</p>
  	 * @param {object} item
  	 * Item to be wrapped.
   */

  Collection.prototype.__wrapWithModel = function(item) {
    if (_.isFunction(this.config.model)) {
      return new this.config.model(item);
    } else {
      return item;
    }
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#create
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {promise}
  	 * Promise which resolves with created item or rejects with error response
  	 * @description
  	 * <p>Creates single item in collection and at backend using specified REST configuration..</p>
  	 * <p>Makes `POST` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * @param {object} item
  	 * Item data
  	 * @example
  	<pre>
  		var collection = new Collection(Restangular.all('users'));
  		//This will make `POST` request to `users` endpoint.
  		collection.create({
  			name: 'User Name',
  			email: 'email@email.com'
  		});
  	</pre>
   */

  Collection.prototype.create = function(data) {
    var body, headers, params, promise;
    this.inc(data);
    body = this.__extractPayload(data);
    params = this.__extractParams(data);
    headers = this.__extractHeaders(data);
    promise = this.__rest(data).customPOST(body, null, params, headers).then((function(_this) {
      return function(response) {
        if (!_this.config.dontCollect) {
          _this.add(response);
        }
        return response;
      };
    })(this));
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec(data);
      };
    })(this));
    this.promises.create = this.$q.when(this.promises.create).then(function() {
      return promise;
    });
    this.promises.global = this.$q.when(this.promises.global).then(function() {
      return promise;
    });
    return promise;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#put
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Updates single item in collection and at backend using specified REST configuration.</p>
  	 * <p>Makes `PUT` request to endpoint by calling {@link Private_methods Private_methods}`.__update` method.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * <p>*Aliases: `update`*</p>
  	 * @param {object} item
  	 * Item data to be written to existing item
  	 * @example
  	<pre>
  		var users = new Collection(Restangular.all('users'), {
  			id_field: 'specific_id_field'
  		});
  		//Creating a user
  		users.create({
  			name: 'Some User Name',
  			email: 'some-email@email.com'
  		}).then(function(user){
  			//This will make `PATCH` request to `users/:user.id`.
  			users.put({
  				specific_id_field: user.specific_id_field,
  				name: 'User Name',
  				email: 'email@email.com'
  			});
  	
  		});
  	</pre>
   */

  Collection.prototype.put = function(data) {
    return this.__update(data, 'put');
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#patch
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Updates single item in collection and at backend using specified REST configuration.</p>
  	 * <p>Makes `PATCH` request to endpoint by calling {@link Private_methods Private_methods}`.__update` method.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * <p>*Aliases: `update`*</p>
  	 * @param {object} item
  	 * Item data to be written to existing item
  	 * @example
  	<pre>
  		var users = new Collection(Restangular.all('users'), {
  			id_field: 'specific_id_field'
  		});
  		//Creating a user
  		users.create({
  			name: 'Some User Name',
  			email: 'some-email@email.com'
  		}).then(function(user){
  			//This will make `PATCH` request to `users/:user.id`.
  			users.patch({
  				specific_id_field: user.specific_id_field,
  				name: 'User Name',
  				email: 'email@email.com'
  			});
  	
  		});
  	</pre>
   */

  Collection.prototype.patch = function(data) {
    return this.__update(data, 'patch');
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#update
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Updates single item in collection and at backend using specified REST configuration.</p>
  	 * <p>Makes `PATCH` request to endpoint by calling {@link Private_methods Private_methods}`.__update` method.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * <p>*Aliases: `patch`*</p>
  	 * @param {object} item
  	 * Item data to be written to existing item
  	 * @example
  	<pre>
  		var users = new Collection(Restangular.all('users'), {
  			id_field: 'specific_id_field'
  		});
  		//Creating a user
  		users.create({
  			name: 'Some User Name',
  			email: 'some-email@email.com'
  		}).then(function(user){
  			//This will make `PATCH` request to `users/:user.id`.
  			users.update({
  				specific_id_field: user.specific_id_field,
  				name: 'User Name',
  				email: 'email@email.com'
  			});
  	
  		});
  	</pre>
   */

  Collection.prototype.update = function() {
    return this.patch.apply(this, arguments);
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__update
  	 * @methodOf Private_methods
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Updates single item in collection and at backend using specified REST configuration.</p>
  	 * <p>Makes `PATCH` or `PUT` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * <p>*Is used by public methods `put`, `patch`, `update`*</p>
  	 * @param {object} item
  	 * Item data to be written to existing item
  	 * @param {string} method
  	 * Method to be done for updating. Can be 'put' or 'patch'.
   */

  Collection.prototype.__update = function(data, method) {
    var body, headers, params, promise;
    this.inc(data);
    body = this.__extractPayload(data);
    params = this.__extractParams(data);
    headers = this.__extractHeaders(data);
    promise = this.__rest(data).customOperation(method, null, params, headers, body).then((function(_this) {
      return function(response) {
        if (!_this.config.dontCollect) {
          _this.update_locally(response);
        }
        return response;
      };
    })(this));
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec(data);
      };
    })(this));
    this.promises[method] = this.$q.when(this.promises[method]).then(function() {
      return promise;
    });
    this.promises.update = this.$q.when(this.promises.update).then(function() {
      return promise;
    });
    this.promises.global = this.$q.when(this.promises.global).then(function() {
      return promise;
    });
    return promise;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#update_locally
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {object} 
  	 * Updated item
  	 * @description
  	 * <p>Updates single item in collection locally (doesnt affect backend).</p>
  	 * @param {object} item
  	 * Item data to be written to existing item
  	 * @example
  	<pre>
  		collection.update_locally({
  			__id: 1,
  			name: 'User Name',
  			email: 'email@email.com'
  		})
  	</pre>
   */

  Collection.prototype.update_locally = function(item) {
    var elem, index, j, len, ref;
    this.objById[item[this.config.id_field]] = item;
    ref = this.arr;
    for (index = j = 0, len = ref.length; j < len; index = ++j) {
      elem = ref[index];
      if (elem[this.config.id_field] === item[this.config.id_field]) {
        _.extend(this.arr[index], _.omit(item, _.isFunction));
        break;
      }
    }
    this.__callExtendFns(this.extendFns.update, item);
    return item;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#delete
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {promise} 
  	 * Promise which resolves with deleted item or rejects with error response
  	 * @description
  	 * <p>Removes single item from collection and deletes it at backend using specified REST configuration.</p>
  	 * <p>Makes `DELETE` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * @param {object} item
  	 * Item data, must contain id-field
  	 * @example
  	<pre>
  		//creating collection, with id-field 'id' by default
  		var users = new Collection(Restangular.all('users'));
  		//Creating a user
  		users.create({
  			name: 'Some User Name',
  			email: 'some-email@email.com'
  		}).then(function(user){
  			//This will make `DELETE` request to `users/:user.id`.
  			users.delete(user);
  			//or
  			users.delete({
  				id: user.id
  			});
  
  		});
  	</pre>
   */

  Collection.prototype["delete"] = function(item) {
    var headers, params, promise;
    this.inc(item);
    params = this.__extractParams(item);
    headers = this.__extractHeaders(item);
    promise = this.__rest(item).remove(params, headers).then((function(_this) {
      return function(response) {
        if (!_this.config.dontCollect) {
          _this.remove(item);
        }
        return response;
      };
    })(this));
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec(item);
      };
    })(this));
    this.promises["delete"] = this.$q.when(this.promises["delete"]).then(function() {
      return promise;
    });
    this.promises.global = this.$q.when(this.promises.global).then(function() {
      return promise;
    });
    return promise;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#remove
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {object} 
  	 * Removed item
  	 * @description
  	 * <p>Removes single item from collection locally.</p>
  	 * @param {object} item
  	 * Item data, must contain id-field
  	 * @example
  	<pre>
  		//creating collection, with id-field 'id' by default
  		var users = new Collection(Restangular.all('users'));
  		//Creating a user
  		users.create({
  			name: 'Some User Name',
  			email: 'some-email@email.com'
  		}).then(function(user){
  			//This will remove user from collection, but not from backend
  			users.remove(user);
  			//or
  			users.remove({
  				id: user.id
  			});
  
  		});
  	</pre>
   */

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
    this.__callExtendFns(this.extendFns.remove, item);
    return item;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#clear
  	 * @methodOf ng-bundle-collection.Collection
  	 * @this {object} {@link ng-bundle-collection.Collection collection} instance
  	 * @params {object} settings
  	 * Settings of clearing (object with boolean flags):
  	 * - withExtendFns=false - whether to remove all configured extending functions ({@link ng-bundle-collection.Collection collection}`.extendFns`)
  	 * - withInterceptors=false - whether to remove all {@link ng-bundle-collection.Collection collection}`.interceptors`
  	 * @returns {object}
  	 * this, {@link ng-bundle-collection.Collection collection} instance
  	 * @description
  	 * Clears collection by taking it back to initial empty state.
  	 * @example
  	<pre>
  		//creating collection, with id-field 'id' by default
  		var users = new Collection(Restangular.all('users'));
  		//Creating a user
  		users.create({
  			name: 'Some User Name',
  			email: 'some-email@email.com'
  		}).then(function(user){
  			console.log(users.arr.length);
  			//logs `1`
  
  			users.clear();
  
  			console.log(users.arr.length);
  			//logs `0`
  		});
  	</pre>
   */

  Collection.prototype.clear = function(settings) {
    var item, j, len, ref;
    if (settings.withExtendFns) {
      this._initExtendFns();
    }
    if (settings.withInterceptors) {
      this._initInterceptors();
    }
    ref = angular.copy(this.arr);
    for (j = 0, len = ref.length; j < len; j++) {
      item = ref[j];
      this.remove(item);
    }
    this.obj = {};
    return this;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#extendUpdate
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.update`
  	 * @param {function} fn
  	 * Extending function
  	 * @example
  	<pre>
  		var updated_items = []
  		//..... 
  		collection.extendUpdate(function(item){
  			item.is_updated = true;
  			updated_items.push(item);
  		});
  	</pre>
   */

  Collection.prototype.extendUpdate = function(fn) {
    return this.extendFns.update.push(fn);
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#extendRemove
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.remove`
  	 * @param {function} fn
  	 * Extending function
  	 * @example
  	<pre>
  		var removed_items = []
  		//..... 
  		collection.extendRemove(function(item){
  			removed_items.push(item);
  		});
  	</pre>
   */

  Collection.prototype.extendRemove = function(fn) {
    return this.extendFns.remove.push(fn);
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#extendAdd
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.add` structure
  	 * @param {object} fns
  	 * Object, keys can be:
  	 * - `'b'` - function will be executed before adding to collection (to `arr` and `objById`)
  	 * - `'a'` - function will be executed after adding to collection (to `arr` and `objById`)
  	 * Values are extending functions
  	 * @example
  	<pre>
  		//for example, extendAdd can be used as a decorator for each item
  		collection.extendAdd({
  			b: function(item){
  				_.extend(item, {
  					//...
  				});
  			}
  		});
  	</pre>
   */

  Collection.prototype.extendAdd = function(fns) {
    var k, results1, v;
    results1 = [];
    for (k in fns) {
      v = fns[k];
      results1.push(this.extendFns.add[k].push(v));
    }
    return results1;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#extendFetch
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.fetch` structure
  	 * @param {object} fns
  	 * Object, keys can be:
  	 * - `'b'` - function will be executed before fetching
  	 * - `'s'` - function will be executed after fetching, on success
  	 * - `'e'` - function will be executed after fetching, on error
  	 * - `'f'` - function will be executed after fetching, bot on success and error
  	 * Values are extending functions
  	 * @example
  	<pre>
  		//for example, extendAdd can be used as a decorator for each item
  		collection.extendFetch({
  			s: function(successResponse, requestParams){
  				...
  			},
  			e: function(errorResponse, requestParams){
  				...
  			}
  		});
  	</pre>
   */

  Collection.prototype.extendFetch = function(fns) {
    var k, results1, v;
    results1 = [];
    for (k in fns) {
      v = fns[k];
      results1.push(this.extendFns.fetch[k].push(v));
    }
    return results1;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#addInterceptor
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Adds function to {@link ng-bundle-collection.Collection#interceptors ng-bundle-collection.Collection#interceptors} structure
  	 * @param {object} fns
  	 * Object, keys can be:
  	 * - `'fetch'` - interceptors will be executed on fetching success
  	 * Values are interceptors
  	 * @example
  	<pre>
  		collection.addInterceptor({
  			fetch: function(successResponse){
  				...
  				return modified_or_replaced_response;
  			}
  		});
  	</pre>
   */

  Collection.prototype.addInterceptor = function(fns) {
    var e, k, results1, v;
    results1 = [];
    for (k in fns) {
      v = fns[k];
      try {
        if (!_.isArray(this.interceptors[k])) {
          throw "Wrong interceptor type: " + k + ".";
        } else {
          results1.push(this.interceptors[k].push(v));
        }
      } catch (_error) {
        e = _error;
        results1.push(console.error(e));
      }
    }
    return results1;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#addFetchInterceptor
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Adds function to {@link ng-bundle-collection.Collection#interceptors ng-bundle-collection.Collection#interceptors}`.fetch` chain
  	 * @param {function} fn
  	 * Function which will be added to fetch interceptors chain.
  	 * @example
  	<pre>
  		collection.addFetchInterceptor(function(successResponse){
  			...
  			return modified_or_replaced_response;
  		});
  	</pre>
   */

  Collection.prototype.addFetchInterceptor = function(fn) {
    return this.addInterceptor({
      fetch: fn
    });
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#at
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Takes an item from {@link ng-bundle-collection.Collection collection}`.arr` by index
  	 * @returns {object}
  	 * Item from collection
  	 * @param {number} index
  	 * Index of item in {@link ng-bundle-collection.Collection collection}`.arr`
  	 * @example
  	<pre>
  		collection.create({...});
  		//...
  		var item = collection.at(0);
  	</pre>
   */

  Collection.prototype.at = function(index) {
    return this.arr[index];
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#by
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Takes an item from {@link ng-bundle-collection.Collection collection}`.objById` by its id
  	 * @returns {object}
  	 * Item from collection
  	 * @param {number|string} id
  	 * Id-field value of item
  	 * @example
  	<pre>
  		var users = new Collection(Restangular.all('users'));
  		//...
  		users.create({id:0, ...});
  		//...
  		var user = users.by(0);
  	</pre>
   */

  Collection.prototype.by = function(id) {
    return this.objById[id];
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#where
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Searches in collection for the items which have particular fields with particular values</p>
  	 * <p>Uses {@link https://lodash.com/ lodash} method `where`
  	 * @returns {array}
  	 * Array of items which contain all the fields with specified values
  	 * @param {object} obj
  	 * Object with fields which items should match to be found
  	 * @example
  	<pre>
  		collection.where({level: 25, first_name: 'Andrew'});
  	</pre>
   */

  Collection.prototype.where = function(obj) {
    return _.where(this.arr, obj);
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#singleWhere
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Searches in collection for the single item which has particular fields with particular values</p>
  	 * <p>Uses {@link https://lodash.com/ lodash} method `findWhere`
  	 * @returns {object}
  	 * <p>Item which contains all the fields with specified values.</p>
  	 * <p>*Note:* If there is multiple items that match, the first occurence in {@link ng-bundle-collection.Collection collection}`.arr` will be returned</p>
  	 * @param {object} obj
  	 * Object with fields which the item should match to be found
  	 * @example
  	<pre>
  		collection.singleWhere({level: 25, first_name: 'Andrew'});
  	</pre>
   */

  Collection.prototype.singleWhere = function(obj) {
    return _.findWhere(this.arr, obj);
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#fetch
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Fetching data from backend.</p>
  	 * <p>Makes `GET` request to configured endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
  	 * @returns {promise|object}
  	 * - Object of response if the result for given `params` is cached
  	 * <p>*or*</p>
  	 * - Promise which
  	 *   - resolves with object of response
  	 *   - rejects with object of error
  	 * <p>after Restangular request is finished</p>
  	 * @param {object} params
  	 * Request params object
  	 * @example
  	<pre>
  		collection.fetch({
  			page: 1,
  			page_size: 10,
  			name: 'User'
  		}).then(function(items){
  			//...
  		});
  	</pre>
   */

  Collection.prototype.fetch = function(_params) {
    var id, params, paramsStr;
    if (_params == null) {
      _params = {};
    }
    params = angular.copy(this.config.params || {});
    _.extend(params, _params);
    id = params[this.config.id_field];
    if (this.objById[id] != null) {
      return this.$q.when(this.objById[id]);
    } else {
      paramsStr = this.__calcCacheMark(params);
      if (this.cache[paramsStr] != null) {
        return this.$q.when(this.cache[paramsStr]);
      } else {
        return this.__private_fetch(params);
      }
    }
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#cancelAllRequests
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * Cancels all current pending requests (all promises in {@link ng-bundle-collection.Collection collection}`.cache`)
  	 * @example
  	<pre>
  		collection.cancelAllRequests();
  	</pre>
   */

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


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#invalidate
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Clears {@link ng-bundle-collection.Collection collection}`.cache`</p>
  	 * <p>Deletes cached responses where the key corresponds to params object, which **contains** passed params</p>
  	 * @param {object|array} data
  	 * - The params object, which determines deleted cached responses
  	 * <p>*or*<p>
  	 * - The array of such params objects
  	 * @example
  	 * <p>This deletes all cache records, whose keys correspond to params object with </p>
  	 * <p>`'page_size' == 10` **AND** `'name' == 'asd'`</p>
  	<pre>
  		collection.invalidate({page_size:10, name: 'asd'});
  	</pre>
   */

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


  /**
  	 * @ngdoc
  	 * @name Private_methods#__invalidateParams
  	 * @methodOf Private_methods
  	 * @description
  	 * <p>Deletes cached responses where the key corresponds to params object, which **contains** passed params</p>
  	 * <p>Is called by {@link ng-bundle-collection.Collection Collection}.invalidate for each params object</p>
  	 * @param {object} params
  	 * The params object, which determines deleted cached responses
  	 * @example
  	 * <p>This deletes all cache records, whose keys correspond to params object with </p>
  	 * <p>`'page_size' == 10` **AND** `'name' == 'asd'`</p>
  	<pre>
  		collection.invalidate({page_size:10, name: 'asd'});
  	</pre>
   */

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


  /**
  	 * @ngdoc
  	 * @name Private_methods#__callExtendFns
  	 * @methodOf Private_methods
  	 * @description
  	 * Invokes each extending function from array with passed params.
  	 * Extending functions array is taken from {@link ng-bundle-collection.Collection Collection}.extendFns
  	 * @param {array} fns_arr
  	 * Array of functions to be called
  	 * @params Other parameters
   */

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


  /**
  	 * @ngdoc
  	 * @name Private_methods#__callInterceptors
  	 * @methodOf Private_methods
  	 * @returns {object|array}
  	 * Value which is returned from the last interceptor in chain
  	 * @description
  	 * Invokes each interceptor from array (chain) with passed params.
  	 * Extending functions array is taken from {@link ng-bundle-collection.Collection Collection}.extendFns
  	 * @param {array} fns_arr
  	 * Array of functions to be called
  	 * @param {object|array} response
  	 * Response from previous interceptor or otiginal response
  	 * @param {object} params
  	 * Params object with which was the request made
   */

  Collection.prototype.__callInterceptors = function(fns_arr, response, params) {
    var e, fn, j, len;
    for (j = 0, len = fns_arr.length; j < len; j++) {
      fn = fns_arr[j];
      try {
        if ((response = fn(response, params)) == null) {
          throw "Interceptor returned wrong response: " + response;
        }
      } catch (_error) {
        e = _error;
        console.error(e);
      }
    }
    return response;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#__setMock
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Sets the response mock.</p>
  	 * <p>No requests to backend will be made if the mock is set.</p>
  	 * @param {object} mock
  	 * The mock which should be responded to any {@link ng-bundle-collection.Collection collection}`.fetch` request
  	 * @param {number} mockDelay
  	 * The number of milliseconds of timeout before responding with mock
  	 * @example
  	<pre>
  		collection.__setMock([
  			{
  				id: 0,
  				name: 'User1'
  			},
  			{
  				id: 1,
  				name: 'User2'
  			}
  		]);
  	</pre>
   */

  Collection.prototype.__setMock = function(mock, mockDelay) {
    this.mock = mock;
    this.mockDelay = mockDelay;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#__removeMock
  	 * @methodOf ng-bundle-collection.Collection
  	 * @description
  	 * <p>Removes current response mock.</p>
  	 * @example
  	<pre>
  		collection.__removeMock();
  	</pre>
   */

  Collection.prototype.__removeMock = function() {
    this.mock = null;
    return this.mockDelay = null;
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__private_fetch
  	 * @methodOf Private_methods
  	 * @description
  	 * <p>Implements the fetching action.</p>
  	 * <p>For perform fetching via collection, please use {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}`.fetch` method</p>
  	 * @param {object} params
  	 * Params for fetch request
   */

  Collection.prototype.__private_fetch = function(params) {
    var deferred, paramsStr, rest;
    this.inc(params);
    this.__callExtendFns(this.extendFns.fetch.b, params);
    rest = this.__rest(params);
    paramsStr = this.__calcCacheMark(params);
    deferred = this.$q.defer();
    if (this.mock) {
      this.$timeout((function(_this) {
        return function() {
          _this.__success(_this.mock, params);
          return deferred.resolve(_this.mock);
        };
      })(this), this.mockDelay || this.defaultMockDelay);
    } else {
      rest.customGET('', this.__extractPayload(params)).then((function(_this) {
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
    deferred.promise["finally"]((function(_this) {
      return function() {
        return _this.dec(params);
      };
    })(this));
    _.extend(deferred.promise, {
      __selfResolve: deferred.resolve,
      __selfReject: deferred.reject
    });
    this.promises.fetch = this.$q.when(this.promises.fetch).then(function() {
      return deferred.promise;
    });
    this.promises.global = this.$q.when(this.promises.global).then(function() {
      return deferred.promise;
    });
    return this.cache[paramsStr] = deferred.promise;
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__success
  	 * @methodOf Private_methods
  	 * @description
  	 * <p>Success callback for fetching action.</p>
  	 * - Adds results to collection
  	 * - Calls extending success ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.s`) functions
  	 * - Calls extending final ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.f`) functions
  	 * @param {object} response
  	 * Success response from backend
  	 * @param {object} params
  	 * Params object, with which was the request done.
   */

  Collection.prototype.__success = function(response, params) {
    var response_formatted;
    response = this.__callInterceptors(this.interceptors.fetch, response, params);
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


  /**
  	 * @ngdoc
  	 * @name Private_methods#__error
  	 * @methodOf Private_methods
  	 * @description
  	 * <p>Error callback for fetching action.</p>
  	 * - Calls extending error ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.e`) functions
  	 * - Calls extending final ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.f`) functions
  	 * @param {object} response
  	 * Error response from backend
  	 * @param {object} params
  	 * Params object, with which was the request done.
   */

  Collection.prototype.__error = function(response, params) {
    this.__callExtendFns(this.extendFns.fetch.e, response, params);
    return this.__callExtendFns(this.extendFns.fetch.f, response, params);
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__calcCacheMark
  	 * @methodOf Private_methods
  	 * @returns {string}
  	 * The string mark of params
  	 * @description
  	 * <p>Calculates string mark for cache entry</p>
  	 * <p>Params mark is used for:</p>
  	 * - marking responses for requests and determining if the response is already cached
  	 * - marking promises and determining if the request is already pending
  	 * @param {object} params
  	 * Params object
   */

  Collection.prototype.__calcCacheMark = function(params) {
    return JSON.stringify(params);
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__determineResponse
  	 * @methodOf Private_methods
  	 * @returns {object}
  	 * Formatted response
  	 * @description
  	 * <p>Formats the response to fetch action from backend.</p>
  	 * <p>The format of resulting response is:</p>
  	 * - if the response is expected to be an `Array`, then the response is
  	<pre>
  		{
  			results: [
  				//array of items of array
  			],
  		}
  	</pre>
  	 * - if the response is expected to be an `Object`, then response is just the same as backend sent
  	 * <p>Adds `__payload` with `params` if the {@link ng-bundle-collection.Collection collection}`.config.respondWithPayload` is `true`</p>
  	 * <p>Each item comes decorated with {@link ng-bundle-collection.Collection collection}`.config.model`</p>
  	 * @param {object} response
  	 * Success response from backend
  	 * @param {object} params
  	 * Params object, with which was the request done.
   */

  Collection.prototype.__determineResponse = function(response, params) {
    var item, results;
    response = (function() {
      var j, l, len, len1, len2, m, ref, results1, results2;
      if (this.config.dontCollect) {
        if ((this.config.model != null) && _.isArray(response)) {
          results1 = [];
          for (j = 0, len = response.length; j < len; j++) {
            item = response[j];
            results1.push(this.__wrapWithModel(item));
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
            return this.objById[response[this.config.id_field]] || response;
          }
        }
      }
    }).call(this);
    if (this.config.respondWithPayload) {
      response.__payload = params;
    }
    return response;
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__initCacheClearing
  	 * @methodOf Private_methods
  	 * @description
  	 * <p>Adds extending function for fetch success ({@link ng-bundle-collection.Colleciton collection}`.extendFns.fetch.s`), which clears promises from cache</p>
  	 * <p>Invoked if the cache is disabled by {@link ng-bundle-collection.Colleciton.config config}`.withCaching === false`
   */

  Collection.prototype.__initCacheClearing = function() {
    return this.extendFetch({
      s: (function(_this) {
        return function(response, params) {
          return delete _this.cache[_this.__calcCacheMark(params)];
        };
      })(this)
    });
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__initCaching
  	 * @methodOf Private_methods
  	 * @description
  	 * <p>Enable caching by adding extending functions for fetch success ({@link ng-bundle-collection.Colleciton collection}`.extendFns.fetch.s`)
  	 * and for fetch error ({@link ng-bundle-collection.Colleciton collection}`.extendFns.fetch.e`)</p>
  	 * <p>Invoked if the cache is ensabled by {@link ng-bundle-collection.Colleciton.config config}`.withCaching === true`
   */

  Collection.prototype.__initCaching = function() {
    return this.extendFetch({
      s: (function(_this) {
        return function(response, params, method) {
          return _this.cache[_this.__calcCacheMark(params)] = angular.copy(response);
        };
      })(this),
      e: (function(_this) {
        return function(response, params) {
          return delete _this.cache[_this.__calcCacheMark(params)];
        };
      })(this)
    });
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection.isCached
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {boolean} Is cached or not
  	 * @description
  	 * Determines whether the response for request with particular params object is cached
  	 * @example
  	<pre>
  		var isFirstPageCached = collection.isCached({page: 1, page_size: 10});
  	</pre>
   */

  Collection.prototype.isCached = function(params) {
    return this.getCached(params) != null;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection.getCached
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {object} cached response or undefined
  	 * @description
  	 * Extracts the response for request with particular params object
  	 * @example
  	<pre>
  		var cachedResponseForFirstPage = collection.getCached({page: 1, page_size: 10});
  	</pre>
   */

  Collection.prototype.getCached = function(params) {
    return this.cache[this.__calcCacheMark(params)];
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__rest
  	 * @methodOf Private_methods
  	 * @returns {object} Restangular instance
  	 * @description
  	 * Extracts the Restangular instance which is configured to perform REST actions
   */

  Collection.prototype.__rest = function(params) {
    var ref, rest;
    rest = _.isFunction(this.rest) ? this.rest(params) : this.rest;
    if (params[this.config.id_field] != null) {
      rest = rest.one(params[this.config.id_field].toString());
      delete params[this.config.id_field];
    }
    if (((ref = params.__subconfig) != null ? ref.url : void 0) != null) {
      rest = rest.one(params.__subconfig.url);
    }
    return rest;
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__extractPayload
  	 * @methodOf Private_methods
  	 * @returns {object} Extracted payload
  	 * @description
  	 * Extracts payload from data to be passed to rest call by removing config fields
   */

  Collection.prototype.__extractPayload = function(data) {
    return _.omit(data, this.config.id_field, '__subconfig', '__params', '__headers');
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__extractParams
  	 * @methodOf Private_methods
  	 * @returns {object} Extracted url params
  	 * @description
  	 * Extracts url params to be passed to rest call by removing config fields
   */

  Collection.prototype.__extractParams = function(data) {
    return data.__params;
  };


  /**
  	 * @ngdoc
  	 * @name Private_methods#__extractHeaders
  	 * @methodOf Private_methods
  	 * @returns {object} Extracted headers
  	 * @description
  	 * Extracts headers to be passed with rest call by removing config fields
   */

  Collection.prototype.__extractHeaders = function(data) {
    return data.__headers;
  };


  /**
  	 * @ngdoc object
  	 * @name Static_methods
  	 * @description
  	 * Static properties of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}
   */


  /**
  	 * @ngdoc
  	 * @name Static_methods#instances
  	 * @propertyOf Static_methods
  	 * @description
  	 * Array of all {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} instances
   */

  Collection.instances = [];


  /**
  	 * @ngdoc
  	 * @name Static_methods#invalidate
  	 * @methodOf Static_methods
  	 * @description
  	 * Invalidates all instances (clears `cache`) of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} by calling `invalidate` methods
   */

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


  /**
  	 * @ngdoc
  	 * @name Static_methods#cancelAllRequests
  	 * @methodOf Static_methods
  	 * @description
  	 * Cancels all pending requests in all instances of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} by calling `cancelAllRequests` methods
   */

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


  /**
  	 * @ngdoc
  	 * @name Static_methods#clear
  	 * @methodOf Static_methods
  	 * @description
  	 * Clears all instances (clears `arr` and `objById`) of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} by calling `clear` methods
  	 * @param {object} settings
  	 * Settings of clearing (object with boolean flags):
  	 * - withExtendFns=false - whether to remove all configured extending functions ({@link ng-bundle-collection.Collection collection}`.extendFns`)
  	 * - withInterceptors=false - whether to remove all {@link ng-bundle-collection.Collection collection}`.interceptors`
   */

  Collection.clear = function(settings) {
    var i, j, len, ref, results1;
    ref = this.instances;
    results1 = [];
    for (j = 0, len = ref.length; j < len; j++) {
      i = ref[j];
      results1.push(i.clear(settings));
    }
    return results1;
  };

  return Collection;

})();

(function() {
  var module;
  module = angular.module('ng-bundle-collection');
  return module.config([
    'RestangularProvider', function(RestangularProvider) {
      return RestangularProvider.setResponseExtractor(function(response) {
        var i, item, len;
        if (_.isArray(response)) {
          for (i = 0, len = response.length; i < len; i++) {
            item = response[i];
            item.unrestangularized = angular.copy(item);
          }
        } else {
          response.unrestangularized = angular.copy(response);
        }
        return response;
      });
    }
  ]);
})();
