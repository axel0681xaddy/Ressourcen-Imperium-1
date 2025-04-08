// gameLoop.js - Hauptspielschleife und Ressourcenberechnungen

import { gameState } from './gameState.js';
import { isConverterActive } from './gameState.js';
import { checkUnlocks } from './upgrades.js';
import { updateDisplay, updateGameTime, updateProgressBar, updatePrestigeInfo } from './display.js';
import { processMarketSales } from './market.js';

// Hauptspielschleife - wird jede Sekunde ausgeführt
export function gameLoop() {
    // Ressourcenproduktion durch Generatoren hinzufügen
    Object.keys(gameState.production).forEach(resource => {
        gameState.resources[resource] += gameState.production[resource];
    });
    
    // Konverter verarbeiten
    processConverters();
    
    // Marktstand-Verkäufe verarbeiten
    processMarketSales();
    
    // UI aktualisieren
    updateDisplay();
    
    // Spielzeit aktualisieren
    updateGameTime();
    
    // Prüfen auf Freischaltungen basierend auf Ressourcenmengen
    checkUnlocks();
    
    // Prestige-Informationen aktualisieren
    updatePrestigeInfo();
}

// Berechnung der Ressourcenproduktion (inkl. Konverter)
export function calculateProduction() {
    // Produktion auf 0 zurücksetzen
    Object.keys(gameState.production).forEach(resource => {
        gameState.production[resource] = 0;
    });
    
    // Produktion durch Generatoren berechnen
    gameState.generators.forEach(generator => {
        // Marktstand überspringen, da er keine Ressourcen produziert
        if (generator.id === 'market') return;
        
        if (generator.amount > 0 && generator.resource !== 'none') {
            gameState.production[generator.resource] += generator.baseOutput * generator.amount;
        }
    });
    
    // Produktion durch Konverter schätzen
    // Diese Werte sind geschätzt und basieren auf der Annahme, dass genügend Eingangsressourcen vorhanden sind
    gameState.converters.forEach(converter => {
        // OPTIMIERUNG: Nur aktive Konverter berücksichtigen
        if (converter.amount > 0 && isConverterActive(converter.id)) {
            const operationsPerSecond = converter.baseSpeed * converter.amount;
            
            // Ausgangsressourcen berechnen
            Object.keys(converter.output).forEach(resource => {
                const productionPerSecond = operationsPerSecond * converter.output[resource];
                gameState.production[resource] += productionPerSecond;
            });
            
            // Verbrauch von Eingangsressourcen berechnen (als negative Produktion)
            Object.keys(converter.input).forEach(resource => {
                const consumptionPerSecond = operationsPerSecond * converter.input[resource];
                gameState.production[resource] -= consumptionPerSecond;
            });
        }
    });
    
    // Prestige-Multiplikator anwenden
    Object.keys(gameState.production).forEach(resource => {
        gameState.production[resource] *= gameState.prestigeMultiplier;
    });
}

