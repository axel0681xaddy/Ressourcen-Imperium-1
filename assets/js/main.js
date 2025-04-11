// main.js - Haupteinstiegspunkt für das Spiel

import { gameState } from './gameState.js';
import { initActiveConverters } from './gameState.js';
import { calculateProduction, initGameLoops } from './gameLoop.js';
import { loadGame, saveGame, resetGame } from './storage.js';
import { renderGenerators, renderConverters, renderUpgrades, renderAchievements, updateDisplay, initDisplays } from './display.js';
import { initEventHandlers } from './events.js';
import { checkAchievements, initAchievementChecker } from './achievements.js';
import { verifyAndFixUpgradeStates } from './upgrades.js';
// Neue Imports für das Statistik-System
import { initStatistics, resetStatistics } from './statistics.js';
import { renderStatisticsTab, updateStatisticsDisplay } from './statisticsDisplay.js';
// Import für das neue Marktstand-System
import { initMarketSystem } from './market.js';
// Neue Imports für verbesserte Speicherfunktion
import { initSaveUI } from './saveUI.js';
import { compressGameData, decompressGameData, checkStorageSpace } from './compression.js';
// Neue Imports für Erkundungssystem und Ressourcenknappheit
import { initExplorationSystem, renderExplorationTab } from './exploration.js';
import { initScarcitySystem } from './scarcity.js';

// Flag für Spielinitialisierung
let gameInitialized = false;

