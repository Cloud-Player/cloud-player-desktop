const electron = require('electron');
const Window = require('../window');
const ConnectWindow = require('../connect/connect');
const WindowsProperties = require("../collections/windows_properties_collection");
const WindowProperties = require("../models/window_properties_model");
const _ = require('underscore');
const session = require('electron').session;

var PortalWindow = Window.extend({
  showDevTools: false,
  url: 'https://cloud-player.io',
  id: 'portal',
  windowEventBeforeOpen: 'clientReady',
  hideWindowOnClose: true,
  options: {
    minWidth: 770,
    minHeight: 200,
    show: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#efefef',
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
      preload: __dirname + '/preload.js'
    }
  },
  showScConnectWindow: function (url) {
    this._connectionWindow = new ConnectWindow({url: url});
    this._connectionWindow.open();
  },
  initialize: function () {
    var windowsProperties = new WindowsProperties(),
      size = electron.screen.getPrimaryDisplay().workAreaSize,
      windowProperties;

    this.window.setContentSize(size.width, size.height);

    windowsProperties.find({name: 'portal'}).then(function (collection) {
      if (collection.length === 0) {
        windowProperties = new WindowProperties({name: 'portal'});
      } else {
        windowProperties = collection.first();
        var size = windowProperties.get('size'),
          position = windowProperties.get('position');

        this.window.setContentSize(size.width, size.height);
        this.window.setPosition(position.x, position.y);
      }
    }.bind(this));

    this.on('close', function () {
      if (windowProperties) {
        windowProperties.set('size', {
          width: this.window.getContentSize()[0],
          height: this.window.getContentSize()[1]
        });
        windowProperties.set('position', {
          x: this.window.getPosition()[0],
          y: this.window.getPosition()[1]
        });
        windowProperties.save();
      }
    }.bind(this));

    this.window.webContents.on('new-window', function (event, location) {
      if (location.match(/.*soundcloud.com\/connect.*/)) {
        this.showScConnectWindow(location);
        event.preventDefault();
        return;
      }

      // When user clicks on item in youtube player prevent opening an ew tab and play video instaed
      var youtubeRegex = /.*youtube.com\/watch.*v=([^&]*)&?/;
      var match = location.match(youtubeRegex);
      if (match && match.length > 0) {
        this.window.webContents.executeJavaScript(
          'window.dispatchEvent(new CustomEvent("addAndPlayItem", {detail:{provider:"YOUTUBE",track: {id: "' + match[1] + '"}}}))'
        );
        event.preventDefault();
      }

    }.bind(this));

    // const filter = {
    //   urls: ['https://*.doubleclick.net/*']
    // };
    //
    // // Prevent loading of external resources
    // session.defaultSession.webRequest.onBeforeSendHeaders(filter, function (details, callback) {
    //   callback({cancel: true})
    // });

    var debouncedPlayPause = _.debounce(function () {
      this.window.webContents.executeJavaScript('window.dispatchEvent(new Event("playPauseTrackKeyPressed"))');
    }.bind(this), 10);

    this.on('MediaPlayPause', debouncedPlayPause, this);

    this.on('MediaNextTrack', function () {
      this.window.webContents.executeJavaScript('window.dispatchEvent(new Event("nextTrackKeyPressed"))');
    }, this);

    this.on('MediaPreviousTrack', function () {
      this.window.webContents.executeJavaScript('window.dispatchEvent(new Event("previousTrackKeyPressed"))');
    }, this);
  }
});

module.exports = PortalWindow;