// Verbesserte Konvertierung von Ressourcen durch Konverter
function processConverters() {
    // Konverter-Status für die Akkumulation
    if (!gameState.converterAccumulator) {
        gameState.converterAccumulator = {};
    }
    
    // Für jede Konverter-Instanz
    gameState.converters.forEach(converter => {
        // OPTIMIERUNG: Nur aktive Konverter verarbeiten
        if (converter.amount > 0 && isConverterActive(converter.id)) {
            const operationsPerSecond = converter.baseSpeed * converter.amount * gameState.prestigeMultiplier;
            
            // Akkumulator für diesen Konverter initialisieren, falls noch nicht vorhanden
            if (!gameState.converterAccumulator[converter.id]) {
                gameState.converterAccumulator[converter.id] = 0;
            }
            
            // Akkumulator aktualisieren
            gameState.converterAccumulator[converter.id] += operationsPerSecond;
            
            // Prüfen, ob genügend Ressourcen für mindestens eine Konvertierung vorhanden sind
            let canConvert = true;
            
            // Überprüfen, ob genügend Eingangsressourcen vorhanden sind
            Object.keys(converter.input).forEach(resource => {
                if (gameState.resources[resource] < converter.input[resource]) {
                    canConvert = false;
                }
            });
            
            // Vollständige Konvertierungen durchführen, wenn genügend akkumuliert wurde und Ressourcen verfügbar sind
            while (gameState.converterAccumulator[converter.id] >= 1 && canConvert) {
                // Eingangsressourcen verbrauchen
                Object.keys(converter.input).forEach(resource => {
                    gameState.resources[resource] -= converter.input[resource];
                    
                    // Überprüfen, ob nach dem Verbrauch noch genügend Ressourcen für weitere Konvertierungen vorhanden sind
                    if (gameState.resources[resource] < converter.input[resource]) {
                        canConvert = false;
                    }
                });
                
                // Nur wenn alle Ressourcen verfügbar waren
                if (canConvert) {
                    // Ausgangsressourcen produzieren
                    Object.keys(converter.output).forEach(resource => {
                        gameState.resources[resource] += converter.output[resource];
                    });
                    
                    // Akkumulator reduzieren
                    gameState.converterAccumulator[converter.id] -= 1;
                }
            }
        }
    });
    
    // Produktionsraten neu berechnen, wenn Konverter aktiv sind
    let hasActiveConverters = false;
    gameState.converters.forEach(converter => {
        if (converter.amount > 0 && isConverterActive(converter.id)) {
            hasActiveConverters = true;
        }
    });
    
    if (hasActiveConverters) {
        // Aktualisierte Produktionsraten berechnen
        calculateRealTimeProduction();
    }
}

// OPTIMIERUNG: Aktualisiert die Produktionsraten basierend auf tatsächlichem Verbrauch/Produktion
function calculateRealTimeProduction() {
    // Temporäre Kopie der ursprünglichen Produktion erstellen
    const baseProduction = {...gameState.production};
    
    // Tatsächliche Konverter-Produktion berechnen basierend auf verfügbaren Ressourcen
    gameState.converters.forEach(converter => {
        // Nur aktive Konverter berücksichtigen
        if (converter.amount > 0 && isConverterActive(converter.id)) {
            const operationsPerSecond = converter.baseSpeed * converter.amount * gameState.prestigeMultiplier;
            
            // Maximale mögliche Operationen basierend auf verfügbaren Eingangsressourcen berechnen
            let maxPossibleOperations = operationsPerSecond;
            
            Object.keys(converter.input).forEach(resource => {
                // Ressourcen, die pro Sekunde verfügbar sind (aktuelle + Produktion)
                const availablePerSecond = (gameState.resources[resource] / 10) + baseProduction[resource];
                
                if (availablePerSecond <= 0) {
                    // Keine Ressourcen verfügbar oder nur Verbrauch
                    maxPossibleOperations = 0;
                } else {
                    // Maximale Operationen basierend auf dieser Ressource
                    const possibleOps = availablePerSecond / converter.input[resource];
                    maxPossibleOperations = Math.min(maxPossibleOperations, possibleOps);
                }
            });
            
            // Maximal möglichen Verbrauch und Produktion berechnen
            if (maxPossibleOperations > 0) {
                // Ausgangsressourcen (Produktion)
                Object.keys(converter.output).forEach(resource => {
                    const additionalProduction = maxPossibleOperations * converter.output[resource];
                    gameState.production[resource] = baseProduction[resource] + additionalProduction;
                });
                
                // Eingangsressourcen (Verbrauch, wird von der Produktion abgezogen)
                Object.keys(converter.input).forEach(resource => {
                    const consumption = maxPossibleOperations * converter.input[resource];
                    // Nur abziehen, wenn es die Produktion nicht unter 0 senkt
                    gameState.production[resource] = Math.max(0, baseProduction[resource] - consumption);
                });
            }
        }
    });
}

// Initialisierung der regelmäßigen Aktualisierungen
export function initGameLoops() {
    // Hauptspielschleife - jede Sekunde
    setInterval(gameLoop, 1000);
    
    // Häufigere Aktualisierung der Fortschrittsanzeige für flüssigere Animation
    setInterval(updateProgressBar, 100);
}
