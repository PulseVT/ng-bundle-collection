do ->
	###*
	# @ngdoc object
	# @name ng-bundle-collection
	# @description
	# Main module which contains {@link ng-bundle-collection.Collection Collection} factory
	###
	module = angular.module 'ng-bundle-collection', []

	###*
	# @ngdoc service
	# @name ng-bundle-collection.Collection
	# @description
	# Wraps Collection class into angular factory
	# @requires $q
	# @requires $timeout
	# @param {object} rest
	# Restangular instance
	# @param {object} config
	# <p>Configuration for collection.</p>
	# <p>Please see {@link ng-bundle-collection.Collection.config ng-bundle-collection.Collection.config} for available config properties.</p>
	# @example
	# <p>Creating collection:</p>
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
	# <p>Collection can be wrapped with a service and be used as a single source of truth in your application:</p>
	<pre>
		var module = angular.module('App', []);

		module.service('users', function(Collection, Restangular){
			return new Collection(Restangular.all('users'), {
				//... config
			});
		});
	</pre>
	# <p>You also can use ng-bundle-collection as a **local** collection (without work with backend) of any items to leverage the local api</p>
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
	###
	module.factory 'Collection', ($q, $timeout) ->
		(rest, config) ->
			new Collection $q, $timeout, rest, config

