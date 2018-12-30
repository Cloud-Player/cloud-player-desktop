const electron = require('electron');
const Window = require('../window');
const windowManager = require('../window_manager');

var ConnectWindow = Window.extend({
  showDevTools: false,
  id: 'connect',
  options: {
    minWidth: 400,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false
    }
  },
  connectionSuccessFul: function () {
    windowManager.getWindowById('portal').window.webContents.executeJavaScript('' +
      'window.dispatchEvent(new CustomEvent("connectionSuccessFul"))'
    );
    setTimeout(this.close.bind(this), 50);
  },
  initialize: function () {
    this.window.webContents.on('did-navigate', function (event, location) {
      var res = location.match(/.*api.aux.app.*\/close.*/);
      if (res) {
        this.connectionSuccessFul();
      }
    }.bind(this));
  }
});

module.exports = ConnectWindow;
