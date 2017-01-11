const LokiBackbone = require('../loki_store');

var WindowPropertiesModel = LokiBackbone.LokiModel.extend({
  dbName: 'windowsProperties',
  constraints: ['name'],
  defaults: function () {
    return {
      size: {
        width: null,
        height: null
      },
      position: {
        x: null,
        y: null
      }
    }
  }
});

module.exports = WindowPropertiesModel;