// Hauptinitialisierungsfunktion
function init() {
    console.log('Initialisiere Ressourcen-Imperium...');
    
    // URL-Parameter prüfen - reset=true für vollständigen Reset, import=true für importierten Spielstand
    const urlParams = new URLSearchParams(window.location.search);
    const forceReset = urlParams.get('reset') === 'true';
    const wasImported = urlParams.get('import') === 'true';
    
    if (forceReset) {
        console.log('Vollständiger Reset wurde angefordert');
        resetGame(false); // Reset ohne Seiten-Neuladen
    }
    
    // Displays initialisieren vor dem Laden von Daten
    initDisplays();
    
    // Spielzustand laden, wenn vorhanden
    loadSavedGame();
    
    // Spielzustand initialisieren, falls nicht geladen
    if (!gameState.startTime) {
        gameState.startTime = Date.now();
    }
    
    gameState.lastSaveTime = Date.now();
    
    // Neue Spielstand-ID generieren, falls nicht vorhanden
    if (!gameState.gameId) {
        gameState.gameId = generateGameId();
    }
    
    // Eine Benachrichtigung anzeigen, wenn der Spielstand gerade importiert wurde
    if (wasImported) {
        console.log('Spielstand wurde erfolgreich importiert');
        // Parameter aus URL entfernen, um Probleme bei weiteren Neustarts zu vermeiden
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    console.log('Spiel gestartet mit ID:', gameState.gameId);
    
    // Sicherstellen, dass das Spiel einen gültigen Zustand hat
    validateGameState();
    
    // Konverter-Status initialisieren
    initActiveConverters();
    
    // UI-Elemente rendern
    renderGenerators();
    renderConverters();
    renderUpgrades();
    renderAchievements();
    
    // Ressourcenproduktion berechnen
    calculateProduction();
    
    // UI aktualisieren
    updateDisplay();
    
    // Event-Handler für Benutzerinteraktionen initialisieren
    initEventHandlers();
    
    // Spielschleifen initialisieren
    initGameLoops();
    
    // Regelmäßige Prüfung auf Errungenschaften
    initAchievementChecker();
    
    // Statistik-System initialisieren
    initStatistics();
    
    // Statistik-Tab rendern
    renderStatisticsTab();
    
    // Tab-Wechsel-Handler für Statistik
    initStatisticsTabHandler();
    
    // Regelmäßige Aktualisierung der Statistik-Anzeige
    setInterval(updateStatisticsDisplay, 20000); // Alle 20 Sekunden aktualisieren
    
    // Marktstand-System initialisieren
    initMarketSystem();
    
    // Neue Save-UI initialisieren
    initSaveUI();
    
    // NEU: Erkundungssystem initialisieren
    initExplorationSystem();
    
    // NEU: Erkundungs-Tab rendern
    renderExplorationTab();
    
    // NEU: Ressourcenknappheitssystem initialisieren
    initScarcitySystem();
    
    console.log('Initialisierung abgeschlossen.');
    
    // Initialisierung als abgeschlossen markieren
    gameInitialized = true;
    
    // Speicherplatz prüfen
    checkGameStorageSpace();
}

// Statistics-Tab-Handler initialisieren
function initStatisticsTabHandler() {
    setTimeout(() => {
        const statisticsTab = document.querySelector('.tab[data-tab="statistics"]');
        if (statisticsTab) {
            statisticsTab.addEventListener('click', function() {
                console.log('Statistik-Tab angeklickt - Aktualisiere Anzeige');
                // Kurze Verzögerung, damit der Tab-Wechsel abgeschlossen wird
                setTimeout(() => {
                    updateStatisticsDisplay();
                }, 200);
            });
            console.log('Statistik-Tab-Handler initialisiert');
        } else {
            console.warn('Statistik-Tab nicht gefunden - Handler konnte nicht initialisiert werden');
        }
    }, 1000); // Verzögerung, um sicherzustellen, dass DOM geladen ist
}

// Spiel explizit laden
export function loadSavedGame() {
    if (!gameInitialized) {
        console.warn('Spiel wird initialisiert, bevor es geladen wird');
    }
    
    // Alte Spiel-ID speichern
    const oldGameId = gameState.gameId;
    
    const loadedGame = loadGame();
    
    if (loadedGame) {
        // Prüfen, ob die Spiel-ID geändert wurde
        const gameIdChanged = oldGameId !== gameState.gameId;
        
        // Fehlende Eigenschaften im geladenen Spiel prüfen und initialisieren
        initMissingProperties();
        
        // Konverter-Status initialisieren
        initActiveConverters();
        
        // Berechnung der Offline-Progression erfolgt in loadGame()
        
        // Produktion neu berechnen
        calculateProduction();
        
        // UI aktualisieren
        renderGenerators();
        renderConverters();
        renderUpgrades();
        renderAchievements();
        updateDisplay();
        
        // Wenn die Spiel-ID geändert wurde, Statistiken zurücksetzen
        if (gameIdChanged) {
            console.log('Spiel-ID hat sich geändert, setze Statistiken zurück');
            resetStatistics(false); // false = vollständiger Reset
        }
        
        console.log('Gespeichertes Spiel wurde geladen');
        return true;
    }
    
    console.log('Kein gespeicherter Spielstand gefunden, starte neues Spiel');
    return false;
}

// Überprüfen und Korrigieren des Spielzustands
function validateGameState() {
    // Sicherstellen, dass eine Spielstand-ID existiert
    if (!gameState.gameId) {
        gameState.gameId = generateGameId();
        console.log('Neue Spielstand-ID generiert:', gameState.gameId);
    }
    
    // Sicherstellen, dass alle Basisstrukturen existieren
    if (!gameState.converterAccumulator) {
        gameState.converterAccumulator = {};
    }
    
    // Konverter-Akkumulatoren initialisieren
    gameState.converters.forEach(converter => {
        if (!gameState.converterAccumulator[converter.id]) {
            gameState.converterAccumulator[converter.id] = 0;
        }
    });
    
    // Stellen Sie sicher, dass alle Ressourcen positive Werte sind
    Object.keys(gameState.resources).forEach(resource => {
        if (gameState.resources[resource] < 0) {
            console.warn(`Negative Ressourcenmenge korrigiert für ${resource}`);
            gameState.resources[resource] = 0;
        }
    });
    
    // Überprüfen und korrigieren des Upgrade-Zustands
    verifyAndFixUpgradeStates();
    
    // Stellen Sie sicher, dass mindestens ein Generator freigeschaltet ist
    const anyGeneratorUnlocked = gameState.generators.some(g => g.unlocked);
    if (!anyGeneratorUnlocked) {
        console.warn('Kein Generator freigeschaltet, schalte Standard-Generator frei');
        gameState.generators.find(g => g.id === 'woodcutter').unlocked = true;
    }
    
    // Überprüfen und korrigieren der Ressourcen-Freischaltungen
    const coins = gameState.resources.coins > 0;
    const wood = gameState.resources.wood > 0;
    
    if (coins || wood) {
        gameState.unlockedResources.coins = true;
        gameState.unlockedResources.wood = true;
    }
    
    // Sicherstellen, dass activeConverters existiert
    if (!gameState.activeConverters) {
        gameState.activeConverters = {};
    }
    
    // NEU: Sicherstellen, dass expeditions existiert
    if (!gameState.expeditions) {
        gameState.expeditions = [];
    }
}

// Generiert eine eindeutige ID für den Spielstand
export function generateGameId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Fehlende Eigenschaften initialisieren
function initMissingProperties() {
    // Sicherstellen, dass alle Basisobjekte vorhanden sind
    if (!gameState.converterAccumulator) {
        gameState.converterAccumulator = {};
    }
    
    // Sicherstellen, dass activeConverters existiert
    if (!gameState.activeConverters) {
        gameState.activeConverters = {};
    }
    
    // Sicherstellen, dass buildings existiert (wird im Prestige verwendet)
    if (!gameState.buildings) {
        gameState.buildings = {};
    }
    
    // Sicherstellen, dass für alle Konverter ein Akkumulator existiert
    gameState.converters.forEach(converter => {
        if (!gameState.converterAccumulator[converter.id]) {
            gameState.converterAccumulator[converter.id] = 0;
        }
        if (!converter.baseCost) {
            converter.baseCost = {...converter.cost};
        }
    });
    
    // Sicherstellen, dass eine Spielstand-ID existiert
    if (!gameState.gameId) {
        gameState.gameId = generateGameId();
    }
    
    // NEU: Sicherstellen, dass expeditions existiert
    if (!gameState.expeditions) {
        gameState.expeditions = [];
    }
    
    // Weitere fehlende Eigenschaften bei Bedarf hier hinzufügen
}

// Spiel zurücksetzen (vollständiger Reset)
export function resetGameCompletely() {
    if (confirm('Wirklich ALLE Daten zurücksetzen? Dies kann nicht rückgängig gemacht werden!')) {
        // Alle Spielstandsdaten im localStorage löschen
        localStorage.removeItem('resourceImperiumSave');
        localStorage.removeItem('resourceImperiumStats');
        localStorage.removeItem('idleGameSave');
        localStorage.clear(); // Zur Sicherheit alles löschen
        
        // Seite neu laden mit Reset-Parameter
        window.location.href = window.location.pathname + '?reset=true';
    }
}

// Angepasste Reset-Game-Funktion für den Reset-Button
export function handleResetGame() {
    resetGameCompletely();
}

// Speicherplatz prüfen und Warnungen anzeigen
function checkGameStorageSpace() {
    // Testen, ob der aktuelle Spielstand in den Speicher passt
    const spaceInfo = checkStorageSpace(gameState);
    
    if (!spaceInfo.hasEnoughSpace) {
        console.warn('Warnung: Nicht genügend localStorage-Speicherplatz!', spaceInfo);
        
        // Warnmeldung anzeigen
        showStorageWarning(spaceInfo);
    }
}

// Anzeige einer Warnung bei niedrigem Speicherplatz
function showStorageWarning(spaceInfo) {
    const usedMB = (spaceInfo.usedSpace / (1024 * 1024)).toFixed(2);
    const totalMB = (spaceInfo.totalSpace / (1024 * 1024)).toFixed(2);
    const requiredKB = (spaceInfo.requiredSpace / 1024).toFixed(2);
    
    const warning = document.createElement('div');
    warning.className = 'storage-warning';
    warning.innerHTML = `
        <div class="storage-warning-icon">⚠️</div>
        <div class="storage-warning-content">
            <h3>Speicherplatz-Warnung</h3>
            <p>Der Browserspeicher wird knapp (${usedMB}MB von${totalMB}MB belegt).</p>
            <p>Dein Spielstand benötigt ~${requiredKB}KB.</p>
            <p>Du kannst Speicherplatz freigeben, indem du alte Spielstände exportierst und dann löschst.</p>
        </div>
        <button class="storage-warning-close">×</button>
    `;
    
    document.body.appendChild(warning);
    
    // Styles hinzufügen
    if (!document.getElementById('storage-warning-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'storage-warning-styles';
        styleElement.textContent = `
            .storage-warning {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background-color: #fff3cd;
                border-left: 5px solid #ffc107;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: flex-start;
                gap: 15px;
                max-width: 400px;
                z-index: 1000;
                animation: slide-in-bottom 0.4s ease-out;
            }
            
            .storage-warning-icon {
                font-size: 24px;
            }
            
            .storage-warning-content h3 {
                margin: 0 0 10px 0;
                font-size: 1.1em;
            }
            
            .storage-warning-content p {
                margin: 5px 0;
                font-size: 0.9em;
            }
            
            .storage-warning-close {
                background: none;
                border: none;
                color: #856404;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
            }
            
            @keyframes slide-in-bottom {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Event-Listener für den Schließen-Button
    warning.querySelector('.storage-warning-close').addEventListener('click', function() {
        warning.style.opacity = '0';
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 300);
    });
    
    // Automatisch nach 15 Sekunden ausblenden
    setTimeout(() => {
        warning.style.opacity = '0';
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 300);
    }, 15000);
}

// Nur Debug-Funktion für Spielzustand beibehalten
window.debugGetGameState = () => console.log(gameState);

// Alle Ressourcen und Funktionen sofort freischalten (für Tests)
window.debugUnlockAll = () => {
    // Alle Ressourcen freischalten
    Object.keys(gameState.unlockedResources).forEach(resource => {
        gameState.unlockedResources[resource] = true;
    });
    
    // Alle Generatoren freischalten
    gameState.generators.forEach(generator => {
        generator.unlocked = true;
    });
    
    // Alle Konverter freischalten
    gameState.converters.forEach(converter => {
        converter.unlocked = true;
    });
    
    // Alle Upgrades freischalten (aber nicht kaufen)
    gameState.upgrades.forEach(upgrade => {
        upgrade.unlocked = true;
    });
    
    // UI aktualisieren
    renderGenerators();
    renderConverters();
    renderUpgrades();
    updateDisplay();
    
    console.log('Alle Spielfunktionen freigeschaltet');
};

// Spiel starten, wenn das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', init);
