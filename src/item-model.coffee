###*
# @ngdoc object
# @name ItemModel
# @description
# <p>Class that represents default model for each collection item</p>
# <p>Can be extended by custom item model</p>
# @param {object} item
# Object that represents item data
# @param {object} methods
# Collection-level methods from the instance to which the item belongs
# @example
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
###
class ItemModel
	constructor: (item) ->
		_.extend @, item

	###*
	# @ngdoc
	# @name ItemModel#create
	# @methodOf ItemModel
	# @returns {object}
	# Removed item
	# @description
	# <p>Removes the item from collection locally.</p>
	# @param {object} item
	# Item data, must contain id-field
	###
	create: =>
		@methods.create arguments...

	###*
	# @ngdoc
	# @name ItemModel#remove
	# @methodOf ItemModel
	# @returns {object}
	# Removed item
	# @description
	# <p>Removes the item from collection locally.</p>
	# @param {object} item
	# Item data, must contain id-fiel
	###
	remove: =>
		@methods.remove @

	###*
	# @ngdoc
	# @name ItemModel#delete
	# @methodOf ItemModel
	# @returns {promise}
	# Promise which resolves with deleted item or rejects with error response
	# @description
	# <p>Removes item from collection and deletes it at backend using specified REST configuration.</p>
	# <p>Makes `DELETE` request to endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	###
	delete: =>
		@methods.delete @

	###*
	# @ngdoc
	# @name ItemModel#update
	# @methodOf ItemModel
	# @returns {promise} 
	# Promise which resolves with updated item or rejects with error response
	# @description
	# <p>Updates item in collection and at backend using specified REST configuration.</p>
	# <p>Makes `PATCH` request to endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	# @param {object} data
	# Object with fields that should be updated or added
	###
	update: (data) =>
		@update_locally data
		data[@config.id_field] = @[@config.id_field]
		@save data

	###*
	# @ngdoc
	# @name ItemModel#update_locally
	# @methodOf ItemModel
	# @returns {object} 
	# Updated item
	# @description
	# <p>Updates item in collection locally (doesnt affect backend).</p>
	# @param {object} item
	# Item data to be written to item
	###
	update_locally: (data) =>
		_.extend @, data

	###*
	# @ngdoc
	# @name ItemModel#save
	# @methodOf ItemModel
	# @returns {promise} 
	# Promise which resolves with updated item or rejects with error response
	# @description
	# <p>Saves the current item state at backend using specified REST configuration.</p>
	# <p>Makes `PATCH` request to endpoint.</p>
	# <p>Affects `collection.loading` flag</p>
	###
	save: (data) =>
		if data?
			@methods.update data
		else
			@methods.update @