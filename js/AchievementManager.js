/**
 * @fileoverview Verwaltung aller Achievements und deren Bedingungen
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * @typedef {Object} Achievement
 * @property {string} id - Eindeutige Kennung des Achievements
 * @property {string} name - Anzeigename des Achievements
 * @property {string} description - Beschreibung des Achievements
 * @property {Function} condition - Prüffunktion für das Achievement
 * @property {string} icon - Pfad zum Achievement-Icon
 * @property {number} reward - Belohnung für das Achievement
 * @property {boolean} hidden - Ob das Achievement versteckt ist
 * @property {string} category - Kategorie des Achievements
 */

export class AchievementManager {
    constructor() {
        /** @type {Map<string, Achievement>} */
        this.achievements = new Map();
        /** @type {Set<string>} */
        this.unlockedAchievements = new Set();
        /** @type {Function[]} */
        this.listeners = [];
        
        this.initializeAchievements();
    }

    /**
     * Initialisiert alle verfügbaren Achievements
     */
    initializeAchievements() {
        // Ressourcen-Achievements
        this.addAchievement({
            id: 'woodCollector',
            name: 'Holzsammler',
            description: 'Sammle insgesamt 1.000 Holz',
            condition: (gameState) => 
                gameState.resourceManager.resources.get('holz').amount >= 1000,
            icon: 'icons/wood.png',
            reward: 100,
            hidden: false,
            category: 'resources'
        });

        this.addAchievement({
            id: 'stoneMaster',
            name: 'Steinmeister',
            description: 'Sammle insgesamt 500 Stein',
            condition: (gameState) => 
                gameState.resourceManager.resources.get('stein').amount >= 500,
            icon: 'icons/stone.png',
            reward: 150,
            hidden: false,
            category: 'resources'
        });

        // Produktions-Achievements
        this.addAchievement({
            id: 'efficientProducer',
            name: 'Effizienter Produzent',
            description: 'Erreiche eine Gesamtproduktionsrate von 50/s',
            condition: (gameState) => {
                const totalRate = this.calculateTotalProductionRate(gameState);
                return totalRate >= 50;
            },
            icon: 'icons/production.png',
            reward: 200,
            hidden: false,
            category: 'production'
        });

        // Upgrade-Achievements
        this.addAchievement({
            id: 'upgrademaster',
            name: 'Upgrade-Meister',
            description: 'Kaufe insgesamt 10 Upgrades',
            condition: (gameState) => {
                const totalUpgrades = this.calculateTotalUpgrades(gameState);
                return totalUpgrades >= 10;
            },
            icon: 'icons/upgrade.png',
            reward: 300,
            hidden: false,
            category: 'upgrades'
        });

        // Versteckte Achievements
        this.addAchievement({
            id: 'hiddenMaster',
            name: '???',
            description: 'Ein geheimnisvolles Achievement',
            condition: (gameState) => {
                return this.checkSecretCondition(gameState);
            },
            icon: 'icons/secret.png',
            reward: 500,
            hidden: true,
            category: 'secret'
        });
    }

    /**
     * Fügt ein neues Achievement hinzu
     * @param {Achievement} achievementData - Achievement-Daten
     */
    addAchievement(achievementData) {
        this.achievements.set(achievementData.id, {
            ...achievementData,
            unlocked: false,
            progress: 0
        });
    }

    /**
     * Prüft alle Achievement-Bedingungen
     * @param {GameState} gameState - Referenz zum GameState
     */
    checkAchievements(gameState) {
        for (const [id, achievement] of this.achievements) {
            if (!this.unlockedAchievements.has(id) && achievement.condition(gameState)) {
                this.unlockAchievement(id, gameState);
            }
            this.updateAchievementProgress(id, gameState);
        }
    }

