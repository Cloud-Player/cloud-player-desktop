const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const _ = require('underscore');
const Backbone = require('backbone');
const Q = require('q');

var Window = function () {
  if (!this.url) {
    throw new Error('Url has to be specified. Set the url to specify the content the window should load');
  }
  if (!this.id) {
    throw new Error('Id has to be specified');
  }
  if(this.initOnCreation){
    this._prepare.apply(this, arguments);
  }
};

_.extend(Window.prototype, Backbone.Events, {
  id: null,
  url: null,
  showDevTools: false,
  minDisplayTime: 0,
  windowEventBeforeOpen: null,
  initOnCreation: false,
  _isOpened: false,
  _initialized: false,
  _windowOpenedAt: null,
  _canBeOpened: true,
  _initBeforeOpeneEventHandler: function(){
    if(this.windowEventBeforeOpen){
      this._canBeOpened = false;
      this.window.webContents.on(this.windowEventBeforeOpen, function () {
        this._canBeOpened = true;
      }.bind(this))
    }
  },
  _initMinCloseHandler: function () {
    if (this.minDisplayTime > 0) {
      this.window.on('close', function (ev) {
        var deltaOpenClose = +new Date() - this._windowOpenedAt;

        if (deltaOpenClose < this.minDisplayTime) {
          ev.preventDefault();
          this.trigger('close');
          setTimeout(function () {
            this.window.close();
          }.bind(this), this.minDisplayTime - deltaOpenClose);
        } else {
          this.trigger('closed');
        }
      }.bind(this));
    } else {
      this.window.on('close', function () {
        this.trigger('close');
      }.bind(this));
      this.window.on('closed', function () {
        this.trigger('closed');
      }.bind(this));
    }
  },
  _prepare: function () {
    _.extend(_.result(this.options), {
      show: false
    });
    this.window = new BrowserWindow(this.options);

    this.window.loadURL(this.url);

    if (this.showDevTools) {
      this.window.webContents.openDevTools();
    }

    this.window.on('focus', function () {
      this.trigger('focus');
    }.bind(this));

    this.on('closed', function () {
      this._isOpened = false;
      this._initialized = false;
      delete this.window;
    });

    this._initBeforeOpeneEventHandler.apply(this,arguments);
    this._initMinCloseHandler.apply(this, arguments);
    this.initialize.apply(this, arguments);
    this._initialized = true;
    this.trigger('initialize');

  },
  options: function () {
    return {}
  },
  isOpened: function () {
    return this._isOpened;
  },
  beforeShow: function(){
    var dfd = Q.defer();
    this.trigger('open');
    if(!this._canBeOpened){
      console.log('BEFORE SHOW WAIT', this.id)
      this.window.webContents.on(this.windowEventBeforeOpen, function () {
        dfd.resolve.apply(this);
      }.bind(this))
    } else {
      console.log('BEFORE SHOW', this.id)
      dfd.resolve.apply(this);
    }
    return dfd.promise;
  },
  open: function (opts) {
    opts = opts || {};
    var dfd = Q.defer();
    this.on('opened', function () {
      this._isOpened = true;
      dfd.resolve();
    }, this);

    if (!this.window) {
      console.log('NO WINDOW', this.id)
      opts.reinitialize = false;
      this._prepare();
      this.open(opts);
      return dfd.promise;
    }

    if(opts.reinitialize){
      this.close().then(function(){
        this.open.apply(this);
      }.bind(this));
      return dfd.promise;
    }

    if (this._isOpened) {
      console.log('FOCUS', this.id);
      this.window.focus();
      this.trigger('opened');
      return dfd.promise;
    }

    this.beforeShow().then(function(){
      console.log('SHOW', this.id)
      this.window.show();
      this._windowOpenedAt = +new Date();
      this.trigger('opened');
    }.bind(this));

    return dfd.promise;
  },
  close: function () {
    var dfd = Q.defer();

    this.window.on('closed', function () {
      dfd.resolve();
    }.bind(this));

    this.window.close();

    return dfd.promise;
  },
  initialize: function () {
  }
});

Window.extend = Backbone.View.extend;

module.exports = Window;