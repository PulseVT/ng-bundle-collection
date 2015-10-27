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
	constructor: (item, @methods) ->
		_.extend @, item

	###*
	# @ngdoc
	# @name ItemModel#remove
	# @methodOf ItemModel
	# @returns {object}
	# Removed item
	# @description
	# <p>Removes the item from collection locally.</p>
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
			user.remove();
		});
	</pre>
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
			user.delete();
		});
	</pre>
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
			user.update({
				name: 'User Name',
				email: 'email@email.com'
			});

		});
	</pre>
	###
	update: (data) =>
		@update_locally data
		@save()

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
			//user will have new name and email
			user.update_locally({
				name: 'User Name',
				email: 'email@email.com'
			});

		});
	</pre>
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
	###
	save: =>
		@methods.update @