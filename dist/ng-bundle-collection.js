
/**
 * @ngdoc object
 * @name ItemModel
 * @description
 * <p>Class that represents default model for each collection item</p>
 * <p>Can be extended by custom item model</p>
 * @param {object} item
 * Object that represents item data
 * @param {object} collection
 * Collection instance to which the item belongs
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
  function ItemModel(item, collection) {
    this.collection = collection;
    this.save = bind(this.save, this);
    this.update_locally = bind(this.update_locally, this);
    this.update = bind(this.update, this);
    this["delete"] = bind(this["delete"], this);
    this.remove = bind(this.remove, this);
    _.extend(this, item);
  }


  /**
  	 * @ngdoc
  	 * @name ItemModel#remove
  	 * @methodOf ItemModel
  	 * @returns {object}
  	 * Removed item
  	 * @description
  	 * <p>Removes the item from collection locally.</p>
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
  			user.remove();
  		});
  	</pre>
   */

  ItemModel.prototype.remove = function() {
    return this.collection.remove(this);
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
  			user.delete();
  		});
  	</pre>
   */

  ItemModel.prototype["delete"] = function() {
    return this.collection["delete"](this);
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
  			user.update({
  				name: 'User Name',
  				email: 'email@email.com'
  			});
  
  		});
  	</pre>
   */

  ItemModel.prototype.update = function(data) {
    this.update_locally(data);
    return this.save();
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
  			//user will have new name and email
  			user.update_locally({
  				name: 'User Name',
  				email: 'email@email.com'
  			});
  
  		});
  	</pre>
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
  			_.extend(user, {
  				name: 'User Name',
  				email: 'email@email.com'
  			});
  
  			//...
  			user.flag = true
  
  			//This will make `PATCH` request to `users/:user.id`.
  			user.save();
  		});
  	</pre>
   */

  ItemModel.prototype.save = function() {
    return this.collection.update(this);
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
  module = angular.module('ng-bundle-collection', []);

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
  	 * Configuration for collection
  	 * @example
  	<pre>
  		var collection = new Collection(Restangular.all('users'), {
  			withCaching: true,
  			id_field: 'id',
  			respondWithPayload: true
  		});
  	</pre>
   */
  return module.factory('Collection', function($q, $timeout) {
    return function(rest, config) {
      return new Collection($q, $timeout, rest, config);
    };
  });
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
    this.add_withToCache = bind(this.add_withToCache, this);
    this.add = bind(this.add, this);
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
  	 * Decorator model class for collection items
  	 * @property {boolean} dontCollect=false
  	 * <p>If set to `true`, the collection wouldnt collect the responses in its `arr` and `objById` containers.</p>
  	 * <p>This wouldnt affect caching ability, the cache will work as usual.</p>
  	 * <p>This can be used to use collection only as fetching agent, which is useful i.e. when the data is not a collection, but the object, maybe some settings object or else.</p>
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
    }
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
  	 * @ngdoc object
  	 * @name ng-bundle-collection.Collection#extendFns
  	 * @propertyOf ng-bundle-collection.Collection
  	 * @description
  	 * Object, storage of functions which extend collection actions
   */

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
    paramsMark = this.__calcParamsMark(params);
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
        item = new this.config.model(item, this);
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
    var promise;
    this.inc();
    promise = this.__rest(data).post(data).then((function(_this) {
      return function(response) {
        _this.add(response);
        return response;
      };
    })(this));
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec();
      };
    })(this));
    return promise;
  };


  /**
  	 * @ngdoc
  	 * @name ng-bundle-collection.Collection#update
  	 * @methodOf ng-bundle-collection.Collection
  	 * @returns {promise} 
  	 * Promise which resolves with updated item or rejects with error response
  	 * @description
  	 * <p>Updates single item in collection and at backend using specified REST configuration.</p>
  	 * <p>Makes `PATCH` request to endpoint.</p>
  	 * <p>Affects `collection.loading` flag</p>
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

  Collection.prototype.update = function(data) {
    var promise;
    this.inc();
    promise = this.__rest(data).one(data[this.config.id_field].toString()).patch(data).then((function(_this) {
      return function(response) {
        _this.update_locally(response);
        return response;
      };
    })(this));
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec();
      };
    })(this));
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
        this.arr[index] = item;
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
    var promise;
    this.inc();
    promise = this.__rest(item).one(item[this.config.id_field].toString()).remove().then((function(_this) {
      return function(response) {
        _this.remove(item);
        return response;
      };
    })(this));
    promise["finally"]((function(_this) {
      return function() {
        return _this.dec();
      };
    })(this));
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
  	 * @name Private_methods#__calcParamsMark
  	 * @methodOf Private_methods
  	 * @returns {string}
  	 * The string mark of params
  	 * @description
  	 * <p>Calculates string mark for parameters object</p>
  	 * <p>Params mark is used for:</p>
  	 * - marking responses for requests and determining if the response is already cached
  	 * - marking promises and determining if the request is already pending
  	 * @param {object} params
  	 * Params object
   */

  Collection.prototype.__calcParamsMark = function(params) {
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
            results1.push(new this.config.model(item, this));
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
          return delete _this.cache[_this.__calcParamsMark(params)];
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
    return this.cache[this.__calcParamsMark(params)];
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
    if (_.isFunction(this.rest)) {
      return this.rest(params);
    } else {
      return this.rest;
    }
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
  	 * @param {boolean} withExtendFns
  	 * Whether to remove all extending functions.
   */

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
