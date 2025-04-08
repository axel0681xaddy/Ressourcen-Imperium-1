// storage.js - Verbesserte Speicher- und Ladefunktionen (angepasst für Datei-Export)

import { gameState } from './gameState.js';
import { calculateProduction } from './gameLoop.js';
import { formatNumber, capitalizeFirstLetter } from './display.js';

// Konstanten für Speicherung
const SAVE_KEY = 'resourceImperiumSave';
const ACTIVE_SLOT_KEY = 'resourceImperium_activeSlot';
const SLOTS_META_KEY = 'resourceImperium_slots'; 
const MAX_SAVE_SLOTS = 3;

// Status für Speicher-UI
let isSaving = false;
let isLoading = false;

// Spielstand-Metadaten verwalten
function getSaveSlotsMeta() {
    try {
        const meta = localStorage.getItem(SLOTS_META_KEY);
        return meta ? JSON.parse(meta) : {};
    } catch (error) {
        console.error('Fehler beim Laden der Spielstand-Metadaten:', error);
        return {};
    }
}

function updateSaveSlotMeta(slotId, data = {}) {
    try {
        const meta = getSaveSlotsMeta();
        meta[slotId] = {
            ...meta[slotId],
            lastSaved: Date.now(),
            resources: gameState.resources,
            prestigeLevel: gameState.prestigeMultiplier,
            ...data
        };
        localStorage.setItem(SLOTS_META_KEY, JSON.stringify(meta));
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Spielstand-Metadaten:', error);
    }
}

// Aktuellen Slot abrufen/setzen
export function getActiveSlot() {
    return localStorage.getItem(ACTIVE_SLOT_KEY) || '1';
}

export function setActiveSlot(slotId) {
    localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
}

// Speichern des Spielstands in localStorage (nur für internen Gebrauch)
export function saveGame() {
    try {
        // Aktuelle Zeit für Offline-Berechnung setzen
        gameState.lastSaveTime = Date.now();
        
        // Spielstand als JSON-String speichern
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        
        console.log(`Spiel intern gespeichert:`, new Date(gameState.lastSaveTime).toLocaleTimeString());
        
        return true;
    } catch (error) {
        console.error('Fehler beim internen Speichern des Spiels:', error);
        return false;
    }
}

// Laden des Spielstands aus localStorage
export function loadGame() {
    if (isLoading) return false;
    
    console.log('Versuche Spielstand zu laden...');
    isLoading = true;
    
    try {
        const savedGame = localStorage.getItem(SAVE_KEY);
        
        if (savedGame) {
            // Spielstand parsen
            const loadedState = JSON.parse(savedGame);
            
            // Wichtige Eigenschaften sichern, bevor der Spielstand überschrieben wird
            const startTime = gameState.startTime;
            
            // Geladene Daten vollständig in den aktuellen Spielstand kopieren
            Object.assign(gameState, loadedState);
            
            // Startzeit beibehalten, wenn sie im geladenen Spiel fehlt
            if (!gameState.startTime) {
                gameState.startTime = startTime;
            }
            
            // Fehlende Eigenschaften prüfen und initialisieren
            initMissingProperties();
            
            // Offline-Fortschritt berechnen
            calculateOfflineProgress();
            
            // Produktion neu berechnen (für den Fall von Spielupdates)
            calculateProduction();
            
            console.log(`Spielstand erfolgreich geladen.`);
            
            isLoading = false;
            return true;
        }
        
        console.log(`Kein gespeicherter Spielstand gefunden.`);
        
        isLoading = false;
        return false;
    } catch (error) {
        console.error('Fehler beim Laden des Spielstands:', error);
        
        isLoading = false;
        return false;
    }
}

