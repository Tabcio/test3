// src/game_objects/Unit.js

class Unit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame, unitId, type) {
        // Call the Phaser.GameObjects.Sprite constructor
        // x and y are initially passed as 0, as setBoardPosition will handle the actual placement.
        super(scene, x, y, texture, frame);

        this.scene = scene; // Store a reference to the scene
        this.unitId = unitId; // Unique identifier for the unit
        this.type = type;     // Type of unit (e.g., 'UNIT_A', 'UNIT_B')
        this.currentTileX = -1; // Current board X coordinate
        this.currentTileY = -1; // Current board Y coordinate
        this.isMoving = false; // Flag to indicate if the unit is currently animating movement
        this.ownerId = null; // Will store the Firebase UID of the owner

        // Add the unit to the scene's display list and update list
        // This is crucial for the sprite to be rendered.
        this.scene.add.existing(this);

        // Set origin to center for easier positioning on tiles
        this.setOrigin(0.5, 0.5);

        // --- FIX: Scale the unit to match the tile size ---
        // Access the board's tileSize from the scene's global game object
        const tileSize = this.scene.sys.game.board ? this.scene.sys.game.board.tileSize : 64; // Default to 64 if board not yet available
        this.displayWidth = tileSize;
        this.displayHeight = tileSize;
        // --- END FIX ---

        // Enable input for this sprite (for click events)
        this.setInteractive();

        // Add a visual indicator for selection (e.g., a glow or border)
        this.selectionGlow = this.scene.add.graphics();
        this.selectionGlow.setDepth(this.depth - 1); // Draw behind the unit
        this.selectionGlow.setVisible(false); // Hidden by default

        // Add a click handler for the unit
        this.on('pointerdown', this.onClick, this);

        console.log(`Unit ${this.unitId} created with texture: ${texture} and scaled to ${tileSize}x${tileSize}`);
    }

    /**
     * Handles the click event on the unit.
     */
    onClick() {
        console.log(`Unit ${this.unitId} (${this.type}) clicked!`);
        // Emit an event that GameScene can listen to for unit selection
        this.scene.events.emit('unitSelected', this);
    }

    /**
     * Sets the unit's position on the game board (tile coordinates).
     * This method will convert tile coordinates to pixel coordinates.
     * @param {number} tileX - The X coordinate on the board.
     * @param {number} tileY - The Y coordinate on the board.
     * @param {boolean} [animate=false] - Whether to animate the movement.
     * @param {function} [onCompleteCallback=null] - Callback function after animation completes.
     */
    setBoardPosition(tileX, tileY, animate = false, onCompleteCallback = null) {
        this.currentTileX = tileX;
        this.currentTileY = tileY;

        // Get the pixel coordinates from the board (assuming board is accessible via scene)
        if (!this.scene.board) {
            console.error("Board instance not found in Unit.setBoardPosition. Cannot set unit pixel position.");
            return;
        }

        const pixelPos = this.scene.board.getPixelCoordinates(tileX, tileY);

        if (animate) {
            this.isMoving = true;
            this.scene.tweens.add({
                targets: this,
                x: pixelPos.x,
                y: pixelPos.y,
                duration: 300, // Movement duration in ms
                ease: 'Power2',
                onComplete: () => {
                    this.isMoving = false;
                    if (onCompleteCallback) {
                        onCompleteCallback();
                    }
                    this.updateSelectionGlowPosition(); // Update glow after move
                }
            });
        } else {
            this.setPosition(pixelPos.x, pixelPos.y);
            this.updateSelectionGlowPosition(); // Update glow immediately
        }
        console.log(`Unit ${this.unitId} set to board position (${tileX}, ${tileY}) at pixel (${pixelPos.x}, ${pixelPos.y})`);
    }

    /**
     * Toggles the visual selection state of the unit.
     * @param {boolean} isSelected - True to show selection, false to hide.
     */
    setSelected(isSelected) {
        if (isSelected) {
            this.selectionGlow.clear();
            this.selectionGlow.lineStyle(4, 0xffff00, 1); // Yellow glow
            // Draw the glow relative to the unit's position and size
            this.selectionGlow.strokeRect(
                this.x - this.displayWidth / 2 - 2, // Use displayWidth/Height for glow positioning
                this.y - this.displayHeight / 2 - 2,
                this.displayWidth + 4,
                this.displayHeight + 4
            );
            this.selectionGlow.setVisible(true);
        } else {
            this.selectionGlow.setVisible(false);
        }
    }

    /**
     * Updates the position of the selection glow to match the unit.
     * Call this in update() if the unit moves without tweening or if the glow needs to follow.
     */
    updateSelectionGlowPosition() {
        if (this.selectionGlow.visible) {
            this.selectionGlow.clear();
            this.selectionGlow.lineStyle(4, 0xffff00, 1);
            this.selectionGlow.strokeRect(
                this.x - this.displayWidth / 2 - 2, // Use displayWidth/Height for glow positioning
                this.y - this.displayHeight / 2 - 2,
                this.displayWidth + 4,
                this.displayHeight + 4
            );
        }
    }

    // You can add more unit-specific logic here (e.g., health, attack, abilities)
}

export default Unit;
