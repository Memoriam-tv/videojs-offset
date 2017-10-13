/**
 * videojs-offset
 * @version 2.0.0-beta.3
 * @copyright 2017 Carles Galan Cladera <cgcladera@gmail.com>
 * @license MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
	typeof define === 'function' && define.amd ? define(['video.js'], factory) :
	(global.videojsOffset = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

videojs = 'default' in videojs ? videojs['default'] : videojs;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// Default options for the plugin.
var defaults = {};

// Cross-compatibility for Video.js 5 and 6.
var registerPlugin = videojs.registerPlugin || videojs.plugin;
// const dom = videojs.dom || videojs;

/**
 * Checks whether the clip should be ended.
 *
 * @function onPlayerTimeUpdate
 *
 */
var onPlayerTimeUpdate = function onPlayerTimeUpdate() {
  var curr = this.currentTime();

  if (curr < 0) {
    this.currentTime(0);
    this.play();
  }
  if (this._offsetEnd > 0 && curr > this._offsetEnd - this._offsetStart) {
    this.off('timeupdate', onPlayerTimeUpdate);
    this.pause();
    this.trigger('ended');

    if (!this._restartBeginning) {
      this.currentTime(this._offsetEnd - this._offsetStart);
    } else {
      this.trigger('loadstart');
      this.currentTime(0);
    }
  }
};
/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player.
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
var onPlayerReady = function onPlayerReady(player, options) {
  player.one('play', function () {
    player.on('timeupdate', onPlayerTimeUpdate);
  });
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function offset
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
var offset = function offset(options) {
  var _this = this;

  options = options || {};
  var Player = this.constructor;

  this._offsetStart = options.start || 0;
  this._offsetEnd = options.end || 0;
  this._restartBeginning = options.restart_beginning || false;

  if (!Player.__super__ || !Player.__super__.__offsetInit) {
    Player.__super__ = Player.__super__ || {};
    Player.__super__ = _extends(Player.__super__, {
      __offsetInit: true,
      duration: Player.prototype.duration,
      currentTime: Player.prototype.currentTime,
      bufferedPercent: Player.prototype.bufferedPercent
    });

    Player.prototype.duration = function () {
      if (this._offsetEnd > 0) {
        return this._offsetEnd - this._offsetStart;
      }
      return Player.__super__.duration.apply(this, arguments) - this._offsetStart;
    };

    Player.prototype.currentTime = function (seconds) {
      if (seconds !== undefined) {
        return Player.__super__.currentTime.call(this, seconds + this._offsetStart) - this._offsetStart;
      }
      return Player.__super__.currentTime.apply(this, arguments) - this._offsetStart;
    };

    Player.prototype.startOffset = function () {
      return this._offsetStart;
    };

    Player.prototype.endOffset = function () {
      if (this._offsetEnd > 0) {
        return this._offsetEnd;
      }
      return this.duration();
    };
  }

  this.disposeOffset = function () {
    Player.prototype.duration = Player.__super__.duration;
    Player.prototype.currentTime = Player.__super__.currentTime;
    Player.prototype.bufferedPercent = Player.__super__.bufferedPercent;

    _this.off('timeupdate', onPlayerTimeUpdate);

    Player.__super__.__offsetInit = false;
  };

  this.ready(function () {
    onPlayerReady(_this, videojs.mergeOptions(defaults, options));
  });

  this.one('dispose', this.disposeOffset);
};

// Register the plugin with video.js.
registerPlugin('offset', offset);
// Include the version number.
offset.VERSION = '__VERSION__';

return offset;

})));
