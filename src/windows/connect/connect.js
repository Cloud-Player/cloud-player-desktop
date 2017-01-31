const electron = require('electron');
const Window = require('../window');
const windowManager = require('../window_manager');

var ConnectWindow = Window.extend({
  showDevTools: false,
  id: 'portal',
  options: {
    minWidth: 400,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false
    }
  },
  connectionSuccessFul: function(creds){
    var eventDetail = {
      detail: creds
    };
    windowManager.getWindowById('portal').window.webContents.executeJavaScript('' +
      'window.dispatchEvent(new CustomEvent("connectionSuccessFul",'+JSON.stringify(eventDetail)+'))'
    );
    setTimeout(this.close.bind(this),50);
  },
  initialize: function(){
    this.window.webContents.on('did-navigate', function (event, location) {
      var res = location.match(/.*access_token=([\w-]*).*expires_on=(\d*).*refresh_token=(\w*)/);
      if (res && res.length === 4) {
        this.connectionSuccessFul.call(this, {
          access_token: res[1],
          expires_on: res[2],
          refresh_token: res[3]
        });
      }
    }.bind(this));
  }
});

module.exports = ConnectWindow;