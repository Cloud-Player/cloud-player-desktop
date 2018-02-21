const electron = require('electron');
const Window = require('../window');
const ConnectWindow = require('../connect/connect');
const WindowsProperties = require("../collections/windows_properties_collection");
const WindowProperties = require("../models/window_properties_model");
const _ = require('underscore');
const session = require('electron').session;
const Q = require('q');

var PortalWindow = Window.extend({
  showDevTools: false,
  url: 'https://cloud-player.io',
  id: 'portal',
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
  windowsProperties: new WindowsProperties(),
  windowProperties: null,
  showConnectWindow: function (url) {
    this._connectionWindow = new ConnectWindow({
      url: url,
      options: {
        parent: this.window,
        modal: false
      }
    });
    this._connectionWindow.open();
  },
  setLastWindowSize: function () {
    var size = electron.screen.getPrimaryDisplay().workAreaSize;

    this.window.setContentSize(size.width, size.height);

    return this.windowsProperties.find({name: 'portal'}).then(function (collection) {
      try {
        if (collection.length === 0) {
          this.windowProperties = new WindowProperties({name: 'portal'});
        } else {
          this.windowProperties = collection.first();
          var size = this.windowProperties.get('size'),
            position = this.windowProperties.get('position');

          this.window.setContentSize(size.width, size.height);
          this.window.setPosition(position.x, position.y);
        }
      } catch (err) {
        var dfd = Q.defer();
        dfd.reject(err);
        return dfd.promise;
      }
    }.bind(this));
  },
  beforeShow: function () {
    return this.setLastWindowSize();
  },
  initialize: function () {
    this.on('close hide', function () {
      if (this.windowProperties) {
        this.windowProperties.set('size', {
          width: this.window.getContentSize()[0],
          height: this.window.getContentSize()[1]
        });
        this.windowProperties.set('position', {
          x: this.window.getPosition()[0],
          y: this.window.getPosition()[1]
        });
        this.windowProperties.save();
      }
    }.bind(this));

    this.window.webContents.on('new-window', function (event, location) {
      /*
       * DEPRECATED only to support older versions
       * TODO Remove this
       */
      if (location.match(/.*soundcloud.com\/connect.*/)) {
        this.showConnectWindow.call(this, location);
        event.preventDefault();
        return;
      }

      if (location.match(/.*api.cloud-player.io\/*/)) {
        this.showConnectWindow.call(this, location);
        event.preventDefault();
        return;
      }

      // When user clicks on item in youtube player prevent opening an ew tab and play video instaed
      var youtubeRegex = /.*youtube.com\/watch.*v=([^&]*)&?/;
      var match = location.match(youtubeRegex);
      if (match && match.length > 0) {
        this.window.webContents.executeJavaScript(
          'window.dispatchEvent(new CustomEvent("playTrack", {detail:{track: {provider:"youtube", id: "' + match[1] + '"}}}))'
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