// Spielstand als Datei exportieren
export function exportSave() {
    try {
        // Aktuelle Zeit für Offline-Berechnung setzen
        gameState.lastSaveTime = Date.now();
        
        // Spielstand als JSON-String
        const saveData = JSON.stringify(gameState);
        
        // In Blob umwandeln und Download starten
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Timestamp für den Dateinamen erzeugen
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ressourcen-imperium-save-${timestamp}.json`;
        
        // Download-Element erstellen und klicken
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Aufräumen
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Auch im localStorage speichern für internen Gebrauch
        localStorage.setItem(SAVE_KEY, saveData);
        
        console.log(`Spielstand als Datei exportiert: ${filename}`);
        
        showSuccessNotification('Spielstand exportiert', `Spielstand wurde als ${filename} gespeichert.`);
        return true;
    } catch (error) {
        console.error('Fehler beim Exportieren des Spielstands:', error);
        showErrorNotification('Export fehlgeschlagen', error.message);
        return false;
    }
}
// Spielstand aus Datei importieren
export function importSave(fileOrData) {
    try {
        // Wenn ein File-Objekt übergeben wurde (von Input-Element)
        if (fileOrData instanceof File) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const saveData = event.target.result;
                    // Als JSON parsen, um Validität zu prüfen
                    const parsedData = JSON.parse(saveData);
                    
                    // Spielstand in den aktuellen Zustand laden
                    Object.assign(gameState, parsedData);
                    
                    // In localStorage speichern
                    localStorage.setItem(SAVE_KEY, saveData);
                    
                    console.log('Spielstand aus Datei importiert');
                    showSuccessNotification('Import erfolgreich', 'Spielstand wurde erfolgreich importiert und geladen.');
                    
                    // ÄNDERUNG: Anstatt die Seite neu zu laden, aktualisieren wir den Spielzustand manuell
                    // Das beseitigt mögliche Probleme mit dem Zurücksetzen beim Neuladen
                    initMissingProperties();
                    calculateOfflineProgress();
                    calculateProduction();
                    
                    // UI aktualisieren - diese Funktionen müssen importiert werden
                    try {
                        // Importieren und UI-Funktionen aufrufen
                        import('./display.js').then(displayModule => {
                            displayModule.renderGenerators();
                            displayModule.renderConverters();
                            displayModule.renderUpgrades();
                            displayModule.renderAchievements();
                            displayModule.updateDisplay();
                        });
                        
                        import('./gameLoop.js').then(gameLoopModule => {
                            gameLoopModule.calculateProduction();
                        });
                    } catch (uiError) {
                        console.error('Fehler beim Aktualisieren der UI:', uiError);
                        // Wenn die UI-Aktualisierung fehlschlägt, dann doch Seite neuladen
                        // aber mit einem speziellen Parameter, der sicherstellt, dass kein Reset ausgeführt wird
                        window.location.href = window.location.pathname + '?import=true';
                    }
                } catch (parseError) {
                    console.error('Fehler beim Parsen des Spielstands:', parseError);
                    showErrorNotification('Import fehlgeschlagen', 'Die Datei enthält keinen gültigen Spielstand.');
                }
            };
            
            reader.onerror = function() {
                showErrorNotification('Import fehlgeschlagen', 'Fehler beim Lesen der Datei.');
            };
            
            reader.readAsText(fileOrData);
            return true;
        } 
        // Wenn ein String übergeben wurde (von Textarea)
        else if (typeof fileOrData === 'string') {
            try {
                // Als JSON parsen, um Validität zu prüfen
                const parsedData = JSON.parse(fileOrData);
                
                // Spielstand in den aktuellen Zustand laden
                Object.assign(gameState, parsedData);
                
                // In localStorage speichern
                localStorage.setItem(SAVE_KEY, fileOrData);
                
                console.log('Spielstand aus Text importiert');
                showSuccessNotification('Import erfolgreich', 'Spielstand wurde erfolgreich importiert und geladen.');
                
                // ÄNDERUNG: Anstatt die Seite neu zu laden, aktualisieren wir den Spielzustand manuell
                initMissingProperties();
                calculateOfflineProgress();
                calculateProduction();
                
                // UI aktualisieren - gleiche Logik wie oben
                try {
                    // Importieren und UI-Funktionen aufrufen
                    import('./display.js').then(displayModule => {
                        displayModule.renderGenerators();
                        displayModule.renderConverters();
                        displayModule.renderUpgrades();
                        displayModule.renderAchievements();
                        displayModule.updateDisplay();
                    });
                    
                    import('./gameLoop.js').then(gameLoopModule => {
                        gameLoopModule.calculateProduction();
                    });
                } catch (uiError) {
                    console.error('Fehler beim Aktualisieren der UI:', uiError);
                    // Wenn die UI-Aktualisierung fehlschlägt, dann doch Seite neuladen
                    window.location.href = window.location.pathname + '?import=true';
                }
                
                return true;
            } catch (parseError) {
                console.error('Fehler beim Parsen des Spielstands:', parseError);
                showErrorNotification('Import fehlgeschlagen', 'Der Text enthält keinen gültigen Spielstand.');
                return false;
            }
        }
        
        showErrorNotification('Import fehlgeschlagen', 'Ungültiger Import-Typ.');
        return false;
    } catch (error) {
        console.error('Fehler beim Importieren des Spielstands:', error);
        showErrorNotification('Import fehlgeschlagen', error.message);
        return false;
    }
}

// Spielstand löschen
export function deleteSave(slotId) {
    try {
        const saveKey = SAVE_PREFIX + slotId;
        localStorage.removeItem(saveKey);
        
        // Metadaten aktualisieren
        const meta = getSaveSlotsMeta();
        delete meta[slotId];
        localStorage.setItem(SLOTS_META_KEY, JSON.stringify(meta));
        
        showSuccessNotification('Spielstand gelöscht', `Spielstand in Slot ${slotId} wurde gelöscht.`);
        return true;
    } catch (error) {
        console.error('Fehler beim Löschen des Spielstands:', error);
        showErrorNotification('Löschen fehlgeschlagen', error.message);
        return false;
    }
}

// Spielstand zurücksetzen
export function resetGame(askConfirmation = true) {
    const doReset = !askConfirmation || confirm('Möchtest du wirklich deinen gesamten Spielfortschritt zurücksetzen? Dies kann nicht rückgängig gemacht werden!');
    
    if (doReset) {
        console.log('Lösche Spielstand...');
        
        // Spielstand aus localStorage entfernen
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(SLOTS_META_KEY);
        localStorage.removeItem(ACTIVE_SLOT_KEY);
        
        if (askConfirmation) {
            // Neu laden mit Reset-Parameter
            window.location.href = window.location.pathname + '?reset=true';
        } else {
            // Ressourcen zurücksetzen ohne Neuladen
            Object.keys(gameState.resources).forEach(resource => {
                gameState.resources[resource] = 0;
            });
            
            // Produktion zurücksetzen
            Object.keys(gameState.production).forEach(resource => {
                gameState.production[resource] = 0;
            });
            
            // Weitere Zurücksetzungen
            gameState.startTime = Date.now();
            gameState.lastSaveTime = Date.now();
            gameState.totalClicks = 0;
            
            // Konverter-Akkumulator zurücksetzen
            gameState.converterAccumulator = {};
            
            console.log('Spielstand zurückgesetzt ohne Seiten-Neuladen');
            return true;
        }
    }
    
    return false;
}

// Liste aller verfügbaren Spielstände abrufen
export function listSaveSlots() {
    const meta = getSaveSlotsMeta();
    const result = [];
    
    // Für jeden möglichen Slot prüfen, ob Daten vorhanden sind
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const slotId = i.toString();
        const saveKey = SAVE_PREFIX + slotId;
        const hasSave = localStorage.getItem(saveKey) !== null;
        
        result.push({
            id: slotId,
            hasSave: hasSave,
            meta: meta[slotId] || null
        });
    }
    
    return result;
}

// Fehlende Eigenschaften initialisieren oder reparieren
function initMissingProperties() {
    // Sicherstellen, dass alle Basisobjekte vorhanden sind
    if (!gameState.converterAccumulator) {
        gameState.converterAccumulator = {};
    }
    
    // Sicherstellen, dass clickValue existiert
    if (!gameState.clickValue) {
        gameState.clickValue = {
            coins: 0,
            wood: 1,
            stone: 0,
            iron: 0,
            copper: 0
        };
    }
    
    // Sicherstellen, dass buildings existiert
    if (!gameState.buildings) {
        gameState.buildings = {};
    }
    
    // Sicherstellen, dass für alle Generatoren eine baseCost existiert
    gameState.generators.forEach(generator => {
        if (!generator.baseCost) {
            generator.baseCost = {...generator.cost};
        }
    });
    
    // Sicherstellen, dass für alle Konverter ein Akkumulator existiert
    gameState.converters.forEach(converter => {
        if (!gameState.converterAccumulator[converter.id]) {
            gameState.converterAccumulator[converter.id] = 0;
        }
        if (!converter.baseCost) {
            converter.baseCost = {...converter.cost};
        }
    });
    
    // Sicherstellen, dass unlockedResources vollständig ist
    if (!gameState.unlockedResources) {
        gameState.unlockedResources = {
            coins: true,
            wood: true,
            stone: false,
            iron: false,
            copper: false,
            planks: false,
            bricks: false,
            tools: false,
            jewelry: false
        };
    }
    
    // Fehlende Produktionswerte korrigieren
    if (!gameState.production) {
        gameState.production = {
            coins: 0,
            wood: 0,
            stone: 0,
            iron: 0,
            copper: 0,
            planks: 0,
            bricks: 0,
            tools: 0,
            jewelry: 0
        };
    }
    
    // Prestige-Werte prüfen und korrigieren
    if (gameState.prestigeMultiplier === undefined) {
        gameState.prestigeMultiplier = 1;
    }
    if (gameState.prestigePoints === undefined) {
        gameState.prestigePoints = 0;
    }
    if (gameState.prestigeResets === undefined) {
        gameState.prestigeResets = 0;
    }
    
    // Sicherstellen, dass activeConverters existiert
    if (!gameState.activeConverters) {
        gameState.activeConverters = {};
    }
    
    // Sicherstellen, dass eine Spielstand-ID existiert
    if (!gameState.gameId) {
        gameState.gameId = generateGameId();
    }
}

// Berechnet und gibt Ressourcen, die während Offline-Zeit gesammelt wurden
function calculateOfflineProgress() {
    // Aktuelle Zeit abrufen
    const currentTime = Date.now();
    const lastSaveTime = gameState.lastSaveTime || currentTime;
    
    // Offline-Zeit in Sekunden (maximal 12 Stunden)
    const maxOfflineSeconds = 12 * 60 * 60; // 12 Stunden
    const actualOfflineSeconds = Math.floor((currentTime - lastSaveTime) / 1000);
    const offlineSeconds = Math.min(actualOfflineSeconds, maxOfflineSeconds);
    
    // Nur fortfahren, wenn Offlinezeit mehr als 30 Sekunden beträgt
    if (offlineSeconds <= 30) return;
    
    console.log(`Berechne Offline-Progression für ${offlineSeconds} Sekunden...`);
    
    // Formatieren der Offline-Zeit für die Anzeige
    const offlineHours = Math.floor(offlineSeconds / 3600);
    const offlineMinutes = Math.floor((offlineSeconds % 3600) / 60);
    const offlineTimeText = offlineHours > 0 
        ? `$${offlineHours}h$$ {offlineMinutes}m` 
        : `$${offlineMinutes}m$$ {offlineSeconds % 60}s`;
    
    let resourcesGained = false;
    let offlineGains = {};
    
    // Ressourcen aus Generatoren hinzufügen
    Object.keys(gameState.production).forEach(resource => {
        if (gameState.production[resource] > 0) {
            const amount = gameState.production[resource] * offlineSeconds;
            gameState.resources[resource] += amount;
            
            // Für die Anzeige speichern
            offlineGains[resource] = amount;
            resourcesGained = true;
        }
    });
    
    // Vereinfachtes Modell für Offline-Konvertierungen
    const maxOperationsPerConverter = {};
    
    // Berechne maximale Anzahl an Operationen pro Konverter
    gameState.converters.forEach(converter => {
        if (converter.amount > 0) {
            const operationsPerSecond = converter.baseSpeed * converter.amount * gameState.prestigeMultiplier;
            const totalOperations = operationsPerSecond * offlineSeconds;
            maxOperationsPerConverter[converter.id] = totalOperations;
        }
    });
    
    // Führe Konvertierungen durch, basierend auf den verfügbaren Ressourcen
    gameState.converters.forEach(converter => {
        if (maxOperationsPerConverter[converter.id] > 0) {
            let maxConversions = maxOperationsPerConverter[converter.id];
            
            // Prüfe, wie viele Konvertierungen mit den vorhandenen Ressourcen möglich sind
            Object.keys(converter.input).forEach(resource => {
                const available = gameState.resources[resource];
                const possibleConversions = available / converter.input[resource];
                maxConversions = Math.min(maxConversions, possibleConversions);
            });
            
            // Runde auf eine ganze Zahl ab
            maxConversions = Math.floor(maxConversions);
            
            if (maxConversions > 0) {
                // Ressourcen verbrauchen
                Object.keys(converter.input).forEach(resource => {
                    const used = converter.input[resource] * maxConversions;
                    gameState.resources[resource] -= used;
                });
                
                // Ressourcen produzieren
                Object.keys(converter.output).forEach(resource => {
                    const produced = converter.output[resource] * maxConversions;
                    gameState.resources[resource] += produced;
                    
                    // Für die Anzeige speichern (addieren, falls bereits andere Quellen vorhanden)
                    offlineGains[resource] = (offlineGains[resource] || 0) + produced;
                    resourcesGained = true;
                });
            }
        }
    });
    
    // Hinweis anzeigen, wenn Ressourcen gesammelt wurden
    if (resourcesGained) {
        showOfflineProgressNotification(offlineTimeText, offlineGains);
    }
}

// Hilfsfunktion: Generiert eine eindeutige ID für den Spielstand
function generateGameId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// UI-Benachrichtigungen und Indikatoren

function showSavingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.id = 'save-indicator';
    indicator.innerHTML = `
        <div class="save-indicator-spinner"></div>
        <div>Speichere...</div>
    `;
    
    document.body.appendChild(indicator);
    addSaveIndicatorStyles();
}

function hideSavingIndicator() {
    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.classList.add('fade-out');
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 500);
    }
}

function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.id = 'load-indicator';
    indicator.innerHTML = `
        <div class="save-indicator-spinner"></div>
        <div>Lade...</div>
    `;
    
    document.body.appendChild(indicator);
    addSaveIndicatorStyles();
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('load-indicator');
    if (indicator) {
        indicator.classList.add('fade-out');
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 500);
    }
}

function showSuccessNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'game-notification success';
    notification.innerHTML = `
        <div class="notification-icon">✓</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    addNotificationStyles();
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

function showErrorNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'game-notification error';
    notification.innerHTML = `
        <div class="notification-icon">✗</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    addNotificationStyles();
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

function showOfflineProgressNotification(timeAway, gains) {
    const gainsHtml = Object.entries(gains)
        .map(([resource, amount]) => {
            return `<div class="offline-resource">
                <span class="resource-icon ${resource}-icon"></span>
                $${formatNumber(Math.floor(amount))}$$ {capitalizeFirstLetter(resource)}
            </div>`;
        })
        .join('');
    
    const notification = document.createElement('div');
    notification.className = 'game-notification offline-progress';
    notification.innerHTML = `
        <div class="notification-icon">💤</div>
        <div class="notification-content">
            <div class="notification-title">Offline-Fortschritt</div>
            <div class="notification-message">
                <p>Während deiner Abwesenheit (${timeAway}) hast du folgende Ressourcen gesammelt:</p>
                <div class="offline-gains-container">${gainsHtml}</div>
            </div>
        </div>
        <button class="notification-close">×</button>
    `;
    
    document.body.appendChild(notification);
    addNotificationStyles();
    
    // Schließen-Button Funktionalität
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    });
    
    // Automatisch nach einer längeren Zeit ausblenden
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 10000);
}

function addSaveIndicatorStyles() {
    if (!document.getElementById('save-indicator-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'save-indicator-styles';
        styleElement.textContent = `
            .save-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: rgba(40, 40, 40, 0.8);
                color: white;
                padding: 12px 20px;
                border-radius: 5px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 2000;
                animation: fade-in 0.3s ease-out;
            }
            
            .save-indicator-spinner {
                width: 16px;
                height: 16px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spinner 1s linear infinite;
            }
            
            @keyframes spinner {
                to {
                    transform: rotate(360deg);
                }
            }
            
            @keyframes fade-in {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .save-indicator.fade-out {
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.5s, transform 0.5s;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

function addNotificationStyles() {
    if (!document.getElementById('game-notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'game-notification-styles';
        styleElement.textContent = `
            .game-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: white;
                color: #333;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: flex-start;
                gap: 15px;
                max-width: 400px;
                z-index: 2000;
                animation: slide-in 0.4s ease-out;
            }
            
            .game-notification.success {
                border-left: 5px solid #2ecc71;
            }
            
            .game-notification.error {
                border-left: 5px solid #e74c3c;
            }
            
            .game-notification.offline-progress {
                bottom: 50%;
                right: 50%;
                transform: translate(50%, 50%);
                max-width: 500px;
            }
            
            .notification-icon {
                font-size: 20px;
                height: 30px;
                width: 30px;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 50%;
            }
            
            .success .notification-icon {
                background-color: #2ecc71;
                color: white;
            }
            
            .error .notification-icon {
                background-color: #e74c3c;
                color: white;
            }
            
            .offline-progress .notification-icon {
                background-color: #3498db;
                color: white;
                font-size: 16px;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .notification-message {
                font-size: 0.9em;
                color: #666;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
                padding: 0;
                margin: 0;
                line-height: 1;
            }
            
            .notification-close:hover {
                color: #333;
            }
            
            .offline-gains-container {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 8px;
                max-height: 200px;
                overflow-y: auto;
                padding-right: 10px;
            }
            
            .offline-resource {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px;
                background-color: #f5f5f5;
                border-radius: 4px;
            }
            
            @keyframes slide-in {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .game-notification.fade-out {
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.5s, transform 0.5s;
            }
            
            .offline-progress.fade-out {
                opacity: 0;
                transition: opacity 0.5s;
            }
            
            @media (max-width: 600px) {
                .game-notification {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }
                
                .offline-progress {
                    bottom: 50%;
                    left: 50%;
                    right: auto;
                    transform: translate(-50%, 50%);
                    width: 90%;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}
