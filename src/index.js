// src/index.js

import Phaser from 'phaser';
import phaserConfig from './config/phaserConfig';

// Initialize the Phaser game with the defined configuration
const game = new Phaser.Game(phaserConfig);

// You can expose the game instance globally if needed for debugging
// window.game = game;

console.log("Phaser game initialized.");
