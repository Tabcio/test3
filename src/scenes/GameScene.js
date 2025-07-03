// src/scenes/GameScene.js

import Board from '../game_objects/Board';
import Unit from '../game_objects/Unit';
import firebaseService from '../services/FirebaseService'; // Import the Firebase service

class GameScene extends Phaser.Scene {
    constructor() {
        super('Game'); // Assign a key for this scene
        this.board = null; // Will hold the Board instance
        this.units = {}; // Use an object to hold units by ID for easier lookup
        this.selectedUnit = null; // Currently selected unit
        this.isInitialized = false; // Flag to ensure Firebase is ready before operations
        this.playerUnits = []; // To store units belonging to the current player
    }

    create() {
        console.log("GameScene created!");

        // Initialize Firebase service and pass this scene as a reference
        firebaseService.initializeFirebase(this);

        // Create the game board
        this.board = new Board(this, 64, 8, 8); // 8x8 board with 64x64 pixel tiles

        // Store the board instance globally for units to access
        this.sys.game.board = this.board; // This makes `this.scene.board` accessible in Unit.js

        // Listen for unit selection events from Unit objects
        this.events.on('unitSelected', this.handleUnitSelection, this);

        // Set up input listener for clicks on the board
        this.input.on('pointerdown', this.handleBoardClick, this);

        // Set up a listener for when Firebase is ready to perform initial unit setup
        this.events.on('firebaseReady', () => {
            console.log("GameScene received 'firebaseReady' event. Calling setupInitialUnits.");
            this.setupInitialUnits();
        }, this);

        // Listen for scene shutdown to clean up Firebase listeners
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    update() {
        // Game loop updates go here
        if (this.selectedUnit) {
            this.selectedUnit.updateSelectionGlowPosition();
        }
    }

    /**
     * Called by FirebaseService when authentication is ready.
     * This is where we should set up our initial units based on Firebase data.
     */
    setupInitialUnits() {
        if (this.isInitialized) {
            console.log("GameScene already initialized, skipping initial unit setup.");
            return; // Prevent double initialization
        }

        const currentUserId = firebaseService.getUserId();
        console.log(`Setting up initial units for user: ${currentUserId}`);

        // Clear existing units if any (important if re-initializing or on scene restart)
        Object.values(this.units).forEach(unit => unit.destroy());
        this.units = {};
        this.playerUnits = [];

        // Create initial units and place them on the board
        // IMPORTANT: For initial setup, we place them at default positions.
        // The handleFirebaseUnitsUpdate will then move them to their actual positions
        // if data already exists in Firebase. If not, these will be the starting positions.
        const unit1Id = 'unit_1';
        const unit2Id = 'unit_2';

        // Unit A (Red)
        const unitA = new Unit(this, 0, 0, 'unit_a', null, unit1Id, 'UNIT_A');
        this.units[unit1Id] = unitA;
        unitA.setBoardPosition(0, 0); // Place at top-left
        unitA.ownerId = currentUserId; // Assign ownership to the current user for testing

        // Unit B (Blue)
        const unitB = new Unit(this, 0, 0, 'unit_b', null, unit2Id, 'UNIT_B');
        this.units[unit2Id] = unitB;
        unitB.setBoardPosition(7, 7); // Place at bottom-right
        unitB.ownerId = currentUserId; // Assign ownership to the current user for testing BOTH units
        // We will refine player ownership in Stage 5.

        this.isInitialized = true;
        console.log("Initial units created and placed on board.");

        // If you want these initial positions to be immediately pushed to Firebase
        // when the game first loads (and no game state exists yet), you could do this:
        // However, the FirebaseService's onSnapshot listener will typically populate
        // the units if they already exist in the database.
        // For a brand new game, the first move will create the unit entries in Firestore.
    }

    /**
     * Handles a unit being selected.
     * @param {Unit} unit - The unit that was clicked.
     */
    handleUnitSelection(unit) {
        // Only allow selecting units that belong to the current player
        if (unit.ownerId && unit.ownerId !== firebaseService.getUserId()) {
            console.log("Cannot select opponent's unit. Unit owner:", unit.ownerId, "Current user:", firebaseService.getUserId());
            this.events.emit('uiUpdate', { message: "That's not your unit!" });
            if (this.selectedUnit) {
                this.selectedUnit.setSelected(false);
                this.selectedUnit = null;
            }
            return;
        }

        if (this.selectedUnit) {
            this.selectedUnit.setSelected(false); // Deselect previous unit
        }
        this.selectedUnit = unit;
        this.selectedUnit.setSelected(true); // Select the new unit
        console.log(`Selected Unit: ${unit.unitId}`);
        this.events.emit('uiUpdate', { message: `Selected: ${unit.type} (ID: ${unit.unitId})` });
    }

    /**
     * Handles clicks on the game board.
     * If a unit is selected, attempts to move it to the clicked tile.
     * @param {Phaser.Input.Pointer} pointer - The pointer object (mouse/touch).
     */
    handleBoardClick(pointer) {
        // Check if the click was within the board boundaries
        if (!this.board.isWithinBounds(pointer.x, pointer.y)) {
            // If clicked outside the board, deselect any unit
            if (this.selectedUnit) {
                this.selectedUnit.setSelected(false);
                this.selectedUnit = null;
                this.events.emit('uiUpdate', { message: 'No unit selected.' });
            }
            console.log("Clicked outside board. Deselecting unit if any.");
            return;
        }

        // Get the board coordinates of the clicked position
        const targetTile = this.board.getBoardCoordinates(pointer.x, pointer.y);
        console.log(`Clicked board tile: (${targetTile.x}, ${targetTile.y})`);

        if (this.selectedUnit) {
            // Check if the selected unit belongs to the current player
            if (this.selectedUnit.ownerId !== firebaseService.getUserId()) {
                console.log("Cannot move opponent's unit. Selected unit owner:", this.selectedUnit.ownerId, "Current user:", firebaseService.getUserId());
                this.events.emit('uiUpdate', { message: "You can't move that unit!" });
                // Deselect the unit if it's not ours
                this.selectedUnit.setSelected(false);
                this.selectedUnit = null;
                return;
            }

            // Basic movement rule: Can only move to an adjacent tile (for now)
            const currentTileX = this.selectedUnit.currentTileX;
            const currentTileY = this.selectedUnit.currentTileY;

            const dx = Math.abs(targetTile.x - currentTileX);
            const dy = Math.abs(targetTile.y - currentTileY);

            // Check if the target tile is different from the current tile
            if (dx === 0 && dy === 0) {
                console.log("Clicked on the same tile, no movement.");
                return; // No movement if clicking on the same tile
            }

            // For now, allow movement to any tile.
            // In a real game, you'd add pathfinding, range checks, collision detection, etc.
            console.log(`Attempting to move unit ${this.selectedUnit.unitId} from (${currentTileX}, ${currentTileY}) to (${targetTile.x}, ${targetTile.y})`);

            // Update Firebase with the new unit position
            firebaseService.updateUnitPosition(this.selectedUnit.unitId, targetTile.x, targetTile.y);
            console.log(`Called firebaseService.updateUnitPosition for unit ${this.selectedUnit.unitId}`);

            // The unit's visual position will be updated by the Firebase listener
            // once the data comes back from the database.
            this.events.emit('uiUpdate', { message: `Moving ${this.selectedUnit.type}...` });

            // Deselect the unit immediately after sending the move to Firebase
            this.selectedUnit.setSelected(false);
            this.selectedUnit = null;

        } else {
            console.log("No unit selected. Click a unit first.");
            this.events.emit('uiUpdate', { message: 'Click a unit to select it.' });
        }
    }

    /**
     * Handles real-time unit updates from Firebase.
     * This function is called by FirebaseService when unit data changes.
     * @param {object} unitsData - An object containing unit IDs as keys and their data (x, y, ownerId) as values.
     */
    handleFirebaseUnitsUpdate(unitsData) {
        if (!this.isInitialized) {
            console.log("GameScene not fully initialized, deferring unit update from Firebase.");
            return;
        }
        console.log("handleFirebaseUnitsUpdate called with unitsData:", unitsData);

        const currentUserId = firebaseService.getUserId();

        for (const unitId in unitsData) {
            const unitInfo = unitsData[unitId];
            let unit = this.units[unitId];

            if (!unit) {
                // If the unit doesn't exist in our scene, create it
                // Determine unit type based on ID or some other logic
                const unitType = unitId === 'unit_1' ? 'unit_a' : 'unit_b'; // Assuming 'unit_1' is 'unit_a' and 'unit_2' is 'unit_b'
                unit = new Unit(this, 0, 0, unitType, null, unitId, unitType.toUpperCase());
                this.units[unitId] = unit;
                console.log(`Created new unit ${unitId} from Firebase data.`);
            }

            // Assign ownership based on Firebase data (if available)
            // If the unitInfo has a 'movedBy' field, use that as the owner.
            // Otherwise, keep the existing ownerId or assign a default.
            if (unitInfo.movedBy) {
                unit.ownerId = unitInfo.movedBy;
            } else if (!unit.ownerId) {
                // Fallback for initial state if 'movedBy' is not present
                unit.ownerId = (unitId === 'unit_1') ? 'player_1_placeholder' : 'player_2_placeholder';
            }

            // Update the unit's position if it's different from its current position
            if (unit.currentTileX !== unitInfo.x || unit.currentTileY !== unitInfo.y) {
                console.log(`Updating unit ${unitId} to (${unitInfo.x}, ${unitInfo.y}) based on Firebase data.`);
                // Animate the unit's movement
                unit.setBoardPosition(unitInfo.x, unitInfo.y, true);
            } else {
                console.log(`Unit ${unitId} already at (${unitInfo.x}, ${unitInfo.y}), no movement needed.`);
            }
        }

        // Ensure units that are no longer in Firebase are removed from the scene
        for (const sceneUnitId in this.units) {
            if (!unitsData[sceneUnitId]) {
                console.log(`Removing unit ${sceneUnitId} as it's no longer in Firebase.`);
                this.units[sceneUnitId].destroy();
                delete this.units[sceneUnitId];
            }
        }
    }

    /**
     * Cleans up listeners when the scene is shut down.
     */
    shutdown() {
        firebaseService.cleanup();
        console.log("GameScene shutdown: Firebase listeners cleaned up.");
    }
}

export default GameScene;
