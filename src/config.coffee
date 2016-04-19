do ->

	module = angular.module 'ng-bundle-collection'

	module.config [
		'RestangularProvider'
		(RestangularProvider) ->
			RestangularProvider.setResponseExtractor (response) ->
				if _.isArray response
					for item in response
						item.unrestangularized = angular.copy item
				else
					response.unrestangularized = angular.copy response
				response

	]
	