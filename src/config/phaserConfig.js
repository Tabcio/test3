// src/config/phaserConfig.js

// Import necessary scenes
import BootScene from '../scenes/BootScene';
import PreloaderScene from '../scenes/PreloaderScene';
import GameScene from '../scenes/GameScene';
import UIScene from '../scenes/UIScene'; // Will be implemented later

// Define the Phaser game configuration
const phaserConfig = {
    // Type of rendering context to use (WebGL is preferred)
    type: Phaser.AUTO,
    // Width of the game canvas
    width: 800,
    // Height of the game canvas
    height: 600,
    // Parent element to attach the canvas to
    parent: 'game-container',
    // Background color of the game canvas
    backgroundColor: '#333333',
    // Pixel art mode for crisp sprites
    render: {
        pixelArt: true
    },
    // Physics engine configuration (if needed, e.g., Arcade physics)
    physics: {
        default: 'arcade',
        arcade: {
            // debug: true, // Uncomment to see physics bodies
            gravity: { y: 0 } // No gravity for a top-down game
        }
    },
    // Array of scenes to be included in the game
    // Scenes are added in the order they should be started or launched
    scene: [
        BootScene,      // First scene to load initial assets
        PreloaderScene, // Second scene to load all game assets and show loading bar
        GameScene,      // Main gameplay scene
        UIScene         // UI scene (will run in parallel with GameScene)
    ]
};

export default phaserConfig;
