const app = require('electron').remote.app;
const {ipcRenderer} = require('electron');

process.once('loaded', function () {
  window.addEventListener('load', function () {
    var startNativeClientEvent = new CustomEvent('startNativeClient', {
      detail: {
        platform: process.platform,
        version: app.getVersion()
      }
    });
    window.dispatchEvent(startNativeClientEvent);
  });

  ipcRenderer.on('prepare-close', () => {
    if (!window.prepareClose) {
      ipcRenderer.send('can-close');
    } else {
      window.prepareClose().then(() => {
        ipcRenderer.send('can-close');
      });
    }
  });
});
