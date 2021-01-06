/* eslint-disable no-underscore-dangle */
import videojs from 'video.js';
import { version as VERSION } from '../package.json';
import { timeAlmostEqual } from './utils';

// Default options for the plugin.
const defaults = {};

// Cross-compatibility for Video.js 5 and 6.
const registerPlugin = videojs.registerPlugin || videojs.plugin;
// const dom = videojs.dom || videojs;

/**
 * Checks whether the clip should be ended.
 *
 * @function onPlayerTimeUpdate
 *
 */
const onPlayerTimeUpdate = function onPlayerTimeUpdate() {
  const curr = this.currentTime();

  if (timeAlmostEqual(curr, 0)) {
    return;
  }

  if (curr < 0) {
    this.currentTime(0);
  }
  if (this._offsetEnd > 0 && curr > (this._offsetEnd - this._offsetStart)) {
    this.trigger('ended');

    if (!this._restartBeginning) {
      this.currentTime(this._offsetEnd - this._offsetStart);
      this.pause();
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
const onPlayerReady = (player, options) => {
  // Bind this handler right away after player ready,
  // when live videos are in autoplay videojs 5
  // does not trigger play event at the beginning
  player.on('timeupdate', onPlayerTimeUpdate);
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
const offset = function offset(incomingOptions) {
  const options = incomingOptions || {};
  const Player = this.constructor;

  this._offsetStart = parseFloat(options.start || '0');
  this._offsetEnd = parseFloat(options.end || '0');
  this._restartBeginning = options.restart_beginning || false;

  this.currentTime(0);
  this.getCache().initTime = 0;

  this.duration = function() {
    if (this._offsetEnd !== undefined && this._offsetStart !== undefined) {
      if (this._offsetEnd > 0) {
        return this._offsetEnd - this._offsetStart;
      }
      return (
        Player.prototype.duration.apply(this, arguments) - this._offsetStart
      );
    }
    return Player.prototype.duration.apply(this, arguments);
  };

  this.currentTime = function(seconds) {
    try {
      if (seconds !== undefined) {
        if (this._offsetStart !== undefined) {
          return Player.prototype.currentTime.call(
            this,
            seconds + this._offsetStart
          );
        }
        return Player.prototype.currentTime.call(this, seconds);
      }

      if (this._offsetStart !== undefined) {
        const t = Player.prototype.currentTime.apply(this) - this._offsetStart;

        this.getCache().currentTime = t;
        return t;
      }
      return Player.prototype.currentTime.apply(this);
    } catch (e) {
      // Try to handle TypeError: Cannot read property 'currentTime' of null
      // Can't find the reason but it's only affecting 1 user which emits 5K+ events.....
      if (e instanceof TypeError) {
        // eslint-disable-next-line no-restricted-globals
        window.location.reload();
      }
      throw e;
    }
  };

  this.remainingTime = function() {
    return this.duration() - this.currentTime();
  };

  this.startOffset = function() {
    return this._offsetStart;
  };

  this.endOffset = function() {
    if (this._offsetEnd > 0) {
      return this._offsetEnd;
    }
    return this.duration();
  };

  this.buffered = function() {
    const buff = Player.prototype.buffered.call(this);
    const ranges = [];

    for (let i = 0; i < buff.length; i++) {
      ranges[i] = [
        Math.max(0, buff.start(i) - this._offsetStart),
        Math.min(Math.max(0, buff.end(i) - this._offsetStart), this.duration())
      ];
    }

    return videojs.createTimeRanges(ranges);
  };

  this.disposeOffset = () => {
    this.off('timeupdate', onPlayerTimeUpdate);
  };

  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });

  this.one('dispose', this.disposeOffset);

  this.setOffset = function(start, end) {
    this._offsetStart = parseFloat(start || '0');
    this._offsetEnd = parseFloat(end || '0');

    this.trigger('timeupdate');
  };
};

// Register the plugin with video.js.
registerPlugin('offset', offset);
// Include the version number.
offset.VERSION = VERSION;

export default offset;
