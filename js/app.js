/**
 * @fileoverview Hauptanwendungsdatei, die das Spiel initialisiert und verwaltet
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from './config/gameConfig.js';
import { GameLoop } from './core/gameLoop.js';
import { ResourceManager } from './managers/ResourceManager.js';
import { UpgradeManager } from './managers/UpgradeManager.js';
import { AchievementManager } from './managers/AchievementManager.js';
import { SaveManager } from './managers/SaveManager.js';
import { UIManager } from './managers/UIManager.js';

class Game {
    constructor() {
        this.isInitialized = false;
        this.lastUpdate = Date.now();
        this.totalPlayTime = 0;
        this.settings = this.loadSettings();

        // Initialisiere Manager
        this.initializeManagers();

        // Initialisiere UI
        this.uiManager = new UIManager(this);
        
        // Initialisiere Spielschleife
        this.gameLoop = new GameLoop(this);

        // Registriere Event-Listener
        this.setupEventListeners();
    }

    /**
     * Initialisiert alle Manager-Klassen
     * @private
     */
    initializeManagers() {
        this.saveManager = new SaveManager();
        this.resourceManager = new ResourceManager();
        this.upgradeManager = new UpgradeManager();
        this.achievementManager = new AchievementManager();

        // Lade gespeicherten Spielstand
        this.loadGame();
    }

    /**
     * Lädt die Spieleinstellungen
     * @returns {Object} Spieleinstellungen
     * @private
     */
    loadSettings() {
        const defaultSettings = {
            soundEnabled: true,
            particleEffects: true,
            autoSave: true,
            offlineProgress: true
        };

        try {
            const savedSettings = JSON.parse(localStorage.getItem('game_settings'));
            return { ...defaultSettings, ...savedSettings };
        } catch (error) {
            console.warn('Fehler beim Laden der Einstellungen:', error);
            return defaultSettings;
        }
    }

    /**
     * Richtet Event-Listener ein
     * @private
     */
    setupEventListeners() {
        // Fenster-Events
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
        window.addEventListener('focus', () => this.handleFocus());
        window.addEventListener('blur', () => this.handleBlur());

        // Tastatur-Events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // UI-Events
        document.getElementById('settings-button').addEventListener('click', 
            () => this.uiManager.toggleSettings());
        document.getElementById('save-button').addEventListener('click', 
            () => this.saveGame());

        // Entwickler-Tools
        if (GAME_CONFIG.DEV_TOOLS.ENABLED) {
            this.setupDevTools();
        }
    }

    /**
     * Startet das Spiel
     */
    start() {
        if (this.isInitialized) return;

        console.log('Starte Spiel...');

        // Prüfe auf Offline-Fortschritt
        this.checkOfflineProgress();

        // Starte Spielschleife
        this.gameLoop.start();

        // Starte Auto-Save Timer
        if (this.settings.autoSave) {
            this.startAutoSave();
        }

        this.isInitialized = true;
        console.log('Spiel erfolgreich gestartet');
    }

    /**
     * Aktualisiert den Spielzustand
     * @param {number} deltaTime - Vergangene Zeit seit letztem Update
     */
    update(deltaTime) {
        // Aktualisiere Spielzeit
        this.totalPlayTime += deltaTime;

        // Aktualisiere Manager
        this.resourceManager.update(deltaTime);
        this.upgradeManager.update(deltaTime);
        this.achievementManager.checkAchievements(this);

        // Aktualisiere UI
        this.uiManager.update();
    }

    /**
     * Speichert den Spielstand
     */
    saveGame() {
        const saveData = {
            timestamp: Date.now(),
            totalPlayTime: this.totalPlayTime,
            resources: this.resourceManager.getSerializableState(),
            upgrades: this.upgradeManager.getSerializableState(),
            achievements: this.achievementManager.getSerializableState(),
            settings: this.settings
        };

        try {
            this.saveManager.saveGame(saveData);
            this.uiManager.showNotification('Spiel erfolgreich gespeichert!', 'success');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            this.uiManager.showNotification('Fehler beim Speichern!', 'error');
        }
    }

    /**
     * Lädt einen Spielstand
     */
    loadGame() {
        try {
            const saveData = this.saveManager.loadGame();
            if (saveData) {
                this.totalPlayTime = saveData.totalPlayTime || 0;
                this.resourceManager.loadState(saveData.resources);
                this.upgradeManager.loadState(saveData.upgrades);
                this.achievementManager.loadState(saveData.achievements);
                this.settings = { ...this.settings, ...saveData.settings };
                
                this.uiManager.showNotification('Spielstand geladen!', 'success');
            }
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            this.uiManager.showNotification('Fehler beim Laden des Spielstands!', 'error');
        }
    }

    /**
     * Prüft und verarbeitet Offline-Fortschritt
     * @private
     */
    checkOfflineProgress() {
        if (!this.settings.offlineProgress) return;

        const lastUpdate = this.saveManager.getLastUpdateTime();
        if (!lastUpdate) return;

        const now = Date.now();
        const offlineTime = (now - lastUpdate) / 1000; // Konvertiere zu Sekunden

        if (offlineTime > GAME_CONFIG.OFFLINE_PROGRESS.MIN_TIME) {
            const cappedTime = Math.min(
                offlineTime,
                GAME_CONFIG.OFFLINE_PROGRESS.MAX_TIME
            );
            
            this.processOfflineProgress(cappedTime);
        }
    }

    /**
     * Verarbeitet Offline-Fortschritt
     * @param {number} time - Vergangene Zeit in Sekunden
     * @private
     */
    processOfflineProgress(time) {
        const efficiency = GAME_CONFIG.OFFLINE_PROGRESS.EFFICIENCY;
        const resources = this.resourceManager.calculateOfflineProduction(time, efficiency);

        this.uiManager.showOfflineProgress(resources, time);
    }

    /**
     * Startet den Auto-Save Timer
     * @private
     */
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, GAME_CONFIG.SAVE_INTERVAL);
    }

    /**
     * Behandelt das beforeunload Event
     * @private
     */
    handleBeforeUnload() {
        if (this.settings.autoSave) {
            this.saveGame();
        }
    }

    /**
     * Behandelt das focus Event
     * @private
     */
    handleFocus() {
        this.gameLoop.resume();
    }

    /**
     * Behandelt das blur Event
     * @private
     */
    handleBlur() {
        if (this.settings.autoSave) {
            this.saveGame();
        }
        this.gameLoop.pause();
    }

    /**
     * Behandelt Tastatureingaben
     * @param {KeyboardEvent} event - Tastatur-Event
     * @private
     */
    handleKeyPress(event) {
        // Implementiere Tastatur-Shortcuts
        switch (event.key) {
            case 's':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.saveGame();
                }
                break;
            // Weitere Shortcuts hier
        }
    }

    /**
     * Richtet Entwickler-Werkzeuge ein
     * @private
     */
    setupDevTools() {
        const devTools = document.getElementById('dev-tools');
        devTools.style.display = 'block';

        // FPS-Zähler
        if (GAME_CONFIG.DEV_TOOLS.SHOW_FPS) {
            this.gameLoop.setFpsUpdateHandler(fps => {
                document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
            });
        }

        // Performance-Statistiken
        if (GAME_CONFIG.DEV_TOOLS.SHOW_PERFORMANCE_STATS) {
            // Implementiere Performance-Monitoring
        }
    }
}

// Starte das Spiel wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
});
