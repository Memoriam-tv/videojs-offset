import videojs from 'video.js';

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
const onPlayerTimeUpdate = function() {
  const curr = this.currentTime();

  if (curr < 0) {
    this.currentTime(0);
    this.play();
  }
  if (this._offsetEnd > 0 && curr > this._offsetEnd - this._offsetStart) {
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
const offset = function(options) {
  options = options || {};
  const Player = this.constructor;

  this._offsetStart = parseFloat(options.start) || 0;
  this._offsetEnd = parseFloat(options.end) || 0;
  this._restartBeginning = options.restart_beginning || false;

  if (!Player.__super__ || !Player.__super__.__offsetInit) {
    Player.__super__ = Player.__super__ || {};
    Player.__super__ = Object.assign(Player.__super__, {
      __offsetInit: true,
      duration: Player.prototype.duration,
      currentTime: Player.prototype.currentTime,
      bufferedPercent: Player.prototype.bufferedPercent
    });

    this.duration = function() {
      if (this._offsetEnd > 0) {
        return this._offsetEnd - this._offsetStart;
      }
      return (
        Player.__super__.duration.apply(this, arguments) - this._offsetStart
      );
    };

    this.currentTime = function(seconds) {
      if (seconds !== undefined) {
        return (
          Player.__super__.currentTime.call(this, seconds + this._offsetStart) -
          this._offsetStart
        );
      }
      return (
        Player.__super__.currentTime.apply(this, arguments) - this._offsetStart
      );
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
  }

  this.disposeOffset = () => {
    Player.prototype.duration = Player.__super__.duration;
    Player.prototype.currentTime = Player.__super__.currentTime;
    Player.prototype.bufferedPercent = Player.__super__.bufferedPercent;

    this.off('timeupdate', onPlayerTimeUpdate);

    Player.__super__.__offsetInit = false;
  };

  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });

  this.one('dispose', this.disposeOffset);
};

// Register the plugin with video.js.
registerPlugin('offset', offset);
// Include the version number.
offset.VERSION = '__VERSION__';

export default offset;
