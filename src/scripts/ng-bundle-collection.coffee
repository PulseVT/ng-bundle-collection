do ->
	module = angular.module 'ng-bundle-collection', []

	module.factory 'ngBundleCollection', ($q) ->
		(rest, config) ->
			new Collection $q, rest, config

class Collection
	constructor: (@$q, @rest, @config = {}) ->
		Collection.instances.push @

		@config.withCaching = yes unless @config.withCaching?
		@config.itemsWithActions = yes unless @config.itemsWithActions?
		@config.id_field = 'id' unless @config.id_field?
		@config.affectSpinner = yes unless @config.affectSpinner?
		@config.respondWithPayload = yes unless @config.respondWithPayload?

		@cache = {}
		@objById = {}
		@arr = []
		@loading = 0
		
		@_initExtendFns()
		if @config.withCaching then @__initCaching() else @__initImmediateCaching()
		if @config.itemsWithActions then @__initItemsCommonActions()

	inc: => @loading++
	dec: => @loading--

	_initExtendFns: =>
		@extendFns =
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

	add_withToCache: (data, params) =>
		@add data
		paramsMark = @__calcParamsMark params
		if @cache[paramsMark]? and data[@config.id_field] not in _.pluck @cache[paramsMark].results, @config.id_field
			@cache[paramsMark].results.push data

	add: (data, params) =>
		if _.isArray data
			@__addOne item, params for item in data
		else @__addOne arguments...

	__addOne: (item, params) ->
		unless item[@config.id_field] in _.pluck @objById, @config.id_field
			fn item for fn in @extendFns.add.b
			if @config.model?
				item = new @config.model item
			@arr.push item
			@objById[item[@config.id_field]] = item
			fn item for fn in @extendFns.add.a

	create: (data, scb, ecb) =>
		@inc()
		promise = @__rest(data).post(data).then (response) =>
			@add response
			scb? response
			response
		, (response) ->
			ecb? response
		promise.finally => @dec()
		promise

	update: (data, scb, ecb) =>
		@inc()
		promise = @__rest(data).one(data[@config.id_field].toString()).patch(data).then (response) =>
			@update_locally response
			scb? response
			response
		, (error) ->
			ecb? error
		promise.finally => @dec()
		promise

	update_locally: (item) =>
		@objById[item[@config.id_field]] = item
		for elem, index in @arr
			if elem[@config.id_field] is item[@config.id_field]
				@arr[index] = item
				break
		@__callExtendFns @extendFns.update, item

	delete: (item, scb, ecb) =>
		@inc()
		promise = @__rest(item).one(item[@config.id_field].toString()).remove().then (response) =>
			@remove item
			scb? response
			response
		, (response) ->
			ecb? response
		promise.finally => @dec()
		promise

	remove: (item) =>
		return unless item?
		delete @objById[item[@config.id_field]]
		_.remove @arr, (elem) => elem[@config.id_field] is item[@config.id_field]
		@__callExtendFns @extendFns.remove, item

	clear: (withExtendFns) =>
		@_initExtendFns() if withExtendFns
		@remove item for item in angular.copy @arr
		@obj = {}

	extendUpdate: (fn) => @extendFns.update.push fn

	extendRemove: (fn) => @extendFns.remove.push fn

	extendAdd: (fns) =>
		for k, v of fns
			@extendFns.add[k].push v

	extendFetch: (fns, once) =>
		for k, v of fns
			if once
				fn = ((extendFns, k, v) ->
					->
						v arguments...
						extendFns.fetch[k].delete v
				) @extendFns, k, v
				fn.once = yes
				@extendFns.fetch[k].push fn
			else
				@extendFns.fetch[k].push v
			# @extendFns.fetch[k].push v

	at: (index) -> @arr[index]

	by: (id) -> @objById[id]

	fetch: (params = {}) =>
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

	cancelAllRequests: =>
		for key, cached of @cache when cached?
			if cached.__selfReject?
				cached.__selfReject cancelled: yes
				delete @cache[key]

	invalidate: (data) =>
		if _.isArray data
			@__invalidateParams params for params in data
		else
			@__invalidateParams data or {}
		@

	__invalidateParams: (params) =>
		for key of @cache
			keyParams = JSON.parse key
			valid = yes
			clearedKeyParams = _.pick keyParams, (value, key) -> params[key]?
			if _.isEqual clearedKeyParams, params
				delete @cache[key]

	__callExtendFns: (fns_arr, p1, p2, p3, p4, p5) ->
		return unless fns_arr and _.isArray fns_arr
		index = 0
		while index < fns_arr.length
			fn = fns_arr[index]
			fn? p1, p2, p3, p4, p5
			index++ unless fn?.once

	__setMock: (@mock, @mockDelay) =>

	__removeMock: => @mock = null

	__private_fetch: (params) =>
		@inc()
		@__callExtendFns @extendFns.fetch.b, params
		rest = @__rest params
		paramsStr = @__calcParamsMark params
		deferred = @$q.defer()
		if @mock #if mock is set, then answer with mock instead of making request
			setTimeout =>
				@__success @mock, params
				deferred.resolve @mock
			, @mockDelay or 500
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
			__selfResolve: deferred.resolve
			__selfReject: deferred.reject
		@cache[paramsStr] = deferred.promise

	__success: (response, params) =>
		unless @config.dontCollect
			if response?.results?
				@add response.results
			else
				@add response
		response_formatted = @__determineResponse response, params
		@__callExtendFns @extendFns.fetch.s, response_formatted, params
		@__callExtendFns @extendFns.fetch.f, response_formatted, params
		response_formatted

	__error: (response, params) =>
		@__callExtendFns @extendFns.fetch.e, response, params
		@__callExtendFns @extendFns.fetch.f, response, params

	__calcParamsMark: (params) -> JSON.stringify params

	__determineResponse: (response, params) =>
		response = if @config.dontCollect
			if @config.model? and _.isArray response
				for item in response
					new @config.model item
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
					@objById[response[@config.id_field]]

		response.__payload = params if @config.respondWithPayload

		response

	__initImmediateCaching: =>
		@extendFetch
			# b: (params) => @cache[@__calcParamsMark params] = no
			s: (response, params) => delete @cache[@__calcParamsMark params]

	__initCaching: =>
		@extendFetch
			# b: (params) => @cache[@__calcParamsMark params] = no
			s: (response, params, method) => @cache[@__calcParamsMark params] = angular.copy response #@__determineResponse response, params, method
			e: (response, params) => delete @cache[@__calcParamsMark params]
		# setInterval @invalidate, @rest.__invalidate_interval

	__initItemsCommonActions: =>
		@extendAdd
			b: (item) =>
				_.extend item,
					update: => @update item
					delete: => @delete item

	isCached: (params) => @getCached(params)?

	getCached: (params) => @cache[@__calcParamsMark params]

	__rest: (params) =>
		if _.isFunction @rest then @rest params else @rest

	###
	# Static properties
	###

	@instances: []

	@invalidate: -> i.invalidate() for i in @instances

	@cancelAllRequests: -> i.cancelAllRequests() for i in @instances

	@clear: (withExtendFns) -> i.clear withExtendFns for i in @instances