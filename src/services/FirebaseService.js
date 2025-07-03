// src/services/FirebaseService.js

// Import the functions you need from the Firebase SDKs installed via npm
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, where, getDocs, addDoc, getDoc } from 'firebase/firestore'; // Added getDoc

class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.userId = null;
        this.isAuthReady = false; // Flag to indicate if authentication is ready
        this.gameId = 'defaultGame'; // A default game ID for now, will be dynamic later
        this.gameRef = null; // Reference to the current game document
        this.unitListener = null; // To store the unsubscribe function for unit changes
        this.gameScene = null; // Reference to the GameScene to notify about updates
        this.authPromise = null; // Promise to track authentication readiness
        this.authResolve = null; // Store the resolve function for authPromise
        this.authReject = null;  // Store the reject function for authPromise
    }

    /**
     * Initializes Firebase application and authenticates the user.
     * This method should be called once at the start of the application.
     * It uses the global __firebase_config and __initial_auth_token provided by the Canvas environment.
     * @param {object} gameScene - Reference to the GameScene instance to call its methods.
     */
    async initializeFirebase(gameScene) {
        this.gameScene = gameScene;

        // Create a promise that resolves when authentication is ready
        this.authPromise = new Promise((resolve, reject) => {
            this.authResolve = resolve;
            this.authReject = reject;
        });

        try {
            // Your web app's Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyCvjwMhTKbfnVfdfHFYNEgfsx7pti71nr0",
                authDomain: "test3-3bdba.firebaseapp.com",
                projectId: "test3-3bdba",
                storageBucket: "test3-3bdba.firebasestorage.app",
                messagingSenderId: "452015822857",
                appId: "1:452015822857:web:048f25eb6cfd21bd19c0d8"
            };

            // Use __app_id if available, otherwise fallback to projectId from firebaseConfig
            const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.projectId;

            console.log("FirebaseService: Initializing Firebase with config:", firebaseConfig);
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);

            // Set up an authentication state listener
            onAuthStateChanged(this.auth, async (user) => {
                let authSuccessful = false;
                if (user) {
                    this.userId = user.uid;
                    console.log("FirebaseService: Auth State Changed: User is signed in.", this.userId);
                    this.isAuthReady = true;
                    authSuccessful = true;
                } else {
                    console.log("FirebaseService: Auth State Changed: No user is signed in. Attempting anonymous sign-in.");
                    try {
                        await signInAnonymously(this.auth);
                        this.userId = this.auth.currentUser?.uid || crypto.randomUUID(); // Get UID after sign-in
                        this.isAuthReady = true;
                        authSuccessful = true;
                        console.log("FirebaseService: Signed in anonymously.");
                    } catch (anonError) {
                        console.error("FirebaseService: Error during anonymous sign-in:", anonError);
                        this.isAuthReady = false;
                        authSuccessful = false;
                        this.authReject(new Error("Anonymous sign-in failed."));
                        return; // Stop further execution in this branch
                    }
                }

                // Consolidated logic after auth state is determined
                if (authSuccessful) {
                    try {
                        await this.joinOrCreateGame();
                        this.setupRealtimeListeners();
                        if (this.gameScene && this.gameScene.events) {
                            this.gameScene.events.emit('firebaseReady');
                        }
                        this.authResolve(); // Resolve the promise once everything is set up
                    } catch (setupError) {
                        console.error("FirebaseService: Error during game setup after authentication:", setupError);
                        this.authReject(setupError); // Reject if setup fails
                    }
                } else {
                    console.warn("FirebaseService: Authentication failed, cannot proceed with game setup.");
                    this.authReject(new Error("Authentication failed."));
                }
            });

            // Display userId on the UI for multi-user apps (will be updated by onAuthStateChanged)
            if (this.gameScene && this.gameScene.events) {
                this.gameScene.events.emit('uiUpdate', { message: `Your User ID: Initializing...` });
            }

        } catch (error) {
            console.error("FirebaseService: Error initializing Firebase:", error);
            this.authReject(error); // Reject the promise on initialization error
        }

        // Wait for authentication to be ready before proceeding with other Firebase operations
        await this.authPromise;
        console.log("FirebaseService: Authentication process completed.");
    }

    /**
     * Signs in the user, preferring custom token or falling back to anonymous.
     * This method is now primarily called internally by onAuthStateChanged if no user is found.
     */
    async signInUser() {
        // This method is now simpler as the onAuthStateChanged handles the primary flow.
        // It's kept for clarity but its direct call from initializeFirebase has been removed
        // in favor of the onAuthStateChanged listener's flow.
        try {
            await signInAnonymously(this.auth);
            console.log("FirebaseService: Signed in anonymously (internal call).");
            this.isAuthReady = true;
        } catch (error) {
            console.error("FirebaseService: Error during Firebase sign-in (internal call):", error);
            this.isAuthReady = false;
            throw error; // Re-throw to propagate to onAuthStateChanged handler
        }
    }

    /**
     * Joins an existing game or creates a new one.
     * For simplicity, we'll use a fixed game ID for now.
     * In a real app, you'd have game lobbies, invites, etc.
     */
    async joinOrCreateGame() {
        // Ensure authentication is ready before attempting Firestore operations
        // This await is redundant here because it's already awaited in initializeFirebase
        // and this method is only called after authPromise resolves.
        // await this.authPromise;
        if (!this.isAuthReady || !this.userId) {
            console.warn("FirebaseService: Authentication not ready to join/create game after waiting. Cannot proceed.");
            return;
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : this.app.options.projectId; // Use actual projectId if __app_id not set
        this.gameRef = doc(this.db, `artifacts/${appId}/public/data/games`, this.gameId);
        console.log(`FirebaseService: Attempting to join or create game at path: artifacts/${appId}/public/data/games/${this.gameId}`);
        console.log(`FirebaseService: Using appId for gameRef: ${appId}`); // Added log for appId

        try {
            const gameDocSnapshot = await getDoc(this.gameRef);

            if (!gameDocSnapshot.exists()) {
                console.log(`FirebaseService: Game ${this.gameId} does not exist. Creating new game.`);
                // Define initial units for a new game
                const initialUnits = {
                    'unit_1': { x: 0, y: 0, movedBy: this.userId, type: 'UNIT_A' },
                    'unit_2': { x: 7, y: 7, movedBy: this.userId, type: 'UNIT_B' } // Assign BOTH units to the current user for testing
                };

                await setDoc(this.gameRef, {
                    id: this.gameId,
                    createdAt: Date.now(),
                    players: {
                        [this.userId]: { joinedAt: Date.now() }
                    },
                    units: initialUnits // Initialize units object with starting positions
                });
                console.log(`FirebaseService: Game ${this.gameId} created with initial units.`);
            } else {
                console.log(`FirebaseService: Joining existing game ${this.gameId}.`);
                // Update players list if joining existing game
                await setDoc(this.gameRef, {
                    players: {
                        [this.userId]: { joinedAt: Date.now() }
                    }
                }, { merge: true }); // Merge to update only the players field
            }
        } catch (error) {
            console.error("FirebaseService: Error joining or creating game:", error);
        }
    }

    /**
     * Sets up real-time listeners for game state changes.
     */
    setupRealtimeListeners() {
        if (!this.gameRef) {
            console.warn("FirebaseService: Game reference not set. Cannot set up listeners.");
            return;
        }
        console.log("FirebaseService: Setting up real-time listener for game state.");

        // Listen for changes to the 'units' subcollection within the game document
        this.unitListener = onSnapshot(this.gameRef, (docSnapshot) => {
            console.log("FirebaseService: onSnapshot callback triggered.");
            if (docSnapshot.exists()) {
                const gameData = docSnapshot.data();
                console.log("FirebaseService: Document data received:", gameData);
                if (gameData && gameData.units) {
                    console.log("FirebaseService: Real-time update received for units:", gameData.units);
                    // Notify GameScene about the updated unit data
                    if (this.gameScene) {
                        this.gameScene.handleFirebaseUnitsUpdate(gameData.units);
                    }
                } else {
                    console.log("FirebaseService: Game document exists but no 'units' data found.");
                }
            } else {
                console.log("FirebaseService: Game document does not exist for listener.");
            }
        }, (error) => {
            console.error("FirebaseService: Error listening to game state:", error);
        });
    }

    /**
     * Updates a unit's position in Firestore.
     * @param {string} unitId - The ID of the unit.
     * @param {number} x - The new X tile coordinate.
     * @param {number} y - The new Y tile coordinate.
     */
    async updateUnitPosition(unitId, x, y) {
        // Ensure authentication is ready before attempting Firestore operations
        await this.authPromise; // Wait for the auth promise to resolve
        if (!this.gameRef || !this.isAuthReady) {
            console.warn("FirebaseService: Firebase not ready or game reference not set. Cannot update unit position after waiting.");
            return;
        }

        try {
            // Update a specific unit's position within the 'units' map in the game document
            await setDoc(this.gameRef, {
                units: {
                    [unitId]: {
                        x: x,
                        y: y,
                        updatedAt: Date.now(),
                        movedBy: this.userId // Track who moved the unit
                    }
                }
            }, { merge: true }); // Use merge to only update the units map
            console.log(`FirebaseService: Unit ${unitId} position updated to (${x}, ${y}) in Firestore.`);
        } catch (error) {
            console.error("FirebaseService: Error updating unit position:", error);
        }
    }

    /**
     * Gets the current user ID.
     * @returns {string} The current user ID.
     */
    getUserId() {
        return this.userId;
    }

    /**
     * Cleans up Firebase listeners when they are no longer needed.
     */
    cleanup() {
        if (this.unitListener) {
            this.unitListener(); // Unsubscribe from the listener
            console.log("FirebaseService: Firestore unit listener unsubscribed.");
        }
    }
}

// Export a singleton instance of FirebaseService
const firebaseService = new FirebaseService();
export default firebaseService;
