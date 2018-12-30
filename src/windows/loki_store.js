var app = require('electron').app || require('electron').remote.app;
var LokiBackbone = require('../lib/lokijs.backbone');

if(require('electron').app){
  LokiBackbone.LokiStore.initialize(require('electron').app.getPath('userData')+'/aux-app-native.db');
} else {
  LokiBackbone.LokiStore.initialize(require('electron').remote.app.getPath('userData')+'/aux-app-web.db');
}

module.exports = LokiBackbone;
