// statistics.js - Ressourcen- und Spielstatistiken

import { gameState } from './gameState.js';

// Statistikobjekt für die Datenspeicherung
const statistics = {
    // Zeitreihen-Daten für Ressourcen (für Graphen)
    timeSeries: {
        resources: {}, // Format: { resource: [{time: timestamp, value: amount}, ...] }
        production: {} // Format: { resource: [{time: timestamp, value: rate}, ...] }
    },
    
    // Allgemeine Statistiken
    general: {
        startTime: Date.now(),
        totalClicks: 0,
        buildingsPurchased: 0,
        convertersPurchased: 0,
        upgradesPurchased: 0,
        totalResourcesGained: {}, // Format: { resource: amount }
        totalResourcesSpent: {}, // Format: { resource: amount }
        highestProduction: {}, // Format: { resource: rate }
        prestigeCount: 0
    },
    
    // Einstellungen für die Datenerfassung
    settings: {
        sampleInterval: 10000, // 10 Sekunden zwischen Datenpunkten
        maxDataPoints: 360, // ~1 Stunde bei 10-Sekunden-Intervall
        lastSampleTime: Date.now()
    }
};

// Statistiken initialisieren
export function initStatistics() {
    console.log('Initialisiere Statistik-Modul...');
    
    // Prüfen, ob ein Reset notwendig ist (z.B. nach einem Seitenneuladen)
    const needsReset = shouldResetStats();
    
    // Startzeit setzen
    statistics.general.startTime = gameState.startTime || Date.now();
    
    // Statistikobjekte für alle Ressourcen vorbereiten
    Object.keys(gameState.resources).forEach(resource => {
        // Zeitreihen initialisieren
        statistics.timeSeries.resources[resource] = [];
        statistics.timeSeries.production[resource] = [];
        
        // Allgemeine Statistiken initialisieren
        statistics.general.totalResourcesGained[resource] = 0;
        statistics.general.totalResourcesSpent[resource] = 0;
        statistics.general.highestProduction[resource] = 0;
    });
    
    // Wenn ein Reset notwendig ist, Statistiken zurücksetzen
    if (needsReset) {
        console.log('Statistiken werden zurückgesetzt, da Spielstand-ID nicht übereinstimmt');
        resetStatistics(false); // Vollständiger Reset
    } else {
        // Laden gespeicherter Statistiken (falls vorhanden)
        loadStatistics();
    }
    
    // Statistiksamplung starten
    setInterval(sampleStatistics, statistics.settings.sampleInterval);
    
    console.log('Statistik-Modul initialisiert.');
    
    return statistics; // Für Test- und Debugging-Zwecke
}

// NEUE FUNKTION: Prüft, ob die Statistiken zurückgesetzt werden sollten
function shouldResetStats() {
    // Spielstand-ID abrufen (oder neue generieren)
    const gameId = gameState.gameId || generateGameId();
    
    // Sicherstellen, dass der aktuelle Spielstand eine ID hat
    if (!gameState.gameId) {
        gameState.gameId = gameId;
    }
    
    // Gespeicherte Statistik-ID abrufen
    let statsId = null;
    try {
        const savedStats = localStorage.getItem('resourceImperiumStats');
        if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            statsId = parsedStats.gameId;
        }
    } catch (e) {
        console.warn('Fehler beim Lesen der Statistik-ID:', e);
    }
    
    // Reset, wenn keine gespeicherte ID oder die IDs nicht übereinstimmen
    return !statsId || statsId !== gameState.gameId;
}

