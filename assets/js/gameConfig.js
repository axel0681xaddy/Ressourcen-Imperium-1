export const GAME_CONFIG = {
    // Grundlegende Spieleinstellungen
    VERSION: '1.0.0',
    TICK_RATE: 60, // Aktualisierungen pro Sekunde
    SAVE_INTERVAL: 60000, // Automatisches Speichern (ms)
    MAX_OFFLINE_TIME: 72 * 60 * 60 * 1000, // Maximale Offline-Zeit (72 Stunden)

    // Startzustand des Spiels
    INITIAL_STATE: {
        buildings: {
            WOODCUTTER: 1,  // Spieler startet mit einem Holzfäller
            QUARRY: 0
        },
        resources: {
            WOOD: 0,
            STONE: 0
        }
    },

    // Ressourcen-Definitionen
    RESOURCES: {
        WOOD: {
            name: 'Holz',
            baseProduction: 1.0,
            baseStorage: 100,    // Basis-Speicherlimit
            description: 'Ein grundlegender Rohstoff für den Bau von Gebäuden',
            icon: '🌳'
        },
        STONE: {
            name: 'Stein',
            baseProduction: 0.8,
            baseStorage: 50,     // Basis-Speicherlimit
            description: 'Wird für fortgeschrittene Gebäude benötigt',
            icon: '🪨'
        }
    },

    // Gebäude-Definitionen
    BUILDINGS: {
        WOODCUTTER: {
            name: 'Holzfäller',
            description: 'Produziert automatisch Holz',
            baseCost: {
                WOOD: 10
            },
            costMultiplier: 1.15,
            production: {
                WOOD: 0.5
            },
            maxLevel: 100,
            icon: '🪓'
        },
        QUARRY: {
            name: 'Steinbruch',
            description: 'Produziert automatisch Stein',
            baseCost: {
                WOOD: 50  
            },
            costMultiplier: 1.2,
            production: {
                STONE: 0.3
            },
            maxLevel: 100,
            icon: '⛏️'
        }
    },

    // Verbesserungen
    UPGRADES: {
        BETTER_TOOLS: {
            name: 'Bessere Werkzeuge',
            description: 'Erhöht die Produktion aller Ressourcen um 50%',
            cost: {
                WOOD: 100,
                STONE: 50
            },
            effect: {
                type: 'PRODUCTION_MULTIPLIER',
                value: 1.5,
                affects: ['WOOD', 'STONE']
            },
            requirements: {
                buildings: {
                    WOODCUTTER: 5,
                    QUARRY: 3
                }
            },
            icon: '🛠️'
        },
        LARGER_STORAGE: {
            name: 'Größerer Speicher',
            description: 'Verdoppelt die Speicherkapazität aller Ressourcen',
            cost: {
                WOOD: 90,
                STONE: 50
            },
            effect: {
                type: 'STORAGE_MULTIPLIER',
                value: 2.0,
                affects: ['WOOD', 'STONE']
            },
            requirements: {
                buildings: {
                    WOODCUTTER: 8,
                    QUARRY: 5
                }
            },
            icon: '📦'
        }
    },

    // Erfolge
    ACHIEVEMENTS: {
        WOOD_COLLECTOR: {
            name: 'Holzsammler',
            description: 'Sammle insgesamt 1000 Holz',
            requirement: {
                type: 'TOTAL_RESOURCE',
                resource: 'WOOD',
                amount: 1000
            },
            reward: {
                type: 'PRODUCTION_BOOST',
                resource: 'WOOD',
                value: 1.1
            },
            icon: '🎯'
        },
        STONE_MASTER: {
            name: 'Steinmeister',
            description: 'Erreiche 10 Steinbrüche',
            requirement: {
                type: 'BUILDING_LEVEL',
                building: 'QUARRY',
                level: 10
            },
            reward: {
                type: 'PRODUCTION_BOOST',
                resource: 'STONE',
                value: 1.2
            },
            icon: '🏆'
        }
    },

    // Spielbalance
    BALANCE: {
        // Produktionseinstellungen
        PRODUCTION_TICK_INTERVAL: 100, // ms
        OFFLINE_PRODUCTION_RATE: 0.5,
        MAX_STORAGE_MULTIPLIER: 2.0,
        CRITICAL_STORAGE_THRESHOLD: 0.9, // 90% voll = kritisch

        // Kosteneinstellungen
        COST_MULTIPLIER: 1.15,
        MAX_COST_MULTIPLIER: 1000000,

        // Erfahrungssystem
        XP_PER_RESOURCE: 1,
        XP_PER_BUILDING: 10,
        LEVEL_XP_REQUIREMENT: level => Math.floor(100 * Math.pow(1.5, level))
    },

    // UI-Einstellungen
    UI: {
        UPDATE_INTERVAL: 100, // ms
        NOTIFICATION_DURATION: 3000, // ms
        RESOURCE_FORMAT_PRECISION: 1,
        LARGE_NUMBER_THRESHOLD: 1000000,

        // Farben
        COLORS: {
            PRIMARY: '#4CAF50',
            SECONDARY: '#2196F3',
            WARNING: '#FFC107',
            ERROR: '#F44336',
            SUCCESS: '#4CAF50'
        },

        // Animationen
        ANIMATIONS: {
            RESOURCE_GAIN: {
                DURATION: 1000,
                DISTANCE: 50
            },
            UPGRADE_FLASH: {
                DURATION: 500
            }
        }
    },

    // Sound-Einstellungen
    SOUND: {
        ENABLED: true,
        VOLUME: 0.5,
        EFFECTS: {
            CLICK: 'click.mp3',
            UPGRADE: 'upgrade.mp3',
            ACHIEVEMENT: 'achievement.mp3',
            ERROR: 'error.mp3'
        }
    },

    // Speichereinstellungen
    STORAGE: {
        AUTO_SAVE_INTERVAL: 60000, // ms
        SAVE_KEY: 'resourceEmpireGame',
        VERSION_KEY: 'resourceEmpireVersion'
    },

    // Debug-Einstellungen
    DEBUG: {
        ENABLED: false,
        LOG_PRODUCTION: false,
        LOG_SAVES: false,
        SHOW_DETAILED_STATS: false,
        FAST_FORWARD_MULTIPLIER: 10
    }
};

// Abgeleitete Konstanten
export const DERIVED_CONFIG = {
    TOTAL_BUILDINGS: Object.keys(GAME_CONFIG.BUILDINGS).length,
    TOTAL_UPGRADES: Object.keys(GAME_CONFIG.UPGRADES).length,
    TOTAL_ACHIEVEMENTS: Object.keys(GAME_CONFIG.ACHIEVEMENTS).length,
    MAX_RESOURCES: Object.fromEntries(
        Object.entries(GAME_CONFIG.RESOURCES).map(([key, value]) => [
            key,
            value.baseStorage
        ])
    )
};

// Exportiere beide Konfigurationen
export default {
    ...GAME_CONFIG,
    DERIVED: DERIVED_CONFIG
};
