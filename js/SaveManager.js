/**
 * @fileoverview Verwaltung des Spielstands und der Speicherfunktionen
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export class SaveManager {
    constructor() {
        this.saveKey = 'ressourcen_imperium_save';
        this.backupKey = 'ressourcen_imperium_backup';
        this.lastSaveTime = 0;
        this.autoSaveInterval = GAME_CONFIG.AUTO_SAVE_INTERVAL || 60000; // Standard: 1 Minute
    }

    /**
     * Speichert den aktuellen Spielstand
     * @param {Object} gameState - Aktueller Spielzustand
     * @returns {boolean} Erfolg des Speichervorgangs
     */
    saveGame(gameState) {
        try {
            // Erstelle Backup des vorherigen Spielstands
            const previousSave = localStorage.getItem(this.saveKey);
            if (previousSave) {
                localStorage.setItem(this.backupKey, previousSave);
            }

            // Bereite Speicherdaten vor
            const saveData = {
                timestamp: Date.now(),
                version: GAME_CONFIG.GAME_VERSION,
                state: this.prepareSaveData(gameState)
            };

            // Speichere neue Daten
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            this.lastSaveTime = Date.now();

            console.log('Spiel erfolgreich gespeichert:', new Date(this.lastSaveTime).toLocaleString());
            return true;

        } catch (error) {
            console.error('Fehler beim Speichern des Spiels:', error);
            return false;
        }
    }

    /**
     * Lädt den gespeicherten Spielstand
     * @returns {Object|null} Geladener Spielstand oder null bei Fehler
     */
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) {
                console.log('Kein Spielstand gefunden');
                return null;
            }

            const parsedData = JSON.parse(saveData);

            // Überprüfe Version und Kompatibilität
            if (!this.isCompatibleVersion(parsedData.version)) {
                console.warn('Inkompatibler Spielstand gefunden');
                return this.handleIncompatibleSave(parsedData);
            }

            // Validiere Daten
            if (!this.validateSaveData(parsedData.state)) {
                console.error('Ungültiger Spielstand');
                return this.loadBackup();
            }

            return this.processSaveData(parsedData.state);

        } catch (error) {
            console.error('Fehler beim Laden des Spielstands:', error);
            return this.loadBackup();
        }
    }

    /**
     * Bereitet die Spielstandsdaten für das Speichern vor
     * @param {Object} gameState - Aktueller Spielzustand
     * @returns {Object} Aufbereitete Speicherdaten
     * @private
     */
    prepareSaveData(gameState) {
        return {
            resources: gameState.resourceManager.getSerializableState(),
            upgrades: gameState.upgradeManager.getSerializableState(),
            achievements: gameState.achievementManager.getSerializableState(),
            statistics: gameState.statistics,
            settings: gameState.settings,
            totalPlayTime: gameState.totalPlayTime,
            prestigeLevel: gameState.prestigeLevel
        };
    }

    /**
     * Verarbeitet geladene Spielstandsdaten
     * @param {Object} saveData - Geladene Spielstandsdaten
     * @returns {Object} Verarbeitete Spielstandsdaten
     * @private
     */
    processSaveData(saveData) {
        // Füge fehlende Standardwerte hinzu
        return {
            ...this.getDefaultState(),
            ...saveData,
            loadTime: Date.now()
        };
    }

    /**
     * Prüft die Kompatibilität der Spielversion
     * @param {string} savedVersion - Version des Spielstands
     * @returns {boolean} Ob der Spielstand kompatibel ist
     * @private
     */
    isCompatibleVersion(savedVersion) {
        const current = this.parseVersion(GAME_CONFIG.GAME_VERSION);
        const saved = this.parseVersion(savedVersion);

        // Prüfe Major und Minor Version
        return current.major === saved.major && 
               current.minor >= saved.minor;
    }

    /**
     * Zerlegt Versionsstring in seine Bestandteile
     * @param {string} version - Versionsstring (z.B. "1.2.3")
     * @returns {Object} Versionsobjekt
     * @private
     */
    parseVersion(version) {
        const [major, minor, patch] = version.split('.').map(Number);
        return { major, minor, patch };
    }

    /**
     * Behandelt inkompatible Spielstände
     * @param {Object} saveData - Inkompatibler Spielstand
     * @returns {Object|null} Konvertierte Daten oder null
     * @private
     */
    handleIncompatibleSave(saveData) {
        // Versuche Konvertierung des Spielstands
        try {
            return this.convertSaveData(saveData);
        } catch (error) {
            console.error('Konvertierung fehlgeschlagen:', error);
            return null;
        }
    }

    /**
     * Konvertiert alte Spielstandsformate
     * @param {Object} oldSaveData - Alter Spielstand
     * @returns {Object} Konvertierte Daten
     * @private
     */
    convertSaveData(oldSaveData) {
        // Implementiere hier Konvertierungslogik für verschiedene Versionen
        return oldSaveData.state;
    }

    /**
     * Validiert die Spielstandsdaten
     * @param {Object} saveData - Zu validierende Daten
     * @returns {boolean} Ob die Daten gültig sind
     * @private
     */
    validateSaveData(saveData) {
        // Prüfe ob alle erforderlichen Felder vorhanden sind
        const requiredFields = [
            'resources',
            'upgrades',
            'achievements',
            'statistics'
        ];

        return requiredFields.every(field => 
            saveData.hasOwnProperty(field) && 
            saveData[field] !== null
        );
    }

    /**
     * Lädt das Backup des Spielstands
     * @returns {Object|null} Backup-Daten oder null
     * @private
     */
    loadBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (!backupData) return null;

            const parsedBackup = JSON.parse(backupData);
            console.log('Backup geladen vom:', new Date(parsedBackup.timestamp).toLocaleString());
            
            return this.processSaveData(parsedBackup.state);

        } catch (error) {
            console.error('Fehler beim Laden des Backups:', error);
            return null;
        }
    }

    /**
     * Gibt den Standard-Spielzustand zurück
     * @returns {Object} Standard-Spielzustand
     * @private
     */
    getDefaultState() {
        return {
            resources: {},
            upgrades: {},
            achievements: { unlockedAchievements: [] },
            statistics: {
                totalResourcesGathered: 0,
                totalUpgradesPurchased: 0,
                playTime: 0
            },
            settings: {
                soundEnabled: true,
                particleEffects: true,
                autoSave: true
            },
            totalPlayTime: 0,
            prestigeLevel: 0
        };
    }

    /**
     * Löscht den gespeicherten Spielstand
     * @returns {boolean} Erfolg des Löschvorgangs
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            localStorage.removeItem(this.backupKey);
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Spielstands:', error);
            return false;
        }
    }

    /**
     * Exportiert den Spielstand als String
     * @param {Object} gameState - Aktueller Spielzustand
     * @returns {string} Exportierter Spielstand
     */
    exportSave(gameState) {
        const saveData = this.prepareSaveData(gameState);
        return btoa(JSON.stringify(saveData));
    }

    /**
     * Importiert einen Spielstand aus einem String
     * @param {string} saveString - Importierter Spielstand als String
     * @returns {Object|null} Importierte Spielstandsdaten oder null bei Fehler
     */
    importSave(saveString) {
        try {
            const saveData = JSON.parse(atob(saveString));
            if (this.validateSaveData(saveData)) {
                return this.processSaveData(saveData);
            }
            return null;
        } catch (error) {
            console.error('Fehler beim Importieren des Spielstands:', error);
            return null;
        }
    }
}
