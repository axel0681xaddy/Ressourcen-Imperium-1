/**
 * @fileoverview Hauptspielzustand und Logik für das Ressourcen-Imperium
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';
import { ResourceManager } from './ResourceManager.js';
import { UpgradeManager } from './UpgradeManager.js';
import { AchievementManager } from './AchievementManager.js';
import { SaveManager } from '../utils/SaveManager.js';

/**
 * Hauptklasse zur Verwaltung des Spielzustands
 */
export class GameState {
    /**
     * Initialisiert einen neuen Spielzustand
     * @param {Object} savedState - Optional: Gespeicherter Spielstand
     */
    constructor(savedState = null) {
        this.resourceManager = new ResourceManager();
        this.upgradeManager = new UpgradeManager();
        this.achievementManager = new AchievementManager();
        this.saveManager = new SaveManager();
        
        this.lastUpdate = Date.now();
        this.isRunning = false;
        this.observers = new Set();

        // Lade gespeicherten Zustand oder initialisiere neu
        if (savedState) {
            this.loadState(savedState);
        } else {
            this.initializeNewGame();
        }
    }

    /**
     * Initialisiert ein neues Spiel mit Standardwerten
     * @private
     */
    initializeNewGame() {
        this.totalPlayTime = 0;
        this.prestigeLevel = 0;
        this.multiplier = GAME_CONFIG.BASE_PRODUCTION_RATE;
        
        // Initialisiere Grundressourcen
        this.resourceManager.initializeBaseResources();
        
        // Setze Startupgrades
        this.upgradeManager.initializeStarterUpgrades();
    }

    /**
     * Startet die Spielschleife
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastUpdate = Date.now();
            this.gameLoop();
        }
    }

    /**
     * Pausiert das Spiel
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Hauptspielschleife
     * @private
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdate) / 1000; // Konvertiere zu Sekunden
        this.lastUpdate = currentTime;

        this.update(deltaTime);
        this.notifyObservers();

        // Automatisches Speichern alle 60 Sekunden
        this.totalPlayTime += deltaTime;
        if (this.totalPlayTime % 60 < deltaTime) {
            this.saveGame();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Aktualisiert den Spielzustand
     * @param {number} deltaTime - Vergangene Zeit seit dem letzten Update in Sekunden
     * @private
     */
    update(deltaTime) {
        // Aktualisiere Ressourcenproduktion
        this.resourceManager.update(deltaTime, this.multiplier);
        
        // Prüfe Achievements
        this.achievementManager.checkAchievements(this);
        
        // Aktualisiere Upgrade-Verfügbarkeit
        this.upgradeManager.updateAvailability(this.resourceManager);
    }

    /**
     * Fügt einen Observer für Spielzustandsänderungen hinzu
     * @param {Object} observer - Observer mit update()-Methode
     */
    addObserver(observer) {
        this.observers.add(observer);
    }

    /**
     * Entfernt einen Observer
     * @param {Object} observer - Zu entfernender Observer
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Benachrichtigt alle Observer über Änderungen
     * @private
     */
    notifyObservers() {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    /**
     * Speichert den aktuellen Spielzustand
     */
    saveGame() {
        const gameState = {
            resources: this.resourceManager.getSerializableState(),
            upgrades: this.upgradeManager.getSerializableState(),
            achievements: this.achievementManager.getSerializableState(),
            totalPlayTime: this.totalPlayTime,
            prestigeLevel: this.prestigeLevel,
            multiplier: this.multiplier
        };

        this.saveManager.saveGame(gameState);
    }

    /**
     * Lädt einen gespeicherten Spielzustand
     * @param {Object} savedState - Gespeicherter Spielzustand
     */
    loadState(savedState) {
        try {
            this.resourceManager.loadState(savedState.resources);
            this.upgradeManager.loadState(savedState.upgrades);
            this.achievementManager.loadState(savedState.achievements);
            this.totalPlayTime = savedState.totalPlayTime || 0;
            this.prestigeLevel = savedState.prestigeLevel || 0;
            this.multiplier = savedState.multiplier || GAME_CONFIG.BASE_PRODUCTION_RATE;
        } catch (error) {
            console.error('Fehler beim Laden des Spielstands:', error);
            this.initializeNewGame();
        }
    }

    /**
     * Führt einen Prestige-Reset durch
     */
    prestige() {
        if (this.canPrestige()) {
            this.prestigeLevel++;
            this.multiplier *= GAME_CONFIG.PRESTIGE_MULTIPLIER;
            this.resourceManager.reset();
            this.upgradeManager.reset();
            this.saveGame();
            this.notifyObservers();
        }
    }

    /**
     * Prüft, ob ein Prestige-Reset möglich ist
     * @returns {boolean}
     */
    canPrestige() {
        return this.resourceManager.getTotalResources() >= 
               GAME_CONFIG.PRESTIGE_REQUIREMENTS.resources;
    }
}
