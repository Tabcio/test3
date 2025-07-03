// src/game_objects/Board.js

class Board {
    constructor(scene, tileSize = 64, boardWidth = 8, boardHeight = 8) {
        this.scene = scene; // Reference to the Phaser scene
        this.tileSize = tileSize; // Size of each tile in pixels
        this.boardWidth = boardWidth; // Number of tiles wide
        this.boardHeight = boardHeight; // Number of tiles high
        this.boardGraphics = this.scene.add.graphics(); // Graphics object for drawing the board

        // Calculate the starting position to center the board on the screen
        this.startX = (this.scene.sys.game.config.width - (this.boardWidth * this.tileSize)) / 2;
        this.startY = (this.scene.sys.game.config.height - (this.boardHeight * this.tileSize)) / 2;

        this.tiles = []; // Array to hold tile sprites (optional, for more complex tile interactions)

        this.drawBoard(); // Draw the board when the object is created
    }

    /**
     * Draws the grid lines and alternating tile colors for the game board.
     */
    drawBoard() {
        // Clear any previous drawings
        this.boardGraphics.clear();

        // Loop through rows and columns to draw tiles
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                // Calculate the pixel position of the current tile
                const tileX = this.startX + x * this.tileSize;
                const tileY = this.startY + y * this.tileSize;

                // Determine tile color based on position for a chessboard pattern
                const color = (x + y) % 2 === 0 ? 0x004d40 : 0x00695c; // Darker and lighter green/teal

                this.boardGraphics.fillStyle(color, 1); // Set fill color and alpha
                this.boardGraphics.fillRect(tileX, tileY, this.tileSize, this.tileSize); // Draw the rectangle

                // Optionally, add a tile sprite for more complex visuals (e.g., if using tile images)
                // const tileSprite = this.scene.add.image(tileX + this.tileSize / 2, tileY + this.tileSize / 2, 'tile');
                // this.tiles.push(tileSprite);
            }
        }

        // Draw grid lines (optional, if you want explicit lines on top of colored tiles)
        this.boardGraphics.lineStyle(1, 0x000000, 0.5); // Black lines, semi-transparent

        // Draw vertical lines
        for (let i = 0; i <= this.boardWidth; i++) {
            const lineX = this.startX + i * this.tileSize;
            this.boardGraphics.beginPath();
            this.boardGraphics.moveTo(lineX, this.startY);
            this.boardGraphics.lineTo(lineX, this.startY + this.boardHeight * this.tileSize);
            this.boardGraphics.stroke();
        }

        // Draw horizontal lines
        for (let i = 0; i <= this.boardHeight; i++) {
            const lineY = this.startY + i * this.tileSize;
            this.boardGraphics.beginPath();
            this.boardGraphics.moveTo(this.startX, lineY);
            this.boardGraphics.lineTo(this.startX + this.boardWidth * this.tileSize, lineY);
            this.boardGraphics.stroke();
        }
    }

    /**
     * Converts board coordinates (x, y) to pixel coordinates.
     * @param {number} boardX - The X coordinate on the board (column).
     * @param {number} boardY - The Y coordinate on the board (row).
     * @returns {Phaser.Math.Vector2} The pixel coordinates (center of the tile).
     */
    getPixelCoordinates(boardX, boardY) {
        const pixelX = this.startX + boardX * this.tileSize + this.tileSize / 2;
        const pixelY = this.startY + boardY * this.tileSize + this.tileSize / 2;
        return new Phaser.Math.Vector2(pixelX, pixelY);
    }

    /**
     * Converts pixel coordinates to board coordinates (column, row).
     * @param {number} pixelX - The X pixel coordinate.
     * @param {number} pixelY - The Y pixel coordinate.
     * @returns {Phaser.Math.Vector2} The board coordinates (column, row).
     */
    getBoardCoordinates(pixelX, pixelY) {
        const boardX = Math.floor((pixelX - this.startX) / this.tileSize);
        const boardY = Math.floor((pixelY - this.startY) / this.tileSize);
        return new Phaser.Math.Vector2(boardX, boardY);
    }

    /**
     * Checks if given pixel coordinates are within the board boundaries.
     * @param {number} pixelX - The X pixel coordinate.
     * @param {number} pixelY - The Y pixel coordinate.
     * @returns {boolean} True if within bounds, false otherwise.
     */
    isWithinBounds(pixelX, pixelY) {
        return pixelX >= this.startX && pixelX < this.startX + this.boardWidth * this.tileSize &&
               pixelY >= this.startY && pixelY < this.startY + this.boardHeight * this.tileSize;
    }
}

export default Board;
