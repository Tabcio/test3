// src/scenes/PreloaderScene.js

class PreloaderScene extends Phaser.Scene {
    constructor() {
        super('Preloader'); // Assign a key for this scene
    }

    preload() {
        // Display a loading bar
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        let width = this.cameras.main.width;
        let height = this.cameras.main.height;
        let loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading Game...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        let percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        let assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);

        // Update the loading bar and text as assets load
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('fileprogress', function (file) {
            assetText.setText('Loading asset: ' + file.key);
        });

        // Clean up loading bar elements when loading is complete
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();

            // Add a temporary visual confirmation that assets are loaded
            this.add.text(width / 2, height / 2, 'Assets Loaded!', {
                font: '30px Arial',
                fill: '#00ff00'
            }).setOrigin(0.5);

            // Give a brief moment to see the "Assets Loaded!" message before starting GameScene
            this.time.delayedCall(500, () => {
                // Start the GameScene once all assets are loaded
                this.scene.start('Game');
                // Also launch the UI Scene in parallel
                this.scene.launch('UI');
            }, [], this);

        }, this);

        // Load game assets from local 'assets' folder
        this.load.image('tile', 'assets/tile.png');
        this.load.image('unit_a', 'assets/unit_a.png');
        this.load.image('unit_b', 'assets/unit_b.png');

        console.log("PreloaderScene: Started loading assets.");
    }

    create() {
        // This scene automatically transitions to GameScene on load complete
    }
}

export default PreloaderScene;
