// src/scenes/BootScene.js

class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot'); // Assign a key for this scene
    }

    preload() {
        // Load any assets needed for the loading bar itself, if any.
        // For now, we'll just simulate a quick load.
        // Example: this.load.image('loading_bar_background', 'assets/loading_bar_bg.png');
        // This scene is primarily for transitioning to the PreloaderScene.
    }

    create() {
        // Start the PreloaderScene after the BootScene is created
        this.scene.start('Preloader');
    }
}

export default BootScene;
