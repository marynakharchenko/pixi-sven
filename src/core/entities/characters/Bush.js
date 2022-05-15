import { AnimatedSprite } from 'pixi.js';
import CONSTANTS from '../../constants/constants';

import Entity from './Entity';

export default class Bush extends Entity {
  constructor(animations) {
    super(animations);
  }

  /**
   *
   * @param {x,y} position coordinates
   * @param width width
   * @param height height
   */
  async init(position, width, height) {
    this.anim = new AnimatedSprite(this.animations[CONSTANTS.ACTIONS.STAND]);
    this.anim.position = position;
    // Don't loop it at initial state
    this.anim.loop = false;
    // Set with and height
    if (width) this.anim.width = width;
    if (height) this.anim.height = height;
  }

  standStill(direction = this.direction) {
    this.anim.textures = this.animations[CONSTANTS.ACTIONS.STAND];
    this.anim.gotoAndStop(0);
  }
}
