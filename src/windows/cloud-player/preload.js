const app = require('electron').remote.app;

process.once('loaded', function () {
  window.addEventListener('load', function () {
    var startNativeClientEvent = new CustomEvent('startNativeClient', {
      detail: {
        platform: process.platform,
        version: app.getVersion()
      }
    });
    window.dispatchEvent(startNativeClientEvent);
  })
});