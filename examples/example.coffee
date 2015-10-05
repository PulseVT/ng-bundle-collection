do ->

	module = angular.module 'ng-bundle-collection-example', ['ng-bundle-collection', 'restangular']

	module.service 'todos', (ngBundleCollection, Restangular) ->
		_.extend @, new ngBundleCollection Restangular.all 'todos'
		@__setMock [
			id: 1
			text: 'Todo 1'
		,
			id: 2
			text: 'Todo 2'
		], 1000
		@
		

	module.controller 'TodosCtrl', ($scope, todos) ->
		window.scope = $scope
		self = @
		todos.fetch().then -> self.n = todos.arr.length

		_.extend $scope,
			todos: todos

			addTodo: ->
				self.n++
				todos.add
					id: self.n
					text: "Todo #{self.n}"

			removeTodo: (id) ->
				todos.remove id: id