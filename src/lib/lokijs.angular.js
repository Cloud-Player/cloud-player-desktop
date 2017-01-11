angular.module('lokiAngular', [])

  .run(function ($rootScope, $q) {
    LokiBackbone.Q = $q;

    var lokiBackboneModelConstructor = LokiBackbone.Model.prototype.constructor,
      lokiBackboneCollectionConstructor = LokiBackbone.Collection.prototype.constructor;

    LokiBackbone.Model.prototype.constructor = function () {
      this.on('change', function () {
        if (!$rootScope.$$phase) {
          $rootScope.$digest();
        }
      });
      return lokiBackboneModelConstructor.apply(this, arguments);
    };

    LokiBackbone.Collection.prototype.constructor = function () {
      this.on('add remove reset', function () {
        if (!$rootScope.$$phase) {
          $rootScope.$digest();
        }
      });
      return lokiBackboneCollectionConstructor.apply(this, arguments);
    };
  });