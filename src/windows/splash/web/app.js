const electron = require('electron');
const LokiBackbone = require('../../loki_store');
const lokiAngular = require('../../../lib/lokijs.angular');
const ipc = require('electron').ipcRenderer;
const app = require('electron').remote.app;

angular.module('Splash', ['lokiAngular'])

  .controller('MainCtrl', function ($scope, $timeout) {

    $scope.viewModel = {
      appName: app.getName(),
      appVersion: app.getVersion(),
      statusMsg: 'Initializing'
    };

    var showPortal = function(){
      $scope.viewModel.statusMsg = 'Bootstrapping application';
      ipc.send('show-portal');
    };

    showPortal();
  });
