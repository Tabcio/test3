// Import the Phaser library. This is how we access the framework's features.
import Phaser from 'phaser';

// This is the configuration object for our Phaser game.
const config = {
  // 'type' tells Phaser to automatically choose the best renderer (WebGL or Canvas).
  type: Phaser.AUTO,
  // The dimensions of the game canvas in pixels.
  width: 800,
  height: 600,
  // The background color of the game canvas.
  backgroundColor: '#000000',
  // A scene is a self-contained part of a game (like a level or a menu).
  // For this simple start, we define the 'preload' and 'create' functions directly.
  scene: {
    preload: preload,
    create: create,
  },
};

// Create a new instance of a Phaser Game with our configuration.
const game = new Phaser.Game(config);

// The preload function is called first. It's used to load assets like
// images and sounds. For now, it's empty.
function preload() {
  // This is where you'll load assets later.
}

// The create function is called once preload is complete. It's used to
// set up the game scene (like adding sprites and text). For now, it's empty.
function create() {
  // This is where you'll build your game world later.
  console.log('Phaser game created!');
}