import { Sprite, Application } from 'pixi.js';

import config from '../config';
import viewport from './viewport';
import Game from '../Game';
import Assets from './AssetManager';

/**
 * Game entry point. Holds the game's viewport
 * All configurations are described in src/config.js
 */
export default class GameApplication extends Application {
  constructor() {
    super(config.view);

    this.config = config;
    Assets.renderer = this.renderer;

    this.setupViewport();

    this.loadAssets().then(() => this.initGame());
  }

  /**
   * Load all images and sounds
   */
  async loadAssets() {
    await Assets.load({ images: Assets.images, sounds: Assets.sounds });
  }

  /**
   * Game main entry point. Loads and prerenders assets.
   * Creates the main game container.
   *
   */
  async initGame() {
    this.game = new Game();
    this.viewport.addChild(this.game);

    this.game.start();
  }

  /**
     * Initialize the game world viewport.
     * Supports handly functions like dragging and panning on the main game stage
     *
     * @return {PIXI.Application}
     */
  setupViewport() {
    document.body.appendChild(this.view);
    this.stage.addChild(viewport);
    this.viewport = viewport;
  }
}

