/**
 * @fileoverview Spielkonfiguration und Konstanten
 * @author Ressourcen-Imperium Team
 */

export const GAME_CONFIG = {
    // Spielversion
    GAME_VERSION: '1.0.0',
    DEBUG_MODE: false,

    // Grundeinstellungen
    TICK_RATE: 60, // Aktualisierungen pro Sekunde
    SAVE_INTERVAL: 60000, // Automatisches Speichern (in ms)
    UI_UPDATE_INTERVAL: 100, // UI-Aktualisierungsintervall (in ms)
    MAX_DELTA_TIME: 1.0, // Maximale Zeitdifferenz pro Tick (in Sekunden)

    // Ressourcen-Einstellungen
    BASE_PRODUCTION_RATE: 1.0,
    BASE_RESOURCE_CAP: 1000,
    CAP_GROWTH_FACTOR: 1.5,
    PRODUCTION_THRESHOLD: 10,
    RESOURCE_TYPES: {
        HOLZ: {
            name: 'Holz',
            baseProduction: 1.0,
            baseUpgradeCost: 10,
            icon: 'wood.png'
        },
        STEIN: {
            name: 'Stein',
            baseProduction: 0.8,
            baseUpgradeCost: 15,
            icon: 'stone.png'
        },
        WERKZEUG: {
            name: 'Werkzeug',
            baseProduction: 0.3,
            baseUpgradeCost: 25,
            icon: 'tools.png'
        },
        GEBAEUDE: {
            name: 'Gebäude',
            baseProduction: 0.1,
            baseUpgradeCost: 50,
            icon: 'building.png'
        }
    },

    // Upgrade-Einstellungen
    UPGRADE_COST_MULTIPLIER: 1.15,
    MAX_UPGRADE_LEVEL: 1000,
    UPGRADE_CATEGORIES: {
        PRODUCTION: 'production',
        EFFICIENCY: 'efficiency',
        AUTOMATION: 'automation',
        SPECIAL: 'special'
    },

    // Achievement-Einstellungen
    ACHIEVEMENT_CATEGORIES: {
        RESOURCES: 'resources',
        PRODUCTION: 'production',
        UPGRADES: 'upgrades',
        SPECIAL: 'special'
    },

    // Prestige-Einstellungen
    PRESTIGE_REQUIREMENTS: {
        MIN_RESOURCES: 1000000,
        MIN_PLAYTIME: 3600 // 1 Stunde in Sekunden
    },
    PRESTIGE_MULTIPLIER: 1.5,
    BASE_PRESTIGE_BONUS: 0.1,

    // Offline-Fortschritt
    OFFLINE_PROGRESS: {
        ENABLED: true,
        MAX_TIME: 172800, // 48 Stunden in Sekunden
        EFFICIENCY: 0.5, // 50% Effizienz im Offline-Modus
        MIN_TIME: 300 // Mindestzeit für Offline-Fortschritt (5 Minuten)
    },

    // UI-Einstellungen
    UI: {
        NOTIFICATION_DURATION: 3000,
        MAX_NOTIFICATIONS: 5,
        TOOLTIP_DELAY: 500,
        ANIMATION_DURATION: 200,
        RESOURCE_COLORS: {
            HOLZ: '#8B4513',
            STEIN: '#808080',
            WERKZEUG: '#4682B4',
            GEBAEUDE: '#DAA520'
        },
        THEME: {
            PRIMARY_COLOR: '#4CAF50',
            SECONDARY_COLOR: '#2196F3',
            BACKGROUND_COLOR: '#121212',
            TEXT_COLOR: '#FFFFFF',
            ERROR_COLOR: '#F44336',
            SUCCESS_COLOR: '#4CAF50',
            WARNING_COLOR: '#FFC107'
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

    // Partikeleffekt-Einstellungen
    PARTICLES: {
        ENABLED: true,
        MAX_PARTICLES: 50,
        LIFETIME: 1000,
        TYPES: {
            RESOURCE_GAIN: {
                COLOR: '#4CAF50',
                SCALE: 1.0,
                SPEED: 1.0
            },
            UPGRADE: {
                COLOR: '#2196F3',
                SCALE: 1.2,
                SPEED: 1.5
            },
            ACHIEVEMENT: {
                COLOR: '#FFC107',
                SCALE: 1.5,
                SPEED: 2.0
            }
        }
    },

    // Spielbalance-Einstellungen
    BALANCE: {
        INITIAL_RESOURCES: {
            HOLZ: 0,
            STEIN: 0,
            WERKZEUG: 0,
            GEBAEUDE: 0
        },
        RESOURCE_WEIGHTS: {
            HOLZ: 1.0,
            STEIN: 1.2,
            WERKZEUG: 1.5,
            GEBAEUDE: 2.0
        },
        UPGRADE_EFFECTS: {
            PRODUCTION_MULTIPLIER: 1.25,
            EFFICIENCY_MULTIPLIER: 1.15,
            AUTOMATION_MULTIPLIER: 1.1
        },
        ACHIEVEMENT_REWARDS: {
            SMALL: 100,
            MEDIUM: 500,
            LARGE: 1000
        }
    },

    // Performance-Einstellungen
    PERFORMANCE: {
        MAX_FPS: 60,
        BATCH_SIZE: 100,
        RENDER_DISTANCE: 1000,
        GARBAGE_COLLECTION_INTERVAL: 300000 // 5 Minuten
    },

    // Entwickler-Werkzeuge
    DEV_TOOLS: {
        ENABLED: false,
        LOG_LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
        SHOW_FPS: false,
        SHOW_PERFORMANCE_STATS: false,
        CHEAT_CODES: false
    }
};

// Validierung der Konfiguration
function validateConfig() {
    // Überprüfe kritische Werte
    if (GAME_CONFIG.TICK_RATE <= 0) throw new Error('TICK_RATE muss größer als 0 sein');
    if (GAME_CONFIG.SAVE_INTERVAL <= 0) throw new Error('SAVE_INTERVAL muss größer als 0 sein');
    if (GAME_CONFIG.BASE_PRODUCTION_RATE <= 0) throw new Error('BASE_PRODUCTION_RATE muss größer als 0 sein');
    
    // Überprüfe Ressourcen-Konfiguration
    for (const [key, resource] of Object.entries(GAME_CONFIG.RESOURCE_TYPES)) {
        if (resource.baseProduction <= 0) throw new Error(`Ungültige baseProduction für ${key}`);
        if (resource.baseUpgradeCost <= 0) throw new Error(`Ungültige baseUpgradeCost für ${key}`);
    }
}

// Führe Validierung durch
validateConfig();

// Exportiere gefrorenes Objekt um versehentliche Änderungen zu verhindern
Object.freeze(GAME_CONFIG);
