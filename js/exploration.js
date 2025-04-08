// exploration.js - Erkundungssystem für Ressourcen-Imperium

import { gameState, canAfford, deductCosts } from './gameState.js';
import { updateDisplay, formatNumber, capitalizeFirstLetter } from './display.js';
import { trackResourceSpent, trackResourceGain } from './statistics.js';

// Erkundungssystem-Konfiguration
export const explorationSystem = {
    // Aktive Erkundung
    active: false,
    
    // Fortschritt der aktuellen Erkundung (0-100%)
    progress: 0,
    
    // Basis-Kosten für eine Erkundung
    baseCost: {
        coins: 500,
        tools: 2
    },
    
    // Aktuelle Kosten (steigen mit jeder erfolgreichen Erkundung)
    cost: {
        coins: 500,
        tools: 2
    },
    
    // Kosten-Multiplikator nach jeder Erkundung
    costMultiplier: 1.2,
    
    // Geschwindigkeit der Erkundung (Fortschritt pro Sekunde)
    speed: 5,
    
    // Anzahl der durchgeführten Erkundungen
    completedExpeditions: 0,
    
    // Entdeckte Ressourcenquellen
    discoveredDeposits: [],
    
    // Aktive Ressourcenquellen (die gerade abgebaut werden)
    activeDeposits: {},
    
    // Abbaugeschwindigkeit pro Ressource
    miningSpeed: {
        wood: 2,
        stone: 1.5,
        iron: 1,
        copper: 0.8
    }
};

// Erkundung starten
export function startExploration() {
    console.log("startExploration aufgerufen");
    
    // Prüfen, ob bereits eine Erkundung läuft
    if (explorationSystem.active) {
        console.log("Es läuft bereits eine Erkundung!");
        return false;
    }
    
    // Prüfen, ob genügend Ressourcen vorhanden sind
    if (!canAfford(explorationSystem.cost)) {
        console.log("Nicht genügend Ressourcen für eine Erkundung!");
        showExplorationNotification("Nicht genügend Ressourcen", 
            `Für eine Erkundung benötigst du ${formatNumber(explorationSystem.cost.coins)} Münzen und ${formatNumber(explorationSystem.cost.tools)} Werkzeuge.`);
        return false;
    }
    
    // Kosten abziehen
    Object.keys(explorationSystem.cost).forEach(resource => {
        trackResourceSpent(resource, explorationSystem.cost[resource]);
    });
    deductCosts(explorationSystem.cost);
    
    // Erkundung starten
    explorationSystem.active = true;
    explorationSystem.progress = 0;
    
    // UI aktualisieren
    updateExplorationUI();
    updateDisplay();
    
    console.log("Erkundung gestartet!");
    showExplorationNotification("Erkundung gestartet", "Dein Team ist aufgebrochen, um neue Ressourcenquellen zu entdecken.");
    
    return true;
}

// Erkundungsfortschritt verarbeiten (wird in gameLoop.js aufgerufen)
export function processExploration() {
    // Nur verarbeiten, wenn eine Erkundung aktiv ist
    if (!explorationSystem.active) return;
    
    // Fortschritt erhöhen
    explorationSystem.progress += explorationSystem.speed;
    
    // Prüfen, ob die Erkundung abgeschlossen ist
    if (explorationSystem.progress >= 100) {
        completeExploration();
    }
    
    // UI aktualisieren
    updateExplorationUI();
}

// Erkundung abschließen und Belohnung generieren
function completeExploration() {
    // Erkundung als abgeschlossen markieren
    explorationSystem.active = false;
    explorationSystem.completedExpeditions++;
    
    // Neue Ressourcenquelle generieren
    const newDeposit = generateRandomDeposit();
    explorationSystem.discoveredDeposits.push(newDeposit);
    
    // Ressourcenquelle aktivieren
    activateDeposit(newDeposit);
    
    // Kosten für die nächste Erkundung erhöhen
    Object.keys(explorationSystem.baseCost).forEach(resource => {
        explorationSystem.cost[resource] = Math.ceil(explorationSystem.baseCost[resource] * 
            Math.pow(explorationSystem.costMultiplier, explorationSystem.completedExpeditions));
    });
    
    // UI aktualisieren
    updateExplorationUI();
    updateDisplay();
    
    console.log(`Erkundung abgeschlossen! ${newDeposit.amount}$ {newDeposit.resource} gefunden.`);
    showExplorationNotification(
        "Erkundung erfolgreich!", 
        `Dein Team hat eine neue ${capitalizeFirstLetter(newDeposit.resource)}-Quelle mit ${formatNumber(newDeposit.amount)} Einheiten entdeckt.`
    );
}

