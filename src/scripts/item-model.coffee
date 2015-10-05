class ItemModel
	constructor: (item, @collection) ->
		_.extend @, item

	remove: =>
		@collection.remove @

	delete: =>
		@collection.delete @