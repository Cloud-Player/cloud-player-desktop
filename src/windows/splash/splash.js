const Window = require('../window');

var SplashWindow = Window.extend({
  minDisplayTime: 0,
  showDevTools: false,
  url: 'file://' + __dirname + '/web/window.html',
  id: 'splash',
  options: {
    width: 500,
    height: 350,
    resizable: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    titleBarStyle: 'default',
    webPreferences: {
      webSecurity: false
    }
  }
});

module.exports = SplashWindow;