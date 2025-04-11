/**
 * @fileoverview Verwaltung aller Ressourcen und deren Produktionslogik
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';
import { calculateCompoundInterest } from '../utils/mathUtils.js';

/**
 * @typedef {Object} Resource
 * @property {string} id - Eindeutige Kennung der Ressource
 * @property {string} name - Anzeigename der Ressource
 * @property {number} amount - Aktuelle Menge
 * @property {number} baseProduction - Basis-Produktionsrate pro Sekunde
 * @property {number} level - Aktuelles Level der Ressource
 * @property {number} upgradeCost - Kosten für das nächste Upgrade
 * @property {string[]} requirements - IDs der benötigten Ressourcen
 */

export class ResourceManager {
    constructor() {
        /** @type {Map<string, Resource>} */
        this.resources = new Map();
        this.initializeBaseResources();
    }

    /**
     * Initialisiert die Grundressourcen des Spiels
     */
    initializeBaseResources() {
        // Primäre Ressourcen
        this.addResource({
            id: 'holz',
            name: 'Holz',
            amount: 0,
            baseProduction: 1,
            level: 1,
            upgradeCost: 10,
            requirements: []
        });

        this.addResource({
            id: 'stein',
            name: 'Stein',
            amount: 0,
            baseProduction: 0.8,
            level: 1,
            upgradeCost: 15,
            requirements: []
        });

        // Sekundäre Ressourcen
        this.addResource({
            id: 'werkzeug',
            name: 'Werkzeug',
            amount: 0,
            baseProduction: 0.3,
            level: 0,
            upgradeCost: 25,
            requirements: ['holz', 'stein']
        });

        // Fortgeschrittene Ressourcen
        this.addResource({
            id: 'gebaeude',
            name: 'Gebäude',
            amount: 0,
            baseProduction: 0.1,
            level: 0,
            upgradeCost: 50,
            requirements: ['werkzeug', 'stein']
        });
    }

    /**
     * Fügt eine neue Ressource hinzu
     * @param {Resource} resourceData - Ressourcendaten
     */
    addResource(resourceData) {
        this.resources.set(resourceData.id, {
            ...resourceData,
            multiplier: 1,
            bonusProduction: 0
        });
    }

    /**
     * Aktualisiert alle Ressourcen
     * @param {number} deltaTime - Vergangene Zeit seit letztem Update in Sekunden
     * @param {number} globalMultiplier - Globaler Produktionsmultiplikator
     */
    update(deltaTime, globalMultiplier) {
        // Erste Phase: Berechne verfügbare Produktion
        const productionRates = new Map();
        
        for (const [id, resource] of this.resources) {
            if (this.canProduce(resource)) {
                const rate = this.calculateProductionRate(resource, globalMultiplier);
                productionRates.set(id, rate * deltaTime);
            }
        }

        // Zweite Phase: Wende Produktion an
        for (const [id, production] of productionRates) {
            const resource = this.resources.get(id);
            resource.amount += production;
            
            // Runde auf 2 Dezimalstellen
            resource.amount = Math.round(resource.amount * 100) / 100;
        }

        this.checkResourceCaps();
    }

    /**
     * Prüft, ob eine Ressource produziert werden kann
     * @param {Resource} resource - Zu prüfende Ressource
     * @returns {boolean}
     */
    canProduce(resource) {
        if (resource.requirements.length === 0) return true;

        return resource.requirements.every(reqId => {
            const requiredResource = this.resources.get(reqId);
            return requiredResource && requiredResource.amount >= GAME_CONFIG.PRODUCTION_THRESHOLD;
        });
    }

    /**
     * Berechnet die aktuelle Produktionsrate einer Ressource
     * @param {Resource} resource - Ressource
     * @param {number} globalMultiplier - Globaler Produktionsmultiplikator
     * @returns {number}
     */
    calculateProductionRate(resource, globalMultiplier) {
        const baseRate = resource.baseProduction * resource.level;
        const multiplier = resource.multiplier * globalMultiplier;
        const bonus = resource.bonusProduction;

        return (baseRate * multiplier) + bonus;
    }

    /**
     * Prüft und korrigiert Ressourcenlimits
     * @private
     */
    checkResourceCaps() {
        for (const resource of this.resources.values()) {
            const cap = this.calculateResourceCap(resource);
            if (resource.amount > cap) {
                resource.amount = cap;
            }
        }
    }

    /**
     * Berechnet das Limit einer Ressource
     * @param {Resource} resource - Ressource
     * @returns {number}
     */
    calculateResourceCap(resource) {
        return GAME_CONFIG.BASE_RESOURCE_CAP * Math.pow(
            GAME_CONFIG.CAP_GROWTH_FACTOR,
            resource.level - 1
        );
    }

    /**
     * Verbessert eine Ressource
     * @param {string} resourceId - ID der zu verbessernden Ressource
     * @returns {boolean} Erfolg des Upgrades
     */
    upgradeResource(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) return false;

        if (resource.amount >= resource.upgradeCost) {
            resource.amount -= resource.upgradeCost;
            resource.level++;
            resource.upgradeCost = Math.floor(
                resource.upgradeCost * GAME_CONFIG.UPGRADE_COST_MULTIPLIER
            );
            return true;
        }
        return false;
    }

    /**
     * Gibt den serialisierbaren Zustand zurück
     * @returns {Object}
     */
    getSerializableState() {
        const state = {};
        for (const [id, resource] of this.resources) {
            state[id] = {
                amount: resource.amount,
                level: resource.level,
                upgradeCost: resource.upgradeCost,
                multiplier: resource.multiplier,
                bonusProduction: resource.bonusProduction
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
            const resource = this.resources.get(id);
            if (resource) {
                Object.assign(resource, savedData);
            }
        }
    }

    /**
     * Setzt alle Ressourcen zurück (für Prestige)
     */
    reset() {
        for (const resource of this.resources.values()) {
            resource.amount = 0;
            resource.level = resource.id === 'holz' || resource.id === 'stein' ? 1 : 0;
            resource.upgradeCost = this.getBaseUpgradeCost(resource.id);
            resource.multiplier = 1;
            resource.bonusProduction = 0;
        }
    }

    /**
     * Ermittelt die Basis-Upgradekosten einer Ressource
     * @param {string} resourceId - ID der Ressource
     * @returns {number}
     * @private
     */
    getBaseUpgradeCost(resourceId) {
        const baseCosts = {
            'holz': 10,
            'stein': 15,
            'werkzeug': 25,
            'gebaeude': 50
        };
        return baseCosts[resourceId] || 10;
    }

    /**
     * Berechnet die Gesamtmenge aller Ressourcen
     * @returns {number}
     */
    getTotalResources() {
        let total = 0;
        for (const resource of this.resources.values()) {
            total += resource.amount;
        }
        return total;
    }
}