    /**
     * Schaltet ein Achievement frei
     * @param {string} achievementId - ID des Achievements
     * @param {GameState} gameState - Referenz zum GameState
     */
    unlockAchievement(achievementId, gameState) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.unlockedAchievements.has(achievementId)) return;

        this.unlockedAchievements.add(achievementId);
        
        // Belohnung anwenden
        if (achievement.reward) {
            gameState.addReward(achievement.reward);
        }

        // Benachrichtige Listener
        this.notifyListeners({
            type: 'achievement_unlocked',
            achievementId: achievementId,
            achievement: achievement
        });
    }

    /**
     * Aktualisiert den Fortschritt eines Achievements
     * @param {string} achievementId - ID des Achievements
     * @param {GameState} gameState - Referenz zum GameState
     */
    updateAchievementProgress(achievementId, gameState) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.unlockedAchievements.has(achievementId)) return;

        const progress = this.calculateProgress(achievement, gameState);
        if (progress !== achievement.progress) {
            achievement.progress = progress;
            this.notifyListeners({
                type: 'achievement_progress',
                achievementId: achievementId,
                progress: progress
            });
        }
    }

    /**
     * Berechnet den Fortschritt eines Achievements
     * @param {Achievement} achievement - Achievement-Objekt
     * @param {GameState} gameState - Referenz zum GameState
     * @returns {number} Fortschritt zwischen 0 und 1
     */
    calculateProgress(achievement, gameState) {
        // Implementiere spezifische Fortschrittsberechnungen je nach Achievement-Typ
        switch (achievement.category) {
            case 'resources':
                return this.calculateResourceProgress(achievement, gameState);
            case 'production':
                return this.calculateProductionProgress(achievement, gameState);
            case 'upgrades':
                return this.calculateUpgradeProgress(achievement, gameState);
            default:
                return 0;
        }
    }

    /**
     * Berechnet die Gesamtproduktionsrate
     * @param {GameState} gameState - Referenz zum GameState
     * @returns {number}
     */
    calculateTotalProductionRate(gameState) {
        let total = 0;
        for (const resource of gameState.resourceManager.resources.values()) {
            total += resource.baseProduction * resource.multiplier;
        }
        return total;
    }

    /**
     * Berechnet die Gesamtzahl der Upgrades
     * @param {GameState} gameState - Referenz zum GameState
     * @returns {number}
     */
    calculateTotalUpgrades(gameState) {
        let total = 0;
        for (const upgrade of gameState.upgradeManager.upgrades.values()) {
            total += upgrade.level;
        }
        return total;
    }

    /**
     * Prüft geheime Achievement-Bedingungen
     * @param {GameState} gameState - Referenz zum GameState
     * @returns {boolean}
     */
    checkSecretCondition(gameState) {
        // Implementiere hier spezielle Bedingungen für versteckte Achievements
        return false;
    }

    /**
     * Fügt einen Achievement-Listener hinzu
     * @param {Function} listener - Callback-Funktion
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Benachrichtigt alle Listener über Änderungen
     * @param {Object} event - Event-Objekt
     */
    notifyListeners(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    /**
     * Gibt den serialisierbaren Zustand zurück
     * @returns {Object}
     */
    getSerializableState() {
        return {
            unlockedAchievements: Array.from(this.unlockedAchievements),
            achievementProgress: Array.from(this.achievements.entries()).reduce((acc, [id, achievement]) => {
                acc[id] = achievement.progress;
                return acc;
            }, {})
        };
    }

    /**
     * Lädt einen gespeicherten Zustand
     * @param {Object} state - Gespeicherter Zustand
     */
    loadState(state) {
        this.unlockedAchievements = new Set(state.unlockedAchievements);
        
        if (state.achievementProgress) {
            for (const [id, progress] of Object.entries(state.achievementProgress)) {
                const achievement = this.achievements.get(id);
                if (achievement) {
                    achievement.progress = progress;
                }
            }
        }
    }

    /**
     * Gibt alle freigeschalteten Achievements zurück
     * @returns {Achievement[]}
     */
    getUnlockedAchievements() {
        return Array.from(this.unlockedAchievements).map(id => this.achievements.get(id));
    }

    /**
     * Gibt alle sichtbaren Achievements zurück
     * @returns {Achievement[]}
     */
    getVisibleAchievements() {
        return Array.from(this.achievements.values()).filter(
            achievement => !achievement.hidden || this.unlockedAchievements.has(achievement.id)
        );
    }
}
