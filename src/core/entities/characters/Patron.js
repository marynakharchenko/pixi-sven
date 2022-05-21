import Entity from './Entity';
import CONSTANTS from '../../constants/constants';

export default class Patron extends Entity {
  constructor(config, animations) {
    super(config, animations);
    // this.isHumping = false;
  }

  hump(callback) {
    // this.isHumping = true;
    this.anim.textures = this.animations[`${CONSTANTS.ACTIONS.HUMP}${this.direction}`];
    this.anim.gotoAndPlay(0);

    this.anim.onComplete = () => {
      this.anim.onComplete = null; // Detach the listener
      // this.isHumping = false;
      callback();
    };
  }
}
