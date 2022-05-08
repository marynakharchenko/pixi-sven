import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';

import svenAnimations from '../animations/svenAnimations';
import sheepAnimations from '../animations/sheepAnimations';
import Entity from '../entities/Entity';
import Map from '../entities/Map';
import Sven from '../entities/Sven';
import ScoreBoard from '../entities/ScoreBoard';
import Timer from '../entities/Timer';
import EndScreen from '../entities/EndScreen';

import config from '../config/config';
import viewport from '../viewport/viewport';
// Import the sounds
import Assets from '../assetsManager/AssetManager';

/**
 * Main game stage, manages scenes/levels.
 *
 * @extends {PIXI.Container}
 */
export default class Game extends Container {
  constructor() {
    super();
    this._pressedKeys = [];
    this._map = new Map();
    this._scoreBoard = new ScoreBoard();
    this._timer = new Timer();
    this._endScreen = new EndScreen();
    this._herd = [];
  }

  async start() {
    this._attachKeyboardListeners();

    const background = Sprite.from('background');

    background.width = config.game.width;
    background.height = config.game.height;

    this.addChild(background);
    this.addChild(this._scoreBoard.score);
    this.addChild(this._timer.timerText);
    this._createSven();
    this._createHerd();
    this.addChild(this._endScreen);
    this._timer.start(() => this._onEnd());

    // Start the background loop
    Assets.sounds.background.play();
  }

  _createSven() {
    const svenMapPos = this._map.posById(this._map.IDS.SVEN)[0];
    const svenCoords = this._map.coordsFromPos(svenMapPos);

    this._sven = new Sven(svenAnimations);
    this._sven.init(svenCoords);

    viewport.follow(this._sven.anim);

    this.addChild(this._sven.anim);
  }

  _createHerd() {
    const sheepPositions = this._map.posById(this._map.IDS.SHEEP);

    sheepPositions.forEach((sheepPosition) => {
      const sheepCoords = this._map.coordsFromPos(sheepPosition);
      const sheep = new Entity(sheepAnimations);

      sheep.init(sheepCoords);

      sheep.col = sheepPosition.col;
      sheep.row = sheepPosition.row;
      sheep.humpedCount = 0;

      this.addChild(sheep.anim);
      this._herd.push(sheep);
    });
  }

  _attachKeyboardListeners() {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keyup', this._onKeyUp.bind(this));
  }

  _onKeyDown(e) {
    if (this._pressedKeys.includes(e.code)) return;

    this._pressedKeys.push(e.code);
    this._svenAction();
  }

  _onKeyUp(e) {
    this._pressedKeys.splice(this._pressedKeys.indexOf(e.code), 1); // no checks ftw
  }

  _svenAction() {
    if (this._sven.moving) return;

    const directionKey = this._pressedKeys.find((k) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k));

    if (directionKey) {
      const direction = directionKey.replace('Arrow', '');

      this._svenMove(direction);

      return;
    }

    if (this._pressedKeys.includes('Space')) {
      this._svenHump();

      return;
    }

    this._sven.standStill();
  }

  async _svenMove(direction) {
    const oldPos = this._map.posById(this._map.IDS.SVEN)[0];
    const newPos = this._map.getDestination(oldPos, direction);

    if (this._map.outOfBounds(newPos) || this._map.collide(newPos)) return this._sven.standStill(direction);

    const targetPos = this._map.coordsFromPos(newPos);

    await this._sven.move(targetPos, direction);

    this._map.setTileOnMap(oldPos, this._map.IDS.EMPTY);
    this._map.setTileOnMap(newPos, this._map.IDS.SVEN);

    return this._svenAction();
  }

  _svenHump() {
    const svenDirection = this._sven.direction;
    const svenPos = this._map.posById(this._map.IDS.SVEN)[0];
    const targetPos = this._map.getDestination(svenPos, svenDirection);

    const hitSheep = this._map.getTile(targetPos) === this._map.IDS.SHEEP;

    if (!hitSheep) return this._sven.standStill();

    const sheep = this._herd.find((s) => s.row === targetPos.row && s.col === targetPos.col);

    if (this._sven.direction !== sheep.direction) return this._sven.standStill();

    if (this._sven.isHumping) return this._sven.standStill();

    if (sheep.humpedCount >= 4) return this._sven.standStill();

    sheep.anim.visible = false;

    this._scoreBoard.update(3); // 3 points
    // Play the hump sound
    if (!Assets.sounds.hump.playing()) Assets.sounds.hump.play();

    this._sven.hump(() => {
      sheep.humpedCount++;
      sheep.anim.visible = true;
      this._sven.standStill();
      if (sheep.humpedCount >= 4) {
        this._removeSheep(sheep, () => {
          if (this._herd.length === 0) return this._onEnd();

          return this._herd;
        });
      }

      this._svenAction();
    });

    return sheep.humpedCount;
  }

  _removeSheep(sheep, callback) {
    gsap.to(sheep.anim, {
      alpha: 0.4,
      duration: 0.5,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        // Play the smoke sound
        Assets.sounds.puffSmoke.play();

        sheep.anim.textures = sheep.animations.disappear;
        sheep.anim.gotoAndPlay(0);
        sheep.anim.onComplete = () => {
          // Play the point sound
          Assets.sounds.point.play();
          const sheepIndex = this._herd.indexOf(sheep);

          this._herd.splice(sheepIndex, 1);
          this.removeChild(sheep.anim);
          this._map.setTileOnMap({ row: sheep.row, col: sheep.col }, this._map.IDS.EMPTY);
          callback();
          sheep.anim.onComplete = null; // Detach the listener
        };
      },
    });
  }

  _onEnd() {
    const score = this._scoreBoard.scoreValue;
    const win = this._herd.length === 0;
    // Play Win or Lose sounds

    if (win === true) {
      Assets.sounds.win.play();
    } else {
      Assets.sounds.lose.play();
    }
    // Fade out the background sound
    Assets.sounds.background.fade(1, 0, 200);
    this._endScreen.show(score, win);
  }
}
