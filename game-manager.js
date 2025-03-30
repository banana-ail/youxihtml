/**
 * Game Manager Utility for deadlock.baby
 * Helps manage game data, batch imports, and provides utility functions
 */

const GameManager = (function() {
    // Private variables
    let _games = [];
    let _categories = [];
    
    /**
     * Game object structure
     * {
     *   id: string (slug),
     *   name: string,
     *   description: string,
     *   shortDescription: string,
     *   category: string,
     *   categoryColor: string,
     *   iframeUrl: string,
     *   thumbnailUrl: string,
     *   rating: number (0-5),
     *   plays: number,
     *   dateAdded: Date,
     *   featured: boolean,
     *   popular: boolean,
     *   new: boolean,
     *   controls: array of {key: string, action: string},
     *   highlights: array of strings,
     *   howToPlay: array of strings,
     *   tips: array of strings,
     *   related: array of game ids
     * }
     */
    
    // Private methods
    function _saveGames() {
        // In a real implementation, this would save to a database
        // For demo purposes, we'll use localStorage
        localStorage.setItem('games', JSON.stringify(_games));
    }
    
    function _loadGames() {
        try {
            const savedGames = localStorage.getItem('games');
            if (savedGames) {
                _games = JSON.parse(savedGames);
                // Convert dateAdded strings back to Date objects
                _games.forEach(game => {
                    game.dateAdded = new Date(game.dateAdded);
                });
            }
        } catch (e) {
            console.error('Error loading games:', e);
        }
    }
    
    function _updateCategories() {
        const categoriesMap = {};
        
        _games.forEach(game => {
            if (!categoriesMap[game.category]) {
                categoriesMap[game.category] = {
                    name: game.category,
                    color: game.categoryColor,
                    count: 0
                };
            }
            categoriesMap[game.category].count++;
        });
        
        _categories = Object.values(categoriesMap);
    }
    
    function _generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    // Public API
    return {
        /**
         * Initialize the game manager
         */
        init: function() {
            _loadGames();
            _updateCategories();
            console.log('Game Manager initialized with', _games.length, 'games');
            return this;
        },
        
        /**
         * Get all games
         * @param {Object} filters - Optional filters
         * @returns {Array} - Filtered array of games
         */
        getGames: function(filters = {}) {
            let result = [..._games];
            
            if (filters.category) {
                result = result.filter(game => game.category === filters.category);
            }
            
            if (filters.featured) {
                result = result.filter(game => game.featured);
            }
            
            if (filters.popular) {
                result = result.filter(game => game.popular);
            }
            
            if (filters.new) {
                result = result.filter(game => game.new);
            }
            
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                result = result.filter(game => 
                    game.name.toLowerCase().includes(searchTerm) ||
                    game.description.toLowerCase().includes(searchTerm) ||
                    game.shortDescription.toLowerCase().includes(searchTerm)
                );
            }
            
            // Sort options
            if (filters.sort) {
                switch (filters.sort) {
                    case 'name':
                        result.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                    case 'rating':
                        result.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'plays':
                        result.sort((a, b) => b.plays - a.plays);
                        break;
                    case 'newest':
                        result.sort((a, b) => b.dateAdded - a.dateAdded);
                        break;
                }
            }
            
            // Pagination
            if (filters.limit && filters.page !== undefined) {
                const startIndex = filters.limit * filters.page;
                result = result.slice(startIndex, startIndex + filters.limit);
            } else if (filters.limit) {
                result = result.slice(0, filters.limit);
            }
            
            return result;
        },
        
        /**
         * Get a specific game by ID
         * @param {string} id - Game ID
         * @returns {Object|null} - Game object or null if not found
         */
        getGame: function(id) {
            return _games.find(game => game.id === id) || null;
        },
        
        /**
         * Add a new game
         * @param {Object} gameData - Game data object
         * @returns {string} - ID of the new game
         */
        addGame: function(gameData) {
            // Generate ID from name if not provided
            const id = gameData.id || _generateSlug(gameData.name);
            
            // Check if game with this ID already exists
            if (_games.some(game => game.id === id)) {
                throw new Error(`Game with ID ${id} already exists`);
            }
            
            // Create new game object with defaults for optional fields
            const newGame = {
                id,
                name: gameData.name,
                description: gameData.description || '',
                shortDescription: gameData.shortDescription || '',
                category: gameData.category,
                categoryColor: gameData.categoryColor || '',
                iframeUrl: gameData.iframeUrl,
                thumbnailUrl: gameData.thumbnailUrl || '',
                rating: gameData.rating || 0,
                plays: gameData.plays || 0,
                dateAdded: gameData.dateAdded || new Date(),
                featured: gameData.featured || false,
                popular: gameData.popular || false,
                new: gameData.new || true,
                controls: gameData.controls || [],
                highlights: gameData.highlights || [],
                howToPlay: gameData.howToPlay || [],
                tips: gameData.tips || [],
                related: gameData.related || []
            };
            
            // Add the game
            _games.push(newGame);
            
            // Update categories
            _updateCategories();
            
            // Save changes
            _saveGames();
            
            return id;
        },
        
        /**
         * Update an existing game
         * @param {string} id - Game ID
         * @param {Object} updates - Fields to update
         * @returns {boolean} - Success status
         */
        updateGame: function(id, updates) {
            const gameIndex = _games.findIndex(game => game.id === id);
            
            if (gameIndex === -1) {
                return false;
            }
            
            // Update the game
            _games[gameIndex] = {
                ..._games[gameIndex],
                ...updates
            };
            
            // Update categories if category changed
            if (updates.category) {
                _updateCategories();
            }
            
            // Save changes
            _saveGames();
            
            return true;
        },
        
        /**
         * Delete a game
         * @param {string} id - Game ID
         * @returns {boolean} - Success status
         */
        deleteGame: function(id) {
            const initialLength = _games.length;
            _games = _games.filter(game => game.id !== id);
            
            if (_games.length === initialLength) {
                return false;
            }
            
            // Update categories
            _updateCategories();
            
            // Save changes
            _saveGames();
            
            return true;
        },
        
        /**
         * Get all categories
         * @returns {Array} - Array of category objects
         */
        getCategories: function() {
            return [..._categories];
        },
        
        /**
         * Batch import games
         * @param {Array} gamesData - Array of game data objects
         * @returns {Object} - Import statistics
         */
        batchImport: function(gamesData) {
            const stats = {
                total: gamesData.length,
                added: 0,
                errors: []
            };
            
            gamesData.forEach(gameData => {
                try {
                    this.addGame(gameData);
                    stats.added++;
                } catch (error) {
                    stats.errors.push({
                        game: gameData.name || gameData.id,
                        error: error.message
                    });
                }
            });
            
            return stats;
        },
        
        /**
         * Record a game play
         * @param {string} id - Game ID
         */
        recordPlay: function(id) {
            const game = this.getGame(id);
            
            if (game) {
                this.updateGame(id, {
                    plays: game.plays + 1
                });
            }
            
            // Update recently played in localStorage
            try {
                let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
                
                // Add this game if not already in the list
                const gameData = {
                    id: game.id,
                    name: game.name,
                    image: game.thumbnailUrl,
                    category: game.category,
                    categoryColor: game.categoryColor,
                    rating: game.rating
                };
                
                // Remove if already exists
                recentlyPlayed = recentlyPlayed.filter(g => g.id !== game.id);
                
                // Add to beginning of array
                recentlyPlayed.unshift(gameData);
                
                // Keep only the 6 most recent
                recentlyPlayed = recentlyPlayed.slice(0, 6);
                
                // Save back to localStorage
                localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
            } catch (e) {
                console.error('Error updating recently played games:', e);
            }
        },
        
        /**
         * Get recently played games
         * @returns {Array} - Recently played games
         */
        getRecentlyPlayed: function() {
            try {
                return JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
            } catch (e) {
                console.error('Error getting recently played games:', e);
                return [];
            }
        },
        
        /**
         * Add sample games (for demo purposes)
         */
        addSampleGames: function() {
            const sampleGames = [
                {
                    name: "Monster Survivors",
                    description: "Monster Survivors is an action-packed survival game where you must navigate a hostile world filled with endless waves of monsters. Use your skills and strategy to survive as long as possible while upgrading your character. The longer you survive, the stronger the monsters become, making each game session a truly challenging experience that tests your reflexes and tactical thinking.",
                    shortDescription: "Survive waves of monsters in this thrilling action game",
                    category: "Action",
                    categoryColor: "apple-orange",
                    iframeUrl: "https://cloud.onlinegames.io/games/2025/unity/monster-survivors/index-og.html",
                    thumbnailUrl: "https://placehold.co/600x400/FF9500/FFFFFF?text=Monster+Survivors",
                    rating: 4.8,
                    plays: 24500,
                    dateAdded: new Date("2024-05-15"),
                    featured: true,
                    popular: true,
                    new: false,
                    controls: [
                        { key: "WASD", action: "Move your character" },
                        { key: "Auto", action: "Auto-attack nearest enemies" },
                        { key: "Space", action: "Special ability (when available)" },
                        { key: "P", action: "Pause game" }
                    ],
                    highlights: [
                        "Endless Gameplay: No two gaming sessions are the same with procedurally generated levels and enemy spawns.",
                        "Character Progression: Level up your character and choose from various upgrades to create different builds.",
                        "Enemy Variety: Face different types of monsters, each with unique behaviors and attack patterns.",
                        "Power-ups: Collect special power-ups that provide temporary boosts to your abilities.",
                        "Progressive Difficulty: The game gets progressively harder the longer you survive, challenging even the most skilled players."
                    ],
                    howToPlay: [
                        "Use WASD or arrow keys to move your character around the map",
                        "Your character will automatically attack nearby enemies",
                        "Collect experience orbs dropped by defeated enemies",
                        "Level up and choose upgrades to enhance your character",
                        "Avoid getting surrounded by monsters",
                        "Survive as long as possible!"
                    ],
                    tips: [
                        "Keep moving to avoid being surrounded by enemies",
                        "Focus on upgrades that complement each other for synergy",
                        "Balance offensive and defensive upgrades",
                        "Prioritize movement speed early in the game",
                        "Look for patterns in enemy spawns and movements"
                    ],
                    related: ["zombie-shooter", "dungeon-crawler", "alien-invasion"]
                },
                // Add more sample games here
            ];
            
            return this.batchImport(sampleGames);
        }
    };
})();

// Initialize game manager when document is ready
document.addEventListener('DOMContentLoaded', function() {
    GameManager.init();
    
    // Check if there are any games, if not add sample games
    if (GameManager.getGames().length === 0) {
        GameManager.addSampleGames();
        console.log('Sample games added');
    }
}); 