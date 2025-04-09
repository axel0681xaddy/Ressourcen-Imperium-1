/**
 * @fileoverview Verwaltung aller Upgrades und deren Effekte im Spiel
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * @typedef {Object} Upgrade
 * @property {string} id - Eindeutige Kennung des Upgrades
 * @property {string} name - Anzeigename des Upgrades
 * @property {string} description - Beschreibung des Upgrade-Effekts
 * @property {number} cost - Aktuelle Kosten des Upgrades
 * @property {string} resourceType - Ressourcentyp für die Kosten
 * @property {number} level - Aktuelles Level des Upgrades
 * @property {Function} effect - Funktion die den Upgrade-Effekt anwendet
 * @property {Object} requirements - Voraussetzungen für das Upgrade
 */

export class UpgradeManager {
    constructor() {
        /** @type {Map<string, Upgrade>} */
        this.upgrades = new Map();
        /** @type {Map<string, Upgrade>} */
        this.availableUpgrades = new Map();
        this.initializeUpgrades();
    }

    /**
     * Initialisiert alle verfügbaren Upgrades
     */
    initializeUpgrades() {
        // Produktionsverbesserungen
        this.addUpgrade({
            id: 'betterTools',
            name: 'Bessere Werkzeuge',
            description: 'Erhöht die Holzproduktion um 25%',
            cost: 50,
            resourceType: 'holz',
            level: 0,
            maxLevel: 5,
            effect: (gameState) => {
                const resource = gameState.resourceManager.resources.get('holz');
                resource.multiplier *= 1.25;
            },
            requirements: {
                resources: { holz: 25 }
            }
        });

        this.addUpgrade({
            id: 'improvedMining',
            name: 'Verbesserter Bergbau',
            description: 'Erhöht die Steinproduktion um 30%',
            cost: 75,
            resourceType: 'stein',
            level: 0,
            maxLevel: 5,
            effect: (gameState) => {
                const resource = gameState.resourceManager.resources.get('stein');
                resource.multiplier *= 1.3;
            },
            requirements: {
                resources: { stein: 40 }
            }
        });

        // Effizienzverbesserungen
        this.addUpgrade({
            id: 'efficientCrafting',
            name: 'Effizientes Handwerk',
            description: 'Reduziert den Ressourcenverbrauch bei der Werkzeugherstellung um 15%',
            cost: 100,
            resourceType: 'werkzeug',
            level: 0,
            maxLevel: 3,
            effect: (gameState) => {
                gameState.craftingEfficiency *= 0.85;
            },
            requirements: {
                resources: { werkzeug: 20 },
                upgrades: { betterTools: 2 }
            }
        });

        // Spezialverbesserungen
        this.addUpgrade({
            id: 'automatedProduction',
            name: 'Automatisierte Produktion',
            description: 'Fügt einen automatischen Produktionsbonus hinzu',
            cost: 200,
            resourceType: 'gebaeude',
            level: 0,
            maxLevel: 1,
            effect: (gameState) => {
                for (const resource of gameState.resourceManager.resources.values()) {
                    resource.bonusProduction += resource.baseProduction * 0.1;
                }
            },
            requirements: {
                resources: { gebaeude: 5 },
                upgrades: { efficientCrafting: 1 }
            }
        });
    }

    /**
     * Fügt ein neues Upgrade hinzu
     * @param {Upgrade} upgradeData - Upgrade-Daten
     */
    addUpgrade(upgradeData) {
        this.upgrades.set(upgradeData.id, {
            ...upgradeData,
            isAvailable: false,
            calculateCost: () => this.calculateUpgradeCost(upgradeData)
        });
    }

    /**
     * Aktualisiert die Verfügbarkeit aller Upgrades
     * @param {ResourceManager} resourceManager - Referenz zum ResourceManager
     */
    updateAvailability(resourceManager) {
        this.availableUpgrades.clear();

        for (const [id, upgrade] of this.upgrades) {
            if (this.checkUpgradeAvailability(upgrade, resourceManager)) {
                this.availableUpgrades.set(id, upgrade);
            }
        }
    }

    /**
     * Prüft ob ein Upgrade verfügbar ist
     * @param {Upgrade} upgrade - Zu prüfendes Upgrade
     * @param {ResourceManager} resourceManager - Referenz zum ResourceManager
     * @returns {boolean}
     */
    checkUpgradeAvailability(upgrade, resourceManager) {
        if (upgrade.level >= upgrade.maxLevel) return false;

        // Prüfe Ressourcenanforderungen
        for (const [resourceId, amount] of Object.entries(upgrade.requirements.resources)) {
            const resource = resourceManager.resources.get(resourceId);
            if (!resource || resource.amount < amount) return false;
        }

        // Prüfe Upgrade-Anforderungen
        if (upgrade.requirements.upgrades) {
            for (const [upgradeId, level] of Object.entries(upgrade.requirements.upgrades)) {
                const requiredUpgrade = this.upgrades.get(upgradeId);
                if (!requiredUpgrade || requiredUpgrade.level < level) return false;
            }
        }

        return true;
    }

    /**
     * Kauft und wendet ein Upgrade an
     * @param {string} upgradeId - ID des zu kaufenden Upgrades
     * @param {GameState} gameState - Referenz zum GameState
     * @returns {boolean} Erfolg des Kaufs
     */
    purchaseUpgrade(upgradeId, gameState) {
        const upgrade = this.upgrades.get(upgradeId);
        if (!upgrade || !this.availableUpgrades.has(upgradeId)) return false;

        const resource = gameState.resourceManager.resources.get(upgrade.resourceType);
        const cost = upgrade.calculateCost();

        if (resource.amount >= cost) {
            resource.amount -= cost;
            upgrade.level++;
            upgrade.effect(gameState);
            
            // Aktualisiere Verfügbarkeit nach dem Kauf
            this.updateAvailability(gameState.resourceManager);
            return true;
        }

        return false;
    }

    /**
     * Berechnet die Kosten für ein Upgrade
     * @param {Upgrade} upgrade - Upgrade-Objekt
     * @returns {number}
     */
    calculateUpgradeCost(upgrade) {
        return Math.floor(
            upgrade.cost * Math.pow(GAME_CONFIG.UPGRADE_COST_MULTIPLIER, upgrade.level)
        );
    }

    /**
     * Gibt den serialisierbaren Zustand zurück
     * @returns {Object}
     */
    getSerializableState() {
        const state = {};
        for (const [id, upgrade] of this.upgrades) {
            state[id] = {
                level: upgrade.level
            };
        }
        return state;
    }

    /**
     * Lädt einen gespeicherten Zustand
     * @param {Object} state - Gespeicherter Zustand
     */
    loadState(state) {
        for (const [id, savedData] of Object.entries(state)) {
            const upgrade = this.upgrades.get(id);
            if (upgrade) {
                upgrade.level = savedData.level;
            }
        }
    }

    /**
     * Setzt alle Upgrades zurück (für Prestige)
     */
    reset() {
        for (const upgrade of this.upgrades.values()) {
            upgrade.level = 0;
        }
        this.availableUpgrades.clear();
    }

    /**
     * Gibt alle aktiven Upgrade-Effekte zurück
     * @returns {Object}
     */
    getActiveEffects() {
        const effects = {};
        for (const upgrade of this.upgrades.values()) {
            if (upgrade.level > 0) {
                effects[upgrade.id] = {
                    name: upgrade.name,
                    level: upgrade.level,
                    description: upgrade.description
                };
            }
        }
        return effects;
    }
}
