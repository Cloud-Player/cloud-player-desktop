const LokiBackbone = require('../loki_store'),
  WindowPropertiesModel = require('../models/window_properties_model');

var WindowsPropertiesCollection = LokiBackbone.LokiCollection.extend({
  dbName: 'windowsProperties',
  constraints: ['name'],
  model: WindowPropertiesModel
});

module.exports = WindowsPropertiesCollection;

