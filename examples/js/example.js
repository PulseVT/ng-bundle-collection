(function() {
  var module;
  module = angular.module('ng-bundle-collection-example', ['ng-bundle-collection', 'restangular']);
  module.service('todos', function(ngBundleCollection, Restangular) {
    _.extend(this, new ngBundleCollection(Restangular.all('todos')));
    this.__setMock([
      {
        id: 1,
        text: 'Todo 1'
      }, {
        id: 2,
        text: 'Todo 2'
      }
    ], 1000);
    return this;
  });
  return module.controller('TodosCtrl', function($scope, todos) {
    var self;
    window.scope = $scope;
    self = this;
    todos.fetch().then(function() {
      return self.n = todos.arr.length;
    });
    return _.extend($scope, {
      todos: todos,
      addTodo: function() {
        self.n++;
        return todos.add({
          id: self.n,
          text: "Todo " + self.n
        });
      },
      removeTodo: function(id) {
        return todos.remove({
          id: id
        });
      }
    });
  });
})();
