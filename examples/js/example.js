var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

(function() {
  var Todo, module;
  Todo = (function(superClass) {
    extend(Todo, superClass);

    function Todo() {
      Todo.__super__.constructor.apply(this, arguments);
    }

    Todo.prototype.msInDay = 1000 * 60 * 60 * 24;

    Todo.prototype.daysToDeadline = function() {
      var deadline, now;
      now = (new Date).valueOf();
      deadline = (new Date(this.deadline)).valueOf();
      return Math.round((deadline - now) / this.msInDay);
    };

    return Todo;

  })(ItemModel);
  module = angular.module('ng-bundle-collection-example', ['ng-bundle-collection', 'restangular']);
  module.service('todos', function(Collection, Restangular) {
    _.extend(this, new Collection(Restangular.all('todos'), {
      model: Todo
    }));
    this.__setMock([
      {
        id: 1,
        text: 'Todo 1',
        deadline: new Date(2015, 5, 1)
      }, {
        id: 2,
        text: 'Todo 2',
        deadline: new Date(2015, 12, 12)
      }
    ], 1000);
    return this;
  });
  module.directive('todo', function() {
    return {
      replace: true,
      restrict: 'A',
      templateUrl: '/todo.html',
      controller: 'TodoCtrl',
      scope: {
        todo: '='
      }
    };
  });
  module.controller('TodosCtrl', function($scope, todos) {
    var self;
    window.scope = $scope;
    self = this;
    todos.fetch().then(function() {
      return self.n = todos.arr.length;
    });
    return _.extend($scope, {
      todos: todos,
      addTodo: function() {
        var date;
        self.n++;
        date = new Date;
        date.setDate(date.getDate() + 1);
        return todos.add({
          id: self.n,
          text: "Todo " + self.n,
          deadline: date
        });
      },
      removeTodo: function(id) {
        return todos.remove({
          id: id
        });
      }
    });
  });
  return module.controller('TodoCtrl', function($scope) {
    return $scope.updateTodo = function() {
      var date;
      date = new Date($scope.todo.deadline);
      date.setDate(date.getDate() + 1);
      return $scope.todo.update_locally({
        id: $scope.todo.id,
        text: "Updated Todo " + $scope.todo.id,
        deadline: date
      });
    };
  });
})();
