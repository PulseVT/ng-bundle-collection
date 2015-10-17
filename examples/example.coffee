do ->

	class Todo extends ItemModel
		constructor: ->
			super


		msInDay: 1000 * 60 * 60 * 24

		daysToDeadline: ->
			now = (new Date).valueOf()
			deadline = (new Date @deadline).valueOf()
			Math.round (deadline - now) / @msInDay


	module = angular.module 'ng-bundle-collection-example', ['ng-bundle-collection', 'restangular']

	module.service 'todos', (Collection, Restangular) ->
		_.extend @, new Collection Restangular.all('todos'),
			model: Todo
		@__setMock [
			id: 1
			text: 'Todo 1'
			deadline: new Date 2015, 5, 1
		,
			id: 2
			text: 'Todo 2'
			deadline: new Date 2015, 12, 12
		], 1000
		@

	module.directive 'todo', ->
		replace: yes
		restrict: 'A'
		templateUrl: '/todo.html'
		controller: 'TodoCtrl'
		scope:
			todo: '='

	module.controller 'TodosCtrl', ($scope, todos) ->
		window.scope = $scope
		self = @
		todos.fetch().then -> self.n = todos.arr.length

		_.extend $scope,
			todos: todos

			addTodo: ->
				self.n++
				date = new Date
				date.setDate date.getDate() + 1
				todos.add
					id: self.n
					text: "Todo #{self.n}"
					deadline: date

			removeTodo: (id) ->
				todos.remove id: id

	module.controller 'TodoCtrl', ($scope) ->
		$scope.updateTodo = ->
			date = new Date $scope.todo.deadline
			date.setDate date.getDate() + 1
			$scope.todo.update_locally
				id: $scope.todo.id
				text: "Updated Todo #{$scope.todo.id}"
				deadline: date