// Hilfsfunktion: Generiert eine eindeutige ID für den Spielstand
function generateGameId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Datenpunkte für alle Ressourcen erfassen
function sampleStatistics() {
    const currentTime = Date.now();
    
    // Für jede Ressource einen Datenpunkt erfassen
    Object.keys(gameState.resources).forEach(resource => {
        // Ressourcenmenge
        statistics.timeSeries.resources[resource].push({
            time: currentTime,
            value: gameState.resources[resource]
        });
        
        // Produktionsrate
        statistics.timeSeries.production[resource].push({
            time: currentTime,
            value: gameState.production[resource]
        });
        
        // Höchste Produktion aktualisieren
        if (gameState.production[resource] > statistics.general.highestProduction[resource]) {
            statistics.general.highestProduction[resource] = gameState.production[resource];
        }
    });
    
    // Allgemeine Statistiken aktualisieren
    statistics.general.totalClicks = gameState.totalClicks;
    statistics.general.prestigeCount = gameState.prestigeResets;
    
    // Alte Datenpunkte entfernen, um Speicherverbrauch zu begrenzen
    Object.keys(statistics.timeSeries.resources).forEach(resource => {
        if (statistics.timeSeries.resources[resource].length > statistics.settings.maxDataPoints) {
            statistics.timeSeries.resources[resource].shift();
        }
        if (statistics.timeSeries.production[resource].length > statistics.settings.maxDataPoints) {
            statistics.timeSeries.production[resource].shift();
        }
    });
    
    // Zeitpunkt der letzten Probe aktualisieren
    statistics.settings.lastSampleTime = currentTime;
    
    // Statistiken speichern
    saveStatistics();
}

// Ressourcenerwerb erfassen
export function trackResourceGain(resource, amount) {
    if (!statistics.general.totalResourcesGained[resource]) {
        statistics.general.totalResourcesGained[resource] = 0;
    }
    statistics.general.totalResourcesGained[resource] += amount;
}

// Ressourcenausgaben erfassen
export function trackResourceSpent(resource, amount) {
    if (!statistics.general.totalResourcesSpent[resource]) {
        statistics.general.totalResourcesSpent[resource] = 0;
    }
    statistics.general.totalResourcesSpent[resource] += amount;
}

// Gebäudekauf erfassen
export function trackBuildingPurchase(buildingType) {
    statistics.general.buildingsPurchased++;
    
    if (buildingType === 'generator') {
        // Optionale spezifische Erfassung verschiedener Gebäudetypen
    } else if (buildingType === 'converter') {
        statistics.general.convertersPurchased++;
    }
}

// Upgrade-Kauf erfassen
export function trackUpgradePurchase() {
    statistics.general.upgradesPurchased++;
}

// Prestige-Reset erfassen
export function trackPrestige() {
    statistics.general.prestigeCount++;
}

// Statistiken speichern
function saveStatistics() {
    // Ein komprimierteres Format für die Zeitreihen erstellen
    const compressedStats = {
        gameId: gameState.gameId, // Spielstand-ID speichern
        timeSeries: {
            resources: {},
            production: {}
        },
        general: statistics.general,
        settings: statistics.settings
    };
    
    // Nur die letzten 30 Datenpunkte speichern, um Speicherplatz zu sparen
    Object.keys(statistics.timeSeries.resources).forEach(resource => {
        compressedStats.timeSeries.resources[resource] = 
            statistics.timeSeries.resources[resource].slice(-30);
        compressedStats.timeSeries.production[resource] = 
            statistics.timeSeries.production[resource].slice(-30);
    });
    
    // In localStorage speichern
    try {
        localStorage.setItem('resourceImperiumStats', JSON.stringify(compressedStats));
    } catch (error) {
        console.warn('Fehler beim Speichern der Statistiken:', error);
    }
}

// Gespeicherte Statistiken laden
function loadStatistics() {
    try {
        const savedStats = localStorage.getItem('resourceImperiumStats');
        if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            
            // Spielstand-ID überprüfen
            if (parsedStats.gameId !== gameState.gameId) {
                console.warn('Gespeicherte Statistik-ID stimmt nicht mit Spielstand-ID überein, Reset wird durchgeführt');
                resetStatistics(false);
                return;
            }
            
            // Zeitreihen übernehmen
            if (parsedStats.timeSeries) {
                Object.keys(parsedStats.timeSeries.resources).forEach(resource => {
                    statistics.timeSeries.resources[resource] = 
                        parsedStats.timeSeries.resources[resource] || [];
                    statistics.timeSeries.production[resource] = 
                        parsedStats.timeSeries.production[resource] || [];
                });
            }
            
            // Allgemeine Statistiken übernehmen
            if (parsedStats.general) {
                Object.assign(statistics.general, parsedStats.general);
            }
            
            // Einstellungen übernehmen
            if (parsedStats.settings) {
                Object.assign(statistics.settings, parsedStats.settings);
            }
            
            console.log('Statistiken erfolgreich geladen.');
        }
    } catch (error) {
        console.warn('Fehler beim Laden der Statistiken:', error);
        // Bei Fehler Statistiken zurücksetzen
        resetStatistics(false);
    }
}

