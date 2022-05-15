import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';

import patronAnimations from '../animations/patronAnimations';
import mineAnimations from '../animations/mineAnimations';
import Map from '../entities/Map';
import Patron from '../entities/characters/Patron';
import Mine from '../entities/characters/Mine';
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
    this._mines = [];
  }

  async start() {
    this._attachKeyboardListeners();

    // const background = Sprite.from('background');
    //
    // background.width = config.game.width;
    // background.height = config.game.height;
    //
    // this.addChild(background);
    this.addChild(this._scoreBoard.score);
    this.addChild(this._timer.timerText);
    this._createPatron();
    this._createMines();
    this.addChild(this._endScreen);
    this._timer.start(() => this._onEnd());

    // Start the background loop
    Assets.sounds.background.play();
  }

  _createPatron() {
    const patronMapPos = this._map.posById(this._map.IDS.PATRON)[0];
    const patronCoords = this._map.coordsFromPos(patronMapPos);

    this._patron = new Patron(patronAnimations);

    this._patron.init(patronCoords, config.game.tileWidth, config.game.tileHeight);

    this._patron.anim.anchor.set(0.5);
    viewport.follow(this._patron.anim);

    this.addChild(this._patron.anim);
  }

  _createMines() {
    const minePositions = this._map.posById(this._map.IDS.MINE);

    minePositions.forEach((minePosition) => {
      const mineCoords = this._map.coordsFromPos(minePosition);
      const mine = new Mine(mineAnimations);

      mine.init(mineCoords, config.game.tileWidth / 3, config.game.tileHeight / 3);

      mine.col = minePosition.col;
      mine.row = minePosition.row;
      mine.humpedCount = 0;

      this.addChild(mine.anim);
      this._mines.push(mine);
    });
  }

  _attachKeyboardListeners() {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keyup', this._onKeyUp.bind(this));
  }

  _onKeyDown(e) {
    if (this._pressedKeys.includes(e.code)) return;

    this._pressedKeys.push(e.code);
    this._patronAction();
  }

  _onKeyUp(e) {
    this._pressedKeys.splice(this._pressedKeys.indexOf(e.code), 1); // no checks ftw
  }

  _patronAction() {
    if (this._patron.moving) return;

    const directionKey = this._pressedKeys.find((k) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k));

    if (directionKey) {
      const direction = directionKey.replace('Arrow', '');

      this._patronMove(direction);

      return;
    }

    if (this._pressedKeys.includes('Space')) {
      this._patronHump();

      return;
    }

    this._patron.standStill();
  }

  async _patronMove(direction) {
    const oldPos = this._map.posById(this._map.IDS.PATRON)[0];
    const newPos = this._map.getDestination(oldPos, direction);

    if (this._map.outOfBounds(newPos) || this._map.collide(newPos)) return this._patron.standStill(direction);

    const targetPos = this._map.coordsFromPos(newPos);

    await this._patron.move(targetPos, direction);

    this._map.setTileOnMap(oldPos, this._map.IDS.EMPTY);
    this._map.setTileOnMap(newPos, this._map.IDS.PATRON);

    return this._patronAction();
  }

  _patronHump() {
    const patronDirection = this._patron.direction;
    const patronPos = this._map.posById(this._map.IDS.PATRON)[0];
    const targetPos = this._map.getDestination(patronPos, patronDirection);

    const hitmine = this._map.getTile(targetPos) === this._map.IDS.MINE;

    if (!hitmine) return this._patron.standStill();

    const mine = this._mines.find((s) => s.row === targetPos.row && s.col === targetPos.col);

    // remove direction
    // if (this._patron.direction !== mine.direction) return this._patron.standStill();

    if (this._patron.isHumping) return this._patron.standStill();

    if (mine.humpedCount >= 4) return this._patron.standStill();

    mine.anim.visible = false;

    this._scoreBoard.update(3); // 3 points
    // Play the hump sound
    if (!Assets.sounds.hump.playing()) Assets.sounds.hump.play();

    this._patron.hump(() => {
      mine.humpedCount++;
      mine.anim.visible = true;
      this._patron.standStill();
      if (mine.humpedCount >= 4) {
        this._removeMine(mine, () => {
          if (this._mines.length === 0) return this._onEnd();

          return this._mines;
        });
      }

      this._patronAction();
    });

    return mine.humpedCount;
  }

  _removeMine(mine, callback) {
    gsap.to(mine.anim, {
      alpha: 0.4,
      duration: 0.5,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        // Play the smoke sound
        Assets.sounds.puffSmoke.play();

        mine.anim.textures = mine.animations.disappear;
        mine.anim.gotoAndPlay(0);
        mine.anim.onComplete = () => {
          // Play the point sound
          Assets.sounds.point.play();
          const mineIndex = this._mines.indexOf(mine);

          this._mines.splice(mineIndex, 1);
          this.removeChild(mine.anim);
          this._map.setTileOnMap({ row: mine.row, col: mine.col }, this._map.IDS.EMPTY);
          callback();
          mine.anim.onComplete = null; // Detach the listener
        };
      },
    });
  }

  _onEnd() {
    const score = this._scoreBoard.scoreValue;
    const win = this._mines.length === 0;
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
