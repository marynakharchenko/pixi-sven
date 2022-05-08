const isHorizontal = window.innerWidth > window.innerHeight;
const size = isHorizontal ? window.innerHeight : window.innerWidth;
const left = (window.innerWidth - size) / 2;
const top = (window.innerHeight - size) / 2;

export default {
  view: {
    width: size,
    height: size,
    backgroundColor: 0x000000,
    worldWidth: size * 3,
    worldHeight: size * 3,
    isHorizontal,
    left,
    top
  },
  game: {
    width: size * 3,
    height: size * 3,
    tileWidth: 100,
    tileHeight: 100,
    drag: false,
    pinch: true,
    decelerate: true,
    wheel: true,
  },
  scenes: {
    Splash: {
      hideDelay: 0,
    },
  },
  assets: {
    root: '/',
  },
};