// Statistiken zurücksetzen (z.B. nach Prestige)
export function resetStatistics(keepGlobalStats = true) {
    console.log('Statistiken werden zurückgesetzt, keepGlobalStats:', keepGlobalStats);
    
    // Zeitreihen zurücksetzen
    Object.keys(statistics.timeSeries.resources).forEach(resource => {
        statistics.timeSeries.resources[resource] = [];
        statistics.timeSeries.production[resource] = [];
    });
    
    if (!keepGlobalStats) {
        // Alle Statistiken vollständig zurücksetzen
        Object.keys(statistics.general.totalResourcesGained).forEach(resource => {
            statistics.general.totalResourcesGained[resource] = 0;
            statistics.general.totalResourcesSpent[resource] = 0;
            statistics.general.highestProduction[resource] = 0;
        });
        
        statistics.general.buildingsPurchased = 0;
        statistics.general.convertersPurchased = 0;
        statistics.general.upgradesPurchased = 0;
        
        // Startzeit auf aktuelle Zeit setzen
        statistics.general.startTime = Date.now();
    }
    
    // Sicherstellen, dass die Spielstand-ID gesetzt ist
    if (!gameState.gameId) {
        gameState.gameId = generateGameId();
    }
    
    // Statistiken speichern
    saveStatistics();
}

// Hilfsfunktion zum Abrufen der durchschnittlichen Produktionsrate einer Ressource (letzte X Sekunden)
export function getAverageProduction(resource, seconds = 60) {
    const dataPoints = statistics.timeSeries.production[resource];
    if (!dataPoints || dataPoints.length < 2) return 0;
    
    const currentTime = Date.now();
    const cutoffTime = currentTime - (seconds * 1000);
    
    // Datenpunkte innerhalb des angegebenen Zeitraums finden
    const recentPoints = dataPoints.filter(point => point.time >= cutoffTime);
    
    // Durchschnitt berechnen
    if (recentPoints.length === 0) return 0;
    
    const sum = recentPoints.reduce((total, point) => total + point.value, 0);
    return sum / recentPoints.length;
}

// Hilfsfunktion zum Abrufen des Wachstums einer Ressource (letzten X Sekunden)
export function getResourceGrowth(resource, seconds = 60) {
    const dataPoints = statistics.timeSeries.resources[resource];
    if (!dataPoints || dataPoints.length < 2) return 0;
    
    const currentTime = Date.now();
    const cutoffTime = currentTime - (seconds * 1000);
    
    // Datenpunkte innerhalb des angegebenen Zeitraums finden
    const recentPoints = dataPoints.filter(point => point.time >= cutoffTime);
    
    if (recentPoints.length < 2) return 0;
    
    // Ersten und letzten Wert vergleichen
    const firstValue = recentPoints[0].value;
    const lastValue = recentPoints[recentPoints.length - 1].value;
    
    return lastValue - firstValue;
}

// Gesamtspielzeit in Sekunden abrufen
export function getTotalPlayTime() {
    return Math.floor((Date.now() - statistics.general.startTime) / 1000);
}

// Formatierte Spielzeit abrufen (z.B. "2h 15m 30s")
export function getFormattedPlayTime() {
    const totalSeconds = getTotalPlayTime();
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let formattedTime = '';
    
    if (hours > 0) formattedTime += `${hours}h `;
    if (minutes > 0 || hours > 0) formattedTime += `${minutes}m `;
    formattedTime += `${seconds}s`;
    
    return formattedTime;
}

// Exportieren für die Verwendung in anderen Modulen
export const gameStatistics = statistics;