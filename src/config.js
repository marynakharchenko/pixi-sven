export default {
  view: {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    worldWidth: window.innerWidth * 3,
    worldHeight: window.innerHeight * 3,
  },
  game: {
    width: window.innerWidth * 3,
    height: window.innerHeight * 3,
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
