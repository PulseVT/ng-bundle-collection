do ->

	module = angular.module 'ng-bundle-collection-example', ['ng-bundle-collection', 'restangular']

	module.service 'todos', (ngBundleCollection, Restangular) ->
		#
		new ngBundleCollection Restangular.all 'todos'

	module.service 'users', (ngBundleCollection) ->
		new ngBundleCollection 'users'

	module.controller 'TodosCtrl', (todos) ->
		todos.fetch()