// Zufällige Ressourcenquelle generieren
function generateRandomDeposit() {
    // Verfügbare Ressourcen basierend auf Spielfortschritt
    const availableResources = ['wood', 'stone'];
    
    // Eisen und Kupfer nur hinzufügen, wenn sie freigeschaltet sind
    if (gameState.unlockedResources.iron) availableResources.push('iron');
    if (gameState.unlockedResources.copper) availableResources.push('copper');
    
    // Zufällige Ressource auswählen
    const resourceIndex = Math.floor(Math.random() * availableResources.length);
    const resource = availableResources[resourceIndex];
    
    // Basismengen für verschiedene Ressourcen
    const baseAmounts = {
        wood: 1000,
        stone: 800,
        iron: 500,
        copper: 300
    };
    
    // Qualitätsfaktor (1.0 - 2.0)
    const qualityFactor = 1.0 + Math.random();
    
    // Prestigefaktor (mehr Ressourcen mit höherem Prestige)
    const prestigeFactor = 1.0 + (gameState.prestigeMultiplier - 1) * 0.5;
    
    // Expeditionsfaktor (mehr Ressourcen mit mehr Expeditionen)
    const expeditionFactor = 1.0 + (explorationSystem.completedExpeditions * 0.1);
    
    // Gesamtmenge berechnen
    const amount = Math.floor(
        baseAmounts[resource] * 
        qualityFactor * 
        prestigeFactor * 
        expeditionFactor
    );
    
    // Qualitätsstufe bestimmen
    let quality = "normal";
    if (qualityFactor > 1.7) quality = "hervorragend";
    else if (qualityFactor > 1.4) quality = "gut";
    
    // Abbauzeit basierend auf Menge und Qualität
    const miningTime = Math.floor(amount / (explorationSystem.miningSpeed[resource] * (quality === "hervorragend" ? 1.5 : quality === "gut" ? 1.2 : 1.0)));
    
    return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        resource: resource,
        amount: amount,
        remaining: amount,
        quality: quality,
        discoveredAt: Date.now(),
        miningTime: miningTime
    };
}

// Ressourcenquelle aktivieren
function activateDeposit(deposit) {
    explorationSystem.activeDeposits[deposit.id] = deposit;
}

// Ressourcen aus aktiven Quellen abbauen (wird in gameLoop.js aufgerufen)
export function processMining() {
    Object.keys(explorationSystem.activeDeposits).forEach(depositId => {
        const deposit = explorationSystem.activeDeposits[depositId];
        
        if (deposit.remaining <= 0) {
            // Quelle erschöpft, entfernen
            delete explorationSystem.activeDeposits[depositId];
            return;
        }
        
        // Abbaugeschwindigkeit basierend auf Qualität
        let speed = explorationSystem.miningSpeed[deposit.resource];
        if (deposit.quality === "hervorragend") speed *= 1.5;
        else if (deposit.quality === "gut") speed *= 1.2;
        
        // Prestige-Multiplikator anwenden
        speed *= gameState.prestigeMultiplier;
        
        // Abgebaute Menge (maximal die verbleibende Menge)
        const minedAmount = Math.min(speed, deposit.remaining);
        
        // Ressource zum Spielstand hinzufügen
        gameState.resources[deposit.resource] += minedAmount;
        
        // Für Statistik tracken
        trackResourceGain(deposit.resource, minedAmount);
        
        // Verbleibende Menge reduzieren
        deposit.remaining -= minedAmount;
        
        // Fortschritt aktualisieren
        deposit.progress = 100 - Math.floor((deposit.remaining / deposit.amount) * 100);
    });
    
    // UI aktualisieren
    updateMiningUI();
}

// UI für Erkundung aktualisieren
function updateExplorationUI() {
    const explorationTab = document.getElementById('exploration');
    if (!explorationTab) return;
    
    // Prüfen, ob der Tab aktiv ist
    const isTabActive = explorationTab.classList.contains('active');
    if (!isTabActive) return;
    
    // Fortschrittsbalken aktualisieren
    const progressBar = document.getElementById('exploration-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${explorationSystem.progress}%`;
    }
    
    // Status-Text aktualisieren
    const statusText = document.getElementById('exploration-status');
    if (statusText) {
        if (explorationSystem.active) {
            statusText.textContent = `Erkundung läuft... (${Math.floor(explorationSystem.progress)}%)`;
        } else {
            statusText.textContent = "Keine aktive Erkundung";
        }
    }
    
    // Kosten-Anzeige aktualisieren
    const costDisplay = document.getElementById('exploration-cost');
    if (costDisplay) {
        let costHTML = '';
        Object.keys(explorationSystem.cost).forEach(resource => {
            const resourceIcon = `<span class="resource-icon ${resource}-icon"></span>`;
            costHTML += `<span class="exploration-cost"><${resourceIcon}${formatNumber(explorationSystem.cost[resource])} ${capitalizeFirstLetter(resource)}</span>`;
        });
        costDisplay.innerHTML = costHTML;
    }
    
    // Start-Button aktualisieren
    const startButton = document.getElementById('start-exploration-btn');
    if (startButton) {
        startButton.disabled = explorationSystem.active || !canAfford(explorationSystem.cost);
        
        // Visuelles Feedback für den Button-Status
        if (explorationSystem.active) {
            startButton.classList.add('disabled');
            startButton.textContent = 'Erkundung läuft...';
        } else if (!canAfford(explorationSystem.cost)) {
            startButton.classList.add('disabled');
            startButton.textContent = 'Nicht genug Ressourcen';
        } else {
            startButton.classList.remove('disabled');
            startButton.textContent = 'Erkundung starten';
        }
    }
}

// UI für aktive Ressourcenquellen aktualisieren
function updateMiningUI() {
    const depositsContainer = document.getElementById('active-deposits-container');
    if (!depositsContainer) return;
    
    // Prüfen, ob der Tab aktiv ist
    const explorationTab = document.getElementById('exploration');
    const isTabActive = explorationTab && explorationTab.classList.contains('active');
    if (!isTabActive) return;
    
    // Container leeren
    depositsContainer.innerHTML = '';
    
    // Aktive Quellen anzeigen
    const activeDeposits = Object.values(explorationSystem.activeDeposits);
    
    if (activeDeposits.length === 0) {
        depositsContainer.innerHTML = '<p>Keine aktiven Ressourcenquellen. Starte eine Erkundung, um neue zu finden!</p>';
        return;
    }
    
    // Für jede aktive Quelle ein Element erstellen
    activeDeposits.forEach(deposit => {
        const depositElement = document.createElement('div');
        depositElement.className = 'active-deposit';
        depositElement.dataset.id = deposit.id;
        
        // Qualitäts-Klasse hinzufügen
        depositElement.classList.add(`quality-${deposit.quality}`);
        
        depositElement.innerHTML = `
            <div class="active-deposit-header">
                <span class="active-deposit-title">
                    <span class="resource-icon ${deposit.resource}-icon"></span>
                    ${capitalizeFirstLetter(deposit.resource)}-Quelle (${capitalizeFirstLetter(deposit.quality)})
                </span>
            </div>
            <div class="active-deposit-info">
                <div>Verbleibend: ${formatNumber(Math.ceil(deposit.remaining))} /${formatNumber(deposit.amount)}</div>
                <div>Abbaurate: ${formatNumber(explorationSystem.miningSpeed[deposit.resource] * gameState.prestigeMultiplier)}/s</div>
            </div>
            <div class="active-deposit-progress-container">
                <div class="active-deposit-progress-bar" style="width: ${deposit.progress}%"></div>
            </div>
        `;
        
        depositsContainer.appendChild(depositElement);
    });
}

// Erkundungs-Tab rendern
export function renderExplorationTab() {
    const tabContent = document.getElementById('exploration');
    if (!tabContent) return;
    
    tabContent.innerHTML = `
        <h2>Erkundung</h2>
        <p>Erkunde die Umgebung, um neue Ressourcenquellen zu entdecken.</p>
        
        <div class="exploration-container">
            <div class="exploration-info">
                <p>Sende ein Team aus, um nach wertvollen Ressourcenquellen zu suchen. Jede erfolgreiche Erkundung führt zur Entdeckung einer neuen Ressourcenquelle, die automatisch abgebaut wird.</p>
                <p><strong>Hinweis:</strong> Für eine Erkundung benötigst du ${formatNumber(explorationSystem.cost.coins)} Münzen und ${formatNumber(explorationSystem.cost.tools)} Werkzeuge.</p>
            </div>
            
            <div class="exploration-controls">
                <div class="exploration-cost-container">
                    <span>Kosten: </span>
                    <div id="exploration-cost" class="exploration-cost">
                        <span class="cost-item"><span class="resource-icon coins-icon"></span> ${formatNumber(explorationSystem.cost.coins)} Münzen</span>
                        <span class="cost-item"><span class="resource-icon tools-icon"></span> ${formatNumber(explorationSystem.cost.tools)} Werkzeuge</span>
                    </div>
                </div>
                <button id="start-exploration-btn" ${canAfford(explorationSystem.cost) ? '' : 'disabled'}>Erkundung starten</button>
                
                <div class="exploration-progress-container">
                    <div class="exploration-progress-bar" id="exploration-progress-bar" style="width: 0%"></div>
                </div>
                <div class="exploration-status" id="exploration-status">Keine aktive Erkundung</div>
            </div>
            
            <div class="exploration-section">
                <h3>Aktive Ressourcenquellen</h3>
                <div id="active-deposits-container" class="deposits-grid">
                    <p>Keine aktiven Ressourcenquellen. Starte eine Erkundung, um neue zu finden!</p>
                </div>
            </div>
            
            <div class="exploration-section">
                <h3>Erkundungsstatistik</h3>
                <div class="exploration-stats">
                    <div class="exploration-stat">
                        <div class="stat-label">Abgeschlossene Erkundungen</div>
                        <div class="stat-value" id="completed-expeditions">${explorationSystem.completedExpeditions}</div>
                    </div>
                    <div class="exploration-stat">
                        <div class="stat-label">Entdeckte Ressourcenquellen</div>
                        <div class="stat-value" id="discovered-deposits">${explorationSystem.discoveredDeposits.length}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Event-Listener für den Start-Button
    const startButton = document.getElementById('start-exploration-btn');
    if (startButton) {
        // Entferne alle vorhandenen Event-Listener
        const newButton = startButton.cloneNode(true);
        startButton.parentNode.replaceChild(newButton, startButton);
        
        // Füge neuen Event-Listener hinzu
        newButton.addEventListener('click', function() {
            console.log("Erkundung starten Button geklickt");
            startExploration();
        });
    }
    
    // Initiale UI-Aktualisierung
    updateExplorationUI();
    updateMiningUI();
    
    // CSS für das Erkundungssystem hinzufügen
    addExplorationStyles();
}

// Benachrichtigung für Erkundungsereignisse anzeigen
function showExplorationNotification(title, message) {
    // Temporäres Element für die Benachrichtigung erstellen
    const notification = document.createElement('div');
    notification.className = 'exploration-notification';
    notification.innerHTML = `
        <div class="notification-icon">🧭</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    // Element zur Seite hinzufügen
    document.body.appendChild(notification);
    
    // CSS hinzufügen (falls noch nicht vorhanden)
    addNotificationStyles();
    
    // Notification nach einigen Sekunden ausblenden und entfernen
    setTimeout(() => {
        notification.classList.add('fadeout');
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 1000);
    }, 5000);
}

// CSS für Benachrichtigungen hinzufügen
function addNotificationStyles() {
    if (!document.getElementById('exploration-notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'exploration-notification-styles';
        styleElement.textContent = `
            .exploration-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #3498db;
                color: white;
                border-radius: 8px;
                padding: 15px;
                display: flex;
                align-items: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                animation: slidein 0.5s;
                max-width: 400px;
            }
            
            .notification-icon {
                font-size: 24px;
                margin-right: 15px;
            }
            
            .notification-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            @keyframes slidein {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .exploration-notification.fadeout {
                animation: fadeout 1s;
                opacity: 0;
            }
            
            @keyframes fadeout {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// CSS für das Erkundungssystem hinzufügen
function addExplorationStyles() {
    if (!document.getElementById('exploration-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'exploration-styles';
        styleElement.textContent = `
            .exploration-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .exploration-info {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                border-left: 4px solid #3498db;
                margin-bottom: 15px;
            }
            
            .exploration-info p {
                margin: 5px 0;
                line-height: 1.5;
            }
            
            .exploration-controls {
                display: flex;
                flex-direction: column;
                gap: 15px;
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .exploration-cost-container {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .exploration-cost {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .cost-item {
                display: flex;
                align-items: center;
                gap: 5px;
                background-color: #f8f9fa;
                padding: 5px 10px;
                border-radius: 5px;
            }
            
            #start-exploration-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            #start-exploration-btn:hover:not(:disabled) {
                background-color: #2980b9;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            #start-exploration-btn:disabled {
                background-color: #95a5a6;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .exploration-progress-container {
                height: 20px;
                background-color: #ecf0f1;
                border-radius: 10px;
                overflow: hidden;
                margin: 15px 0;
            }
            
            .exploration-progress-bar {
                height: 100%;
                background-color: #3498db;
                width: 0%;
                transition: width 0.3s;
            }
            
            .exploration-status {
                font-size: 14px;
                color: #7f8c8d;
                text-align: center;
                margin-top: 5px;
            }
            
            .exploration-section {
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .exploration-section h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #2c3e50;
            }
            
            .deposits-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
            }
            
            .active-deposit {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                border-left: 5px solid #3498db;
            }
            
            .active-deposit.quality-gut {
                border-left-color: #2ecc71;
            }
            
            .active-deposit.quality-hervorragend {
                border-left-color: #f1c40f;
                background-color: #fffdf0;
            }
            
            .active-deposit-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .active-deposit-title {
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .active-deposit-info {
                display: flex;
                justify-content: space-between;
                font-size: 0.9em;
                color: #7f8c8d;
                margin-bottom: 10px;
            }
            
            .active-deposit-progress-container {
                height: 10px;
                background-color: #ecf0f1;
                border-radius: 5px;
                overflow: hidden;
            }
            
            .active-deposit-progress-bar {
                height: 100%;
                background-color: #3498db;
                width: 0%;
                transition: width 0.3s;
            }
            
            .quality-gut .active-deposit-progress-bar {
                background-color: #2ecc71;
            }
            
            .quality-hervorragend .active-deposit-progress-bar {
                background-color: #f1c40f;
            }
            
            .exploration-stats {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .exploration-stat {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            
            .stat-label {
                font-size: 14px;
                color: #7f8c8d;
                margin-bottom: 5px;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
            }
            
            /* Responsive Anpassungen */
            @media (max-width: 768px) {
                .deposits-grid {
                    grid-template-columns: 1fr;
                }
                
                .exploration-controls {
                    padding: 15px;
                }
                
                #start-exploration-btn {
                    padding: 10px 15px;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Initialisierung des Erkundungssystems
export function initExplorationSystem() {
    console.log('Initialisiere Erkundungssystem...');
    
    // Event-Listener für Tab-Wechsel
    document.addEventListener('click', function(event) {
        const tabElement = event.target.closest('.tab[data-tab="exploration"]');
        if (tabElement) {
            // Tab wurde angeklickt, UI aktualisieren
            setTimeout(() => {
                renderExplorationTab(); // Komplettes Neurendern beim Tab-Wechsel
            }, 100);
        }
    });
    
    // Erkundungssystem in gameLoop.js integrieren
    // Dies geschieht durch den Import in gameLoop.js
    
    console.log('Erkundungssystem initialisiert.');
}

// Expedition starten (für die API)
export function startExpedition(regionId, duration) {
    console.log(`Expedition in Region ${regionId} für ${duration} Sekunden gestartet`);
    // Implementierung für spezifische Regionen
}

// Expedition abbrechen (für die API)
export function cancelExpedition(expeditionId) {
    console.log(`Expedition ${expeditionId} abgebrochen`);
    // Implementierung für Abbruch
}

// UI aktualisieren (für die API)
export function updateExpeditionUI() {
    updateExplorationUI();
    updateMiningUI();
}
