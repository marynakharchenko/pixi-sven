import config from '../config/config';

const E = 0; // Empty
const W = 1; // Wall - tree or end of map
const T = 2; // Teleport - puddle or lake
const V = 3; // Sven
const S = 4; // Sheep

const LEVEL1 = [
  [0, 0, 0, W, 0, 0, 0, 0, W, 0, 0, 0], // 1
  [0, 0, W, 0, 0, 0, W, 0, 0, W, 0, 0],
  [0, 0, W, 0, W, 0, 0, 0, 0, 0, W, 0], // 3
  [0, W, 0, 0, 0, 0, 0, S, 0, 0, 0, W],
  [W, 0, 0, S, 0, 0, 0, 0, 0, S, 0, T], // 5
  [W, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T],
  [W, 0, S, 0, S, 0, V, 0, 0, S, 0, T], // 7
  [W, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, T],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, 0], // 9
  [W, 0, S, 0, 0, 0, S, 0, 0, 0, W, 0],
  [0, W, 0, 0, 0, 0, 0, 0, 0, 0, W, 0], // 11
  [0, 0, W, 0, 0, 0, 0, 0, 0, W, 0, 0],
  [0, 0, 0, W, 0, 0, T, 0, W, 0, 0, 0], // 13
  [0, 0, 0, 0, W, 0, 0, W, 0, 0, 0, 0],
];

export default class Map {
  constructor() {
    this.offsetX = config.game.width / 3 + 100;
    this.offsetY = config.game.height / 3 + 100;
    this.tileWidth = 120;
    this.tileHeight = 120;

    this.isoY = 0.7; // tile positions appear skewed

    this.rotation = 0;

    this.IDS = {
      EMPTY: E,
      WALL: W,
      TELEPORT: T,
      SVEN: V,
      SHEEP: S,
    };

    this._map = LEVEL1;
  }

  /**
     * returns the tileId on a given position
     * @returns int
     * @param {int} pos.row
     * @param {int} pos.col
     */
  getTile({ row, col }) {
    return this._map[row][col];
  }

  /**
     * returns the actual x and y value of a tile in the map
     * @returns {{}}
     * @param {int} row
     * @param {int} col
     */
  coordsFromPos({ row, col }) {
    // coordinates before any transformation
    const x = col * this.tileWidth;
    const y = row * this.tileHeight;

    // coordinates after rotation
    let xT = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
    let yT = y * Math.cos(this.rotation) + x * Math.sin(this.rotation);

    // offset into visible area
    xT += this.offsetX;
    yT += this.offsetY;

    // apply isometry
    yT *= this.isoY;

    return {
      x: xT,
      y: yT,
    };
  }

  /**
     * sets tileId to a given position in the map
     * @param {int} row
     * @param {int} col
     * @param {int} id
     */
  setTileOnMap({ row, col }, id) {
    this._map[row][col] = id;
  }

  posById(id) {
    const result = [];

    for (let row = 0; row < this._map.length; row++) {
      for (let col = 0; col < this._map[row].length; col++) {
        if (this._map[row][col] === id) result.push({ row, col });
      }
    }

    return result;
  }

  getDestination(position, direction) {
    let { row, col } = position;

    switch (direction) {
      case 'Up': row--; break;
      case 'Down': row++; break;
      case 'Left': col--; break;
      case 'Right': col++; break;
      default: break;
    }

    return { row, col };
  }

  outOfBounds({ row, col }) {
    return row < 0 || col < 0 || row > 25 || col > 25;
  }

  collide({ row, col }) {
    return this._map[row][col] !== E;
  }
}