###*
# @ngdoc object
# @name Private_methods
# @description
# Private methods of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}
###
class Collection
	constructor: (@$q, @$timeout, @rest, @config = {}) ->
		Collection.instances.push @

		@_initConfig()
		@_initPublicProperties()
		@_initExtendFns()
		@_initInterceptors()

		if @config.withCaching then @__initCaching() else @__initCacheClearing()

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#defaultMockDelay
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# Number of milliseconds for responding with mock
	###
	defaultMockDelay: 500

	###*
	# @ngdoc
	# @name Private_methods#_initConfig
	# @methodOf Private_methods
	# @description
	# Populating collection config with defaults
	###
	###*
	# @ngdoc object
	# @name ng-bundle-collection.Collection.config
	# @description
	# Configuration object of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} instances
	# @property {boolean} withCaching=true
	# Controls whether to initialize caching mechanism for collection
	# @property {string} id_field="id"
	# Name of identification field for each collection item
	# @property {boolean} respondWithPayload=true
	# Controls whether to add payload of each request as a **`__payload`** field in response
	# @property {class} model
	# <p>Decorator model class for collection items</p>
	# <p>*Note:* this has to be a function as javascript classes can be defined only as functions. Of course, the CoffeeScript classes are welcome :)</p>
	# @property {boolean} dontCollect=false
	# <p>If set to `true`, the collection wouldnt collect the responses in its `arr` and `objById` containers.</p>
	# <p>This wouldnt affect caching ability, the cache will work as usual.</p>
	# <p>This can be used to use collection only as fetching agent, which is useful i.e. when the data is not a collection, but the object, maybe some settings object or else.</p>
	# @property {object} params
	# Default params to be included into each get request made by {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}`.fetch`
	###
	_initConfig: =>
		@config.withCaching = yes unless @config.withCaching?
		@config.id_field = 'id' unless @config.id_field?
		@config.respondWithPayload = yes unless @config.respondWithPayload?
		@config.model = ItemModel unless @config.model?
		@config.dontCollect = no unless @config.dontCollect?


	###*
	# @ngdoc
	# @name Private_methods#_initPublicProperties
	# @methodOf Private_methods
	# @description
	# Initialization of public properties of collection
	###
	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#cache
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# Object, storage of cached responses:
	# - Keys of cache are stringified params for request.
	# - Values of cache are ones of:
	#   - promises of pending requests
	#   - responses of requests
	###
	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#objById
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# <p>Object, storage of collection items. Keys of object are item ids.<p>
	# <p>The id is the {@link ng-bundle-collection.Collection.config ng-bundle-collection.Collection.config}`.id_field` field of each item.</p>
	# <p>E.g.: <p>
	<pre>
		collection.add(item);
		(collection.objId[item[collection.config.id_field]] === item) === true;
	</pre>
	# *Note:* more handy and convenient way to take an item from `objById` storage is {@link ng-bundle-collection.Collection#by collection.by} method
	###
	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#arr
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# Array, storage of collection items.
	###
	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#loading
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# Number, flag which indicates the number of current pending requests through collection
	###
	_initPublicProperties: =>
		_.extend @,
			cache: {}
			objById: {}
			arr: []
			loading: 0

	###*
	# @ngdoc
	# @name Private_methods#_initExtendFns
	# @methodOf Private_methods
	# @description
	# Initialization of extending functions
	###
	###*
	# @ngdoc object
	# @name ng-bundle-collection.Collection#extendFns
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# Object, storage of functions which extend collection actions
	###
	_initExtendFns: =>
		_.extend @,
			extendFns:
				add:
					b: [] #before add item
					a: [] #after add item
				remove: [] #on remove item
				update: [] #on update item
				fetch:
					b: [] #before fetch
					s: [] #on successful fetch
					e: [] #on error fetch
					f: [] #on finish (either success or error)

	###*
	# @ngdoc
	# @name Private_methods#_initInterceptors
	# @methodOf Private_methods
	# @description
	# Initialization of interceptors
	###
	###*
	# @ngdoc object
	# @name ng-bundle-collection.Collection#interceptors
	# @propertyOf ng-bundle-collection.Collection
	# @description
	# <p>Object, storage of functions which can decorate response.</p>
	# <p>The interceptors are called as a chain in the order in which they were added.</p>
	# <p>Interceptors accept response as parameter and the ongoing response is replaced by the value returned from interceptor.</p>
	# <p>**Important**: so, the difference between {@link ng-bundle-collection.Collection collection}`.extendFns`
	# and {@link ng-bundle-collection.Collection collection}`.interceptors` is that interceptors can not only decorate the response
	# with some properties or implement some extending functionality, but they can replace the response with anything.</p>
	###
	_initInterceptors: =>
		_.extend @,
			interceptors:
				fetch: []

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#inc
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Increases the collection.loading flag by 1
	# @returns {number} Resulting collection.loading value
	# @example
	# collection.inc()
	###
	inc: => @loading++

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#dec
	# @methodOf ng-bundle-collection.Collection
	# @returns {number} Resulting collection.loading value
	# @description
	# Decreases the collection.loading flag by 1
	# @example
	# collection.dec()
	###
	dec: => @loading--

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#isLoading
	# @methodOf ng-bundle-collection.Collection
	# @returns {boolean} Whether the colletion is loading something or not
	# @example
	# collection.isLoading()
	###
	isLoading: => @loading

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#add
	# @methodOf ng-bundle-collection.Collection
	# @returns {object|array} Added item or array of items
	# @description
	# Adds an item to collection.
	# Overwrites existing item if the id-field of item exists in collection
	# @param {object|array} data
	# <p>Item to be added or array of items.</p>
	# <p>Item must contain an id-field named the same as the config parameter {@link ng-bundle-collection.Collection.config collection.config}`.id_field` (by default it equals `'id'`)</p>
	# @param {object} params
	# Params object of request which responded with this item or array of items.
	# @example
	<pre>
		collection.add({
			id: 0,
			name: 'User Name',
			email: 'email@email.com'
		})
	</pre>
	###
	add: (data, params) =>
		if _.isArray data
			@__addOne item, params for item in data
		else @__addOne arguments...
	
	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#add_withToCache
	# @methodOf ng-bundle-collection.Collection
	# @returns {object|array}
	# Added item or array of items
	# @description
	# Adds item to collection and extends cache record, specified by `Params` parameter
	# @param {object|array} data
	# <p>Item to be added or array of items.</p>
	# <p>Item must contain an id-field named the same as the config parameter `collection.config.id_field` (by default it equals `'id'`)</p>
	# @param {object} params
	# Params object that identifies which cache record should be the item added to
	# @example	
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
	###
	add_withToCache: (data, params) =>
		response = @add data
		paramsMark = @__calcParamsMark params
		data = [data] unless _.isArray data
		for item in data
			if @cache[paramsMark]? and item[@config.id_field] not in _.pluck @cache[paramsMark].results, @config.id_field
				@cache[paramsMark].results.push item
		response

	###*
	# @ngdoc
	# @name Private_methods#__addOne
	# @methodOf Private_methods
	# @returns {object}
	# Added item
	# @description
	# <p>Adds single item to collection.</p>
	# <p>To add an item, please use `collection.add` or `collection.add_withToCache`</p>
	# @param {object} item
	# Item to be added.
	# @param {object} params
	# Params object of request which responded with this item.
	###
	__addOne: (item, params) =>
		unless item[@config.id_field] in _.pluck @objById, @config.id_field
			fn item for fn in @extendFns.add.b
			if @config.model?
				item = @__wrapWithModel item
			@arr.push item
			@objById[item[@config.id_field]] = item
			fn item for fn in @extendFns.add.a



	###*
	# @ngdoc
	# @name Private_methods#__wrapWithModel
	# @methodOf Private_methods
	# @returns {object}
	# Wrapped item
	# @description
	# <p>Wraps an item with {@link ng-bundle-collection.Collection.config config}`.model`</p>
	# @param {object} item
	# Item to be wrapped.
	###
	__wrapWithModel: (item) =>
		new @config.model item,
			update: @update
			delete: @delete
			remove: @remove


	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#create
	# @methodOf ng-bundle-collection.Collection
	# @returns {promise}
	# Promise which resolves with created item or rejects with error response
	# @description
	# <p>Creates single item in collection and at backend using specified REST configuration..</p>
	# <p>Makes `POST` request to endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	# @param {object} item
	# Item data
	# @example
	<pre>
		var collection = new Collection(Restangular.all('users'));
		//This will make `POST` request to `users` endpoint.
		collection.create({
			name: 'User Name',
			email: 'email@email.com'
		});
	</pre>
	###
	create: (data) =>
		@inc()
		promise = @__rest(data).post(data).then (response) =>
			@add response
			response
		promise.finally => @dec()
		promise


	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#update
	# @methodOf ng-bundle-collection.Collection
	# @returns {promise} 
	# Promise which resolves with updated item or rejects with error response
	# @description
	# <p>Updates single item in collection and at backend using specified REST configuration.</p>
	# <p>Makes `PATCH` request to endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	# @param {object} item
	# Item data to be written to existing item
	# @example
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
	###
	update: (data) =>
		@inc()
		promise = @__rest(data).one(data[@config.id_field].toString()).patch(data).then (response) =>
			@update_locally response
			response
		promise.finally => @dec()
		promise

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#update_locally
	# @methodOf ng-bundle-collection.Collection
	# @returns {object} 
	# Updated item
	# @description
	# <p>Updates single item in collection locally (doesnt affect backend).</p>
	# @param {object} item
	# Item data to be written to existing item
	# @example
	<pre>
		collection.update_locally({
			__id: 1,
			name: 'User Name',
			email: 'email@email.com'
		})
	</pre>
	###
	update_locally: (item) =>
		@objById[item[@config.id_field]] = item
		for elem, index in @arr
			if elem[@config.id_field] is item[@config.id_field]
				@arr[index] = item
				break
		@__callExtendFns @extendFns.update, item
		item


	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#delete
	# @methodOf ng-bundle-collection.Collection
	# @returns {promise} 
	# Promise which resolves with deleted item or rejects with error response
	# @description
	# <p>Removes single item from collection and deletes it at backend using specified REST configuration.</p>
	# <p>Makes `DELETE` request to endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	# @param {object} item
	# Item data, must contain id-field
	# @example
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
	###
	delete: (item) =>
		@inc()
		promise = @__rest(item).one(item[@config.id_field].toString()).remove().then (response) =>
			@remove item
			response
		promise.finally => @dec()
		promise

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#remove
	# @methodOf ng-bundle-collection.Collection
	# @returns {object} 
	# Removed item
	# @description
	# <p>Removes single item from collection locally.</p>
	# @param {object} item
	# Item data, must contain id-field
	# @example
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
	###
	remove: (item) =>
		return unless item?
		delete @objById[item[@config.id_field]]
		_.remove @arr, (elem) => elem[@config.id_field] is item[@config.id_field]
		@__callExtendFns @extendFns.remove, item
		item

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#clear
	# @methodOf ng-bundle-collection.Collection
	# @this {object} {@link ng-bundle-collection.Collection collection} instance
	# @params {object} settings
	# Settings of clearing (object with boolean flags):
	# - withExtendFns=false - whether to remove all configured extending functions ({@link ng-bundle-collection.Collection collection}`.extendFns`)
	# - withInterceptors=false - whether to remove all {@link ng-bundle-collection.Collection collection}`.interceptors`
	# @returns {object}
	# this, {@link ng-bundle-collection.Collection collection} instance
	# @description
	# Clears collection by taking it back to initial empty state.
	# @example
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
	###
	clear: (settings) =>
		@_initExtendFns() if settings.withExtendFns
		@_initInterceptors() if settings.withInterceptors
		@remove item for item in angular.copy @arr
		@obj = {}
		@

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#extendUpdate
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.update`
	# @param {function} fn
	# Extending function
	# @example
	<pre>
		var updated_items = []
		//..... 
		collection.extendUpdate(function(item){
			item.is_updated = true;
			updated_items.push(item);
		});
	</pre>
	###
	extendUpdate: (fn) => @extendFns.update.push fn

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#extendRemove
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.remove`
	# @param {function} fn
	# Extending function
	# @example
	<pre>
		var removed_items = []
		//..... 
		collection.extendRemove(function(item){
			removed_items.push(item);
		});
	</pre>
	###
	extendRemove: (fn) => @extendFns.remove.push fn

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#extendAdd
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.add` structure
	# @param {object} fns
	# Object, keys can be:
	# - `'b'` - function will be executed before adding to collection (to `arr` and `objById`)
	# - `'a'` - function will be executed after adding to collection (to `arr` and `objById`)
	# Values are extending functions
	# @example
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
	###
	extendAdd: (fns) =>
		for k, v of fns
			@extendFns.add[k].push v

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#extendFetch
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Adds function to {@link ng-bundle-collection.Collection#extendFns ng-bundle-collection.Collection#extendFns}`.fetch` structure
	# @param {object} fns
	# Object, keys can be:
	# - `'b'` - function will be executed before fetching
	# - `'s'` - function will be executed after fetching, on success
	# - `'e'` - function will be executed after fetching, on error
	# - `'f'` - function will be executed after fetching, bot on success and error
	# Values are extending functions
	# @example
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
	###
	extendFetch: (fns) =>
		for k, v of fns
			@extendFns.fetch[k].push v

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#addInterceptor
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Adds function to {@link ng-bundle-collection.Collection#interceptors ng-bundle-collection.Collection#interceptors} structure
	# @param {object} fns
	# Object, keys can be:
	# - `'fetch'` - interceptors will be executed on fetching success
	# Values are interceptors
	# @example
	<pre>
		collection.addInterceptor({
			fetch: function(successResponse){
				...
				return modified_or_replaced_response;
			}
		});
	</pre>
	###
	addInterceptor: (fns) =>
		for k, v of fns
			try
				unless _.isArray @interceptors[k]
					throw "Wrong interceptor type: #{k}."
				else
					@interceptors[k].push v
			catch e
				console.error e

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#addFetchInterceptor
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Adds function to {@link ng-bundle-collection.Collection#interceptors ng-bundle-collection.Collection#interceptors}`.fetch` chain
	# @param {function} fn
	# Function which will be added to fetch interceptors chain.
	# @example
	<pre>
		collection.addFetchInterceptor(function(successResponse){
			...
			return modified_or_replaced_response;
		});
	</pre>
	###
	addFetchInterceptor: (fn) =>
		@addInterceptor
			fetch: fn

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#at
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Takes an item from {@link ng-bundle-collection.Collection collection}`.arr` by index
	# @returns {object}
	# Item from collection
	# @param {number} index
	# Index of item in {@link ng-bundle-collection.Collection collection}`.arr`
	# @example
	<pre>
		collection.create({...});
		//...
		var item = collection.at(0);
	</pre>
	###
	at: (index) => @arr[index]

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#by
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Takes an item from {@link ng-bundle-collection.Collection collection}`.objById` by its id
	# @returns {object}
	# Item from collection
	# @param {number|string} id
	# Id-field value of item
	# @example
	<pre>
		var users = new Collection(Restangular.all('users'));
		//...
		users.create({id:0, ...});
		//...
		var user = users.by(0);
	</pre>
	###
	by: (id) => @objById[id]

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#where
	# @methodOf ng-bundle-collection.Collection
	# @description
	# <p>Searches in collection for the items which have particular fields with particular values</p>
	# <p>Uses {@link https://lodash.com/ lodash} method `where`
	# @returns {array}
	# Array of items which contain all the fields with specified values
	# @param {object} obj
	# Object with fields which items should match to be found
	# @example
	<pre>
		collection.where({level: 25, first_name: 'Andrew'});
	</pre>
	###
	where: (obj) =>
		_.where @arr, obj

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#singleWhere
	# @methodOf ng-bundle-collection.Collection
	# @description
	# <p>Searches in collection for the single item which has particular fields with particular values</p>
	# <p>Uses {@link https://lodash.com/ lodash} method `findWhere`
	# @returns {object}
	# <p>Item which contains all the fields with specified values.</p>
	# <p>*Note:* If there is multiple items that match, the first occurence in {@link ng-bundle-collection.Collection collection}`.arr` will be returned</p>
	# @param {object} obj
	# Object with fields which the item should match to be found
	# @example
	<pre>
		collection.singleWhere({level: 25, first_name: 'Andrew'});
	</pre>
	###
	singleWhere: (obj) =>
		_.findWhere @arr, obj


	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#fetch
	# @methodOf ng-bundle-collection.Collection
	# @description
	# <p>Fetching data from backend.</p>
	# <p>Makes `GET` request to configured endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	# @returns {promise|object}
	# - Object of response if the result for given `params` is cached
	# <p>*or*</p>
	# - Promise which
	#   - resolves with object of response
	#   - rejects with object of error
	# <p>after Restangular request is finished</p>
	# @param {object} params
	# Request params object
	# @example
	<pre>
		collection.fetch({
			page: 1,
			page_size: 10,
			name: 'User'
		}).then(function(items){
			//...
		});
	</pre>
	###
	fetch: (params = {}) =>
		# preventing params mixing if the same params object is passed to different collections
		params = angular.copy params
		# extending params with default preconfigured params
		_.extend params, @config.params

		# getting id-field (can be undefined)
		id = params[@config.id_field]

		if @objById[id]?
			@$q.when @objById[id]
		else
			paramsStr = @__calcParamsMark params
			if @cache[paramsStr]?
				# request is pending with such params, e.g. __private_fetch is now working being called with such params
				# or
				# request with such params was successful, we already have necessary data
				@$q.when @cache[paramsStr]
			else
				# no request with such params was made, just fetching data
				@__private_fetch params

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#cancelAllRequests
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Cancels all current pending requests (all promises in {@link ng-bundle-collection.Collection collection}`.cache`)
	# @param {object} rejection
	# The response which has to be passed to error callback after rejection
	# @example
	<pre>
		collection.cancelAllRequests({
			error: 'Backend responded with 200 but the response contains error.'
		});
	</pre>
	###
	cancelAllRequests: (rejection={}) =>
		for key, cached of @cache when cached?
			if cached.__selfReject?
				cached.__selfReject rejection

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#cancelRequest
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Cancels the particular pending request (a corresponding promise in {@link ng-bundle-collection.Collection collection}`.cache`)
	# @param {object} params
	# Params object for which the request should be cancelled
	# @param {object} rejection
	# The response which has to be passed to error callback after rejection
	# @example
	<pre>
		collection.cancelRequest({
			page: 1,
			page_size: 10
		}, {
			error: 'Backend responded with 200 but the response contains error.'
		});
	</pre>
	###
	cancelRequest: (params, rejection={}) =>
		@getCached(params).__selfReject rejection

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#resolveRequest
	# @methodOf ng-bundle-collection.Collection
	# @description
	# Resolves the particular pending request (a corresponding promise in {@link ng-bundle-collection.Collection collection}`.cache`)
	# @param {object} params
	# Params object for which the request should be cancelled
	# @param {object} resolving
	# The response which has to be passed to success callback after resolving
	# @example
	<pre>
		collection.resolveRequest({
			page: 1,
			page_size: 10
		}, [...]);
	</pre>
	###
	resolveRequest: (params, resolving={}) =>
		@getCached(params).__selfResolve resolving

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#invalidate
	# @methodOf ng-bundle-collection.Collection
	# @description
	# <p>Clears {@link ng-bundle-collection.Collection collection}`.cache`</p>
	# <p>Deletes cached responses where the key corresponds to params object, which **contains** passed params</p>
	# @param {object|array} data
	# - The params object, which determines deleted cached responses
	# <p>*or*<p>
	# - The array of such params objects
	# @example
	# <p>This deletes all cache records, whose keys correspond to params object with </p>
	# <p>`'page_size' == 10` **AND** `'name' == 'asd'`</p>
	<pre>
		collection.invalidate({page_size:10, name: 'asd'});
	</pre>
	###
	invalidate: (data) =>
		if _.isArray data
			@__invalidateParams params for params in data
		else
			@__invalidateParams data or {}
		@

	###*
	# @ngdoc
	# @name Private_methods#__invalidateParams
	# @methodOf Private_methods
	# @description
	# <p>Deletes cached responses where the key corresponds to params object, which **contains** passed params</p>
	# <p>Is called by {@link ng-bundle-collection.Collection Collection}.invalidate for each params object</p>
	# @param {object} params
	# The params object, which determines deleted cached responses
	# @example
	# <p>This deletes all cache records, whose keys correspond to params object with </p>
	# <p>`'page_size' == 10` **AND** `'name' == 'asd'`</p>
	<pre>
		collection.invalidate({page_size:10, name: 'asd'});
	</pre>
	###
	__invalidateParams: (params) =>
		for key of @cache
			keyParams = JSON.parse key
			valid = yes
			clearedKeyParams = _.pick keyParams, (value, key) -> params[key]?
			if _.isEqual clearedKeyParams, params
				delete @cache[key]

	###*
	# @ngdoc
	# @name Private_methods#__callExtendFns
	# @methodOf Private_methods
	# @description
	# Invokes each extending function from array with passed params.
	# Extending functions array is taken from {@link ng-bundle-collection.Collection Collection}.extendFns
	# @param {array} fns_arr
	# Array of functions to be called
	# @params Other parameters
	###
	__callExtendFns: (fns_arr, p1, p2, p3, p4, p5) ->
		return unless fns_arr and _.isArray fns_arr
		index = 0
		while index < fns_arr.length
			fn = fns_arr[index]
			fn? p1, p2, p3, p4, p5
			index++ unless fn?.once

	###*
	# @ngdoc
	# @name Private_methods#__callInterceptors
	# @methodOf Private_methods
	# @returns {object|array}
	# Value which is returned from the last interceptor in chain
	# @description
	# Invokes each interceptor from array (chain) with passed params.
	# Extending functions array is taken from {@link ng-bundle-collection.Collection Collection}.extendFns
	# @param {array} fns_arr
	# Array of functions to be called
	# @param {object|array} response
	# Response from previous interceptor or otiginal response
	# @param {object} params
	# Params object with which was the request made
	###
	__callInterceptors: (fns_arr, response, params) ->
		for fn in fns_arr
			try
				unless (response = fn response, params)?
					throw "Interceptor returned wrong response: #{response}"
			catch e
				console.error e
		response


	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#__setMock
	# @methodOf ng-bundle-collection.Collection
	# @description
	# <p>Sets the response mock.</p>
	# <p>No requests to backend will be made if the mock is set.</p>
	# @param {object} mock
	# The mock which should be responded to any {@link ng-bundle-collection.Collection collection}`.fetch` request
	# @param {number} mockDelay
	# The number of milliseconds of timeout before responding with mock
	# @example
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
	###
	__setMock: (@mock, @mockDelay) =>

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection#__removeMock
	# @methodOf ng-bundle-collection.Collection
	# @description
	# <p>Removes current response mock.</p>
	# @example
	<pre>
		collection.__removeMock();
	</pre>
	###
	__removeMock: =>
		@mock = null
		@mockDelay = null

	###*
	# @ngdoc
	# @name Private_methods#__private_fetch
	# @methodOf Private_methods
	# @description
	# <p>Implements the fetching action.</p>
	# <p>For perform fetching via collection, please use {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}`.fetch` method</p>
	# @param {object} params
	# Params for fetch request
	###
	__private_fetch: (params) =>
		@inc()
		@__callExtendFns @extendFns.fetch.b, params
		rest = @__rest params
		paramsStr = @__calcParamsMark params
		deferred = @$q.defer()
		if @mock #if mock is set, then answer with mock instead of making request
			@$timeout =>
				@__success @mock, params
				deferred.resolve @mock
			, @mockDelay or @defaultMockDelay
		else
			paramsToSend = params
			if params[@config.id_field]?
				rest = rest.one params[@config.id_field].toString()
				paramsToSend = _.omit paramsToSend, @config.id_field
			rest.customGET('', paramsToSend).then (response) =>
				deferred.resolve @__success response, params
			, (response) =>
				if response.status is 304
					deferred.resolve @__success results: response.data, params
				else
					@__error response, params
					deferred.reject response
		deferred.promise.finally @dec
		_.extend deferred.promise,
			__selfResolve: do (deferred, params) =>
				(resolving) =>
					_.extend resolving, forcibly_resolved: yes
					deferred.resolve resolving
					@__success resolving, params
			__selfReject: do (deferred, params) =>
				(rejection) =>
					_.extend rejection, forcibly_cancelled: yes
					deferred.reject rejection
					@__error rejection, params
		@cache[paramsStr] = deferred.promise

	###*
	# @ngdoc
	# @name Private_methods#__success
	# @methodOf Private_methods
	# @description
	# <p>Success callback for fetching action.</p>
	# - Adds results to collection
	# - Calls extending success ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.s`) functions
	# - Calls extending final ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.f`) functions
	# @param {object} response
	# Success response from backend
	# @param {object} params
	# Params object, with which was the request done.
	###
	__success: (response, params) =>
		response = @__callInterceptors @interceptors.fetch, response, params

		# The cache for this params should be Promise.
		# If it doesnt exist, it means that one of interceptors rejected that promise and it was deleted from cache,
		# we have to cancel success callback
		return unless @getCached params

		unless @config.dontCollect
			if response?.results?
				@add response.results
			else
				@add response
		response_formatted = @__determineResponse response, params
		@__callExtendFns @extendFns.fetch.s, response_formatted, params
		@__callExtendFns @extendFns.fetch.f, response_formatted, params
		response_formatted

	###*
	# @ngdoc
	# @name Private_methods#__error
	# @methodOf Private_methods
	# @description
	# <p>Error callback for fetching action.</p>
	# - Calls extending error ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.e`) functions
	# - Calls extending final ({@link ng-bundle-collection.Collection collection}`.extendFns.fetch.f`) functions
	# @param {object} response
	# Error response from backend
	# @param {object} params
	# Params object, with which was the request done.
	###
	__error: (response, params) =>
		@__callExtendFns @extendFns.fetch.e, response, params
		@__callExtendFns @extendFns.fetch.f, response, params

	###*
	# @ngdoc
	# @name Private_methods#__calcParamsMark
	# @methodOf Private_methods
	# @returns {string}
	# The string mark of params
	# @description
	# <p>Calculates string mark for parameters object</p>
	# <p>Params mark is used for:</p>
	# - marking responses for requests and determining if the response is already cached
	# - marking promises and determining if the request is already pending
	# @param {object} params
	# Params object
	###
	__calcParamsMark: (params) -> JSON.stringify params

	###*
	# @ngdoc
	# @name Private_methods#__determineResponse
	# @methodOf Private_methods
	# @returns {object}
	# Formatted response
	# @description
	# <p>Formats the response to fetch action from backend.</p>
	# <p>The format of resulting response is:</p>
	# - if the response is expected to be an `Array`, then the response is
	<pre>
		{
			results: [
				//array of items of array
			],
		}
	</pre>
	# - if the response is expected to be an `Object`, then response is just the same as backend sent
	# <p>Adds `__payload` with `params` if the {@link ng-bundle-collection.Collection collection}`.config.respondWithPayload` is `true`</p>
	# <p>Each item comes decorated with {@link ng-bundle-collection.Collection collection}`.config.model`</p>
	# @param {object} response
	# Success response from backend
	# @param {object} params
	# Params object, with which was the request done.
	###
	__determineResponse: (response, params) =>
		response = if @config.dontCollect
			if @config.model? and _.isArray response
				for item in response
					@__wrapWithModel item
			else
				response
		else
			if _.isArray response
				results: @objById[item[@config.id_field]] for item in response
			else
				if response?.results?
					if params[@config.id_field] and not params._single
						if response.results[0]? then @objById[response.results[0][@config.id_field]] else null
					else
						results = []
						results.push @objById[item[@config.id_field]] for item in response.results
						_.extend response, results: results
				else
					@objById[response[@config.id_field]] or response

		response.__payload = params if @config.respondWithPayload

		response

	###*
	# @ngdoc
	# @name Private_methods#__initCacheClearing
	# @methodOf Private_methods
	# @description
	# <p>Adds extending function for fetch success ({@link ng-bundle-collection.Colleciton collection}`.extendFns.fetch.s`), which clears promises from cache</p>
	# <p>Invoked if the cache is disabled by {@link ng-bundle-collection.Colleciton.config config}`.withCaching === false`
	###
	__initCacheClearing: =>
		@extendFetch
			s: (response, params) => delete @cache[@__calcParamsMark params]

	###*
	# @ngdoc
	# @name Private_methods#__initCaching
	# @methodOf Private_methods
	# @description
	# <p>Enable caching by adding extending functions for fetch success ({@link ng-bundle-collection.Colleciton collection}`.extendFns.fetch.s`)
	# and for fetch error ({@link ng-bundle-collection.Colleciton collection}`.extendFns.fetch.e`)</p>
	# <p>Invoked if the cache is ensabled by {@link ng-bundle-collection.Colleciton.config config}`.withCaching === true`
	###
	__initCaching: =>
		@extendFetch
			# b: (params) => @cache[@__calcParamsMark params] = no
			s: (response, params, method) => @cache[@__calcParamsMark params] = angular.copy response #@__determineResponse response, params, method
			e: (response, params) => delete @cache[@__calcParamsMark params]
		# setInterval @invalidate, @rest.__invalidate_interval

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection.isCached
	# @methodOf ng-bundle-collection.Collection
	# @returns {boolean} Is cached or not
	# @description
	# Determines whether the response for request with particular params object is cached
	# @example
	<pre>
		var isFirstPageCached = collection.isCached({page: 1, page_size: 10});
	</pre>
	###
	isCached: (params) => @getCached(params)?

	###*
	# @ngdoc
	# @name ng-bundle-collection.Collection.getCached
	# @methodOf ng-bundle-collection.Collection
	# @returns {object} cached response or undefined
	# @description
	# Extracts the response for request with particular params object
	# @example
	<pre>
		var cachedResponseForFirstPage = collection.getCached({page: 1, page_size: 10});
	</pre>
	###
	getCached: (params) => @cache[@__calcParamsMark params]

	###*
	# @ngdoc
	# @name Private_methods#__rest
	# @methodOf Private_methods
	# @returns {object} Restangular instance
	# @description
	# Extracts the Restangular instance which is configured to perform REST actions
	###
	__rest: (params) =>
		if _.isFunction @rest then @rest params else @rest


	###*
	# @ngdoc object
	# @name Static_methods
	# @description
	# Static properties of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection}
	###
	###*
	# @ngdoc
	# @name Static_methods#instances
	# @propertyOf Static_methods
	# @description
	# Array of all {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} instances
	###
	@instances: []

	###*
	# @ngdoc
	# @name Static_methods#invalidate
	# @methodOf Static_methods
	# @description
	# Invalidates all instances (clears `cache`) of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} by calling `invalidate` methods
	###
	@invalidate: -> i.invalidate() for i in @instances

	###*
	# @ngdoc
	# @name Static_methods#cancelAllRequests
	# @methodOf Static_methods
	# @description
	# Cancels all pending requests in all instances of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} by calling `cancelAllRequests` methods
	###
	@cancelAllRequests: -> i.cancelAllRequests() for i in @instances

	###*
	# @ngdoc
	# @name Static_methods#clear
	# @methodOf Static_methods
	# @description
	# Clears all instances (clears `arr` and `objById`) of {@link ng-bundle-collection.Collection ng-bundle-collection.Collection} by calling `clear` methods
	# @param {object} settings
	# Settings of clearing (object with boolean flags):
	# - withExtendFns=false - whether to remove all configured extending functions ({@link ng-bundle-collection.Collection collection}`.extendFns`)
	# - withInterceptors=false - whether to remove all {@link ng-bundle-collection.Collection collection}`.interceptors`
	###
	@clear: (settings) -> i.clear settings for i in @instances