import { gameState } from './gameState.js';
import { canAfford } from './gameState.js';
import { isConverterActive } from './gameState.js';
import { updateMarketStats, marketConfig } from './market.js';

// DOM-Elemente Cache
const resourceDisplays = {};
const productionDisplays = {};
let clickButton;
let totalClicksDisplay;
let playTimeDisplay;
let progressBar;
let prestigePointsDisplay;
let prestigeMultiplierDisplay;
let prestigeResetsDisplay;

// Ressourcenanzeigen initialisieren
export function initDisplays() {
    console.log('Initialisiere Display-Elemente...');
    
    // UI-Elemente initialisieren
    clickButton = document.getElementById('click-btn');
    totalClicksDisplay = document.getElementById('total-clicks');
    playTimeDisplay = document.getElementById('play-time');
    progressBar = document.getElementById('progress-bar');
    prestigePointsDisplay = document.getElementById('prestige-points');
    prestigeMultiplierDisplay = document.getElementById('prestige-multiplier');
    prestigeResetsDisplay = document.getElementById('prestige-resets');
    
    // Ressourcenanzeigen finden und cachen
    Object.keys(gameState.resources).forEach(resource => {
        const resourceDisplay = document.getElementById(resource);
        const productionDisplay = document.getElementById(`${resource}-per-second`);
        
        if (!resourceDisplay) {
            console.warn(`Ressourcenanzeige für "${resource}" nicht gefunden`);
        }
        
        if (!productionDisplay) {
            console.warn(`Produktionsanzeige für "${resource}-per-second" nicht gefunden`);
        }
        
        if (resourceDisplay) resourceDisplays[resource] = resourceDisplay;
        if (productionDisplay) productionDisplays[resource] = productionDisplay;
    });
    
    console.log('Display-Elemente initialisiert.');
}

// Generator-Elemente rendern
export function renderGenerators() {
    const resourceGeneratorsContainer = document.getElementById('resource-generators-container');
    resourceGeneratorsContainer.innerHTML = '';
    resourceGeneratorsContainer.className = 'generator-container';
    
    gameState.generators.forEach(generator => {
        if (generator.unlocked) {
            const generatorElement = document.createElement('div');
            generatorElement.className = 'generator';
            
            // HTML für die Kostenanzeige erstellen
            let costHTML = '';
            let progressBarsHTML = '';
            
            Object.keys(generator.cost).forEach(resource => {
                const resourceIcon = `<span class="resource-icon ${resource}-icon"></span>`;
                const currentAmount = gameState.resources[resource];
                const requiredAmount = generator.cost[resource];
                const percentage = Math.min(100, Math.floor((currentAmount / requiredAmount) * 100));
                const affordableClass = currentAmount >= requiredAmount ? '' : 'not-affordable';
                
                costHTML += `<span class="cost-item ${affordableClass}">${resourceIcon}${formatNumber(generator.cost[resource])}${capitalizeFirstLetter(resource)}</span>`;
                
                // Fortschrittsbalken für jede Ressource
                progressBarsHTML += `
                    <div class="cost-progress">
                        <div class="cost-label">${capitalizeFirstLetter(resource)}:${formatNumber(currentAmount)}/${formatNumber(requiredAmount)}</div>
                        <div class="cost-progress-bar">
                            <div class="cost-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            });
            
            // Angepasste Darstellung für den Marktstand
            if (generator.id === 'market') {
                generatorElement.innerHTML = `
                    <div>
                        <h3 class="generator-name">${generator.name}</h3>
                        <p class="generator-info">Ermöglicht den Verkauf von Ressourcen auf dem Markt</p>
                        <div class="stats">Anzahl: ${generator.amount} | Verkaufsrate: ${(marketConfig.getSellRate(generator.amount)).toFixed(1)}/s</div>
                        ${progressBarsHTML}
                    </div>
                    <button class="buy-button buy-generator" data-id="${generator.id}">
                        Kaufen<br>
                        <span class="cost-display">${costHTML}</span>
                    </button>
                `;
            } else {
                // Normale Darstellung für alle anderen Generatoren
                const output = (generator.baseOutput * generator.amount * gameState.prestigeMultiplier).toFixed(1);
                
                generatorElement.innerHTML = `
                    <div>
                        <h3 class="generator-name">${generator.name}</h3>
                        <p class="generator-info">Produziert ${generator.baseOutput}${capitalizeFirstLetter(generator.resource)} pro Sekunde</p>
                        <div class="stats">Anzahl: ${generator.amount} | Ausbeute: ${output}/s</div>
                        ${progressBarsHTML}
                    </div>
                    <button class="buy-button buy-generator" data-id="${generator.id}">
                        Kaufen<br>
                        <span class="cost-display">${costHTML}</span>
                    </button>
                `;
            }
            
            resourceGeneratorsContainer.appendChild(generatorElement);
        }
    });
    
    // Falls keine Generatoren freigeschaltet sind
    if (resourceGeneratorsContainer.children.length === 0) {
        resourceGeneratorsContainer.innerHTML = '<p>Momentan sind keine Ressourcen-Sammler verfügbar.</p>';
    }
    
    // CSS für die Fortschrittsbalken hinzufügen, falls noch nicht vorhanden
    addCostProgressBarStyles();
}

// Hilfsfunktion zum Hinzufügen der CSS-Stile für Fortschrittsbalken
function addCostProgressBarStyles() {
    if (!document.getElementById('cost-progress-bar-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'cost-progress-bar-styles';
        styleElement.textContent = `
            .cost-progress {
                margin-top: 8px;
                margin-bottom: 5px;
            }
            
            .cost-label {
                font-size: 0.85em;
                color: #7f8c8d;
                margin-bottom: 3px;
            }
            
            .cost-progress-bar {
                height: 6px;
                background-color: #ecf0f1;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .cost-progress-fill {
                height: 100%;
                background-color: #3498db;
                transition: width 0.3s ease-out;
            }
            
            .not-affordable {
                color: #e74c3c;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Konverter-Elemente rendern
export function renderConverters() {
    const convertersContainer = document.getElementById('converters-container');
    convertersContainer.innerHTML = '';
    convertersContainer.className = 'converter-container';
    
    gameState.converters.forEach(converter => {
        if (converter.unlocked) {
            const operationsPerSecond = (converter.baseSpeed * converter.amount * gameState.prestigeMultiplier).toFixed(2);
            
            const converterElement = document.createElement('div');
            converterElement.className = 'converter';
            
            // Status des Konverters bestimmen (aktiv/inaktiv)
            const isActive = isConverterActive(converter.id);
            const statusClass = isActive ? 'active-converter' : 'inactive-converter';
            
            // HTML für Eingangsressourcen erstellen
            let inputHTML = '';
            Object.keys(converter.input).forEach(resource => {
                const resourceIcon = `<span class="resource-icon ${resource}-icon"></span>`;
                inputHTML += `<span class="cost-item">${resourceIcon}${converter.input[resource]}${capitalizeFirstLetter(resource)}</span>`;
            });
            
            // HTML für Ausgangsressourcen erstellen
            let outputHTML = '';
            Object.keys(converter.output).forEach(resource => {
                const resourceIcon = `<span class="resource-icon ${resource}-icon"></span>`;
                outputHTML += `<span class="cost-item">${resourceIcon}${converter.output[resource]}${capitalizeFirstLetter(resource)}</span>`;
            });
            
            // HTML für Kostenanzeige erstellen
            let costHTML = '';
            Object.keys(converter.cost).forEach(resource => {
                const resourceIcon = `<span class="resource-icon ${resource}-icon"></span>`;
                costHTML += `<span class="cost-item">${resourceIcon}${formatNumber(converter.cost[resource])}${capitalizeFirstLetter(resource)}</span>`;
            });
            
            converterElement.innerHTML = `
                <div>
                    <h3 class="converter-name">${converter.name}</h3>
                    <p class="converter-info">Konvertiert ${inputHTML} in$$ {outputHTML}</p>
                    <div class="stats">Anzahl: ${converter.amount} | Geschwindigkeit: ${operationsPerSecond}/s</div>
                    
                    <!-- NEU: Konverter aktivieren/deaktivieren Button -->
                    ${converter.amount > 0 ? `
                        <div class="converter-controls">
                            <button class="toggle-converter ${statusClass}" data-id="${converter.id}">
                                ${isActive ? 'Aktiv' : 'Inaktiv'}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <button class="buy-button buy-converter" data-id="${converter.id}">
                    Kaufen<br>
                    <span class="cost-display">${costHTML}</span>
                </button>
            `;
            convertersContainer.appendChild(converterElement);
        }
    });
    
    // Falls keine Konverter freigeschaltet sind
    if (convertersContainer.children.length === 0) {
        convertersContainer.innerHTML = '<p>Momentan sind keine Konverter verfügbar.</p>';
    }
    
    // CSS für aktive und inaktive Konverter hinzufügen
    addConverterToggleStyles();
}

// CSS für Konverter-Toggle hinzufügen
function addConverterToggleStyles() {
    if (!document.getElementById('converter-toggle-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'converter-toggle-styles';
        styleElement.textContent = `
            .converter-controls {
                margin-top: 10px;
            }
            
            .toggle-converter {
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .active-converter {
                background-color: #27ae60;
                color: white;
                border: 1px solid #219653;
            }
            
            .inactive-converter {
                background-color: #e74c3c;
                color: white;
                border: 1px solid #c0392b;
            }
            
            .toggle-converter:hover {
                filter: brightness(1.1);
                transform: translateY(-2px);
            }
            
            .toggle-converter:active {
                transform: translateY(0);
            }
            
            .inactive-converter {
                background-color: #e74c3c;
            }
            
            .converter.inactive {
                opacity: 0.7;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Upgrades-Elemente rendern
export function renderUpgrades() {
    const upgradesContainer = document.getElementById('upgrades-container');
    upgradesContainer.innerHTML = '';
    upgradesContainer.className = 'upgrades-container';
    
    gameState.upgrades.forEach(upgrade => {
        if (upgrade.unlocked && !upgrade.purchased) {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade';
            
            // HTML für Kostenanzeige erstellen
            let costHTML = '';
            Object.keys(upgrade.cost).forEach(resource => {
                const resourceIcon = `<span class="resource-icon ${resource}-icon"></span>`;
                costHTML += `<span class="cost-item">${resourceIcon}${formatNumber(upgrade.cost[resource])}${capitalizeFirstLetter(resource)}</span>`;
            });
            
            upgradeElement.innerHTML = `
                <div>
                    <h3 class="upgrade-name">${upgrade.name}</h3>
                    <p class="upgrade-description">${upgrade.effect}</p>
                </div>
                <button class="buy-button buy-upgrade" data-id="${upgrade.id}">
                    Kaufen<br>
                    <span class="cost-display">${costHTML}</span>
                </button>
            `;
            upgradesContainer.appendChild(upgradeElement);
        }
    });
    
    // Falls keine Upgrades verfügbar sind
    if (upgradesContainer.children.length === 0) {
        upgradesContainer.innerHTML = '<p>Momentan sind keine Verbesserungen verfügbar.</p>';
    }
}

// Errungenschaften-Elemente rendern
export function renderAchievements() {
    const achievementsContainer = document.getElementById('achievements-container');
    achievementsContainer.innerHTML = '';
    
    gameState.achievements.forEach(achievement => {
        if (achievement.achieved) {
            const achievementElement = document.createElement('div');
            achievementElement.className = 'achievement';
            achievementElement.textContent = `${achievement.name}: ${achievement.description}`;
            achievementsContainer.appendChild(achievementElement);
        }
    });
    
    // Falls keine Errungenschaften
    if (achievementsContainer.children.length === 0) {
        achievementsContainer.innerHTML = '<p>Noch keine Errungenschaften freigeschaltet.</p>';
    }
}

// UI-Anzeige aktualisieren
export function updateDisplay() {
    // Ressourcenanzeigen aktualisieren
    Object.keys(gameState.resources).forEach(resource => {
        if (resourceDisplays[resource]) {
            resourceDisplays[resource].textContent = formatNumber(Math.floor(gameState.resources[resource]));
        }
        if (productionDisplays[resource]) {
            productionDisplays[resource].textContent = formatNumber(gameState.production[resource].toFixed(1));
        }
    });
    
    totalClicksDisplay.textContent = formatNumber(gameState.totalClicks);
    
    // Buttons basierend auf Ressourcenverfügbarkeit aktualisieren
    updateButtonStates();
    
    // Ressourcenanzeigen basierend auf Freischaltungsstatus ein-/ausblenden
    Object.keys(gameState.unlockedResources).forEach(resource => {
        const resourceElement = document.getElementById(resource)?.parentElement?.parentElement;
        if (resourceElement) {
            if (gameState.unlockedResources[resource]) {
                resourceElement.style.display = 'block';
            } else {
                resourceElement.style.display = 'none';
            }
        }
    });
    
    // Marktstatistiken aktualisieren, falls der Tab aktiv ist
    if (document.querySelector('.tab[data-tab="market"].active')) {
        updateMarketStats();
    }
}

// Spielzeit aktualisieren
export function updateGameTime() {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    playTimeDisplay.textContent = `$${minutes}m${seconds}s`;
}

// Fortschrittsbalken aktualisieren
export function updateProgressBar() {
    // Nächstes Ziel bestimmen
    let nextGoal = Infinity;
    let currentResource = '';
    
    // Auf nächstes Generator-Ziel prüfen
    gameState.generators.forEach(generator => {
        if (generator.unlocked) {
            Object.keys(generator.cost).forEach(resource => {
                if (gameState.resources[resource] < generator.cost[resource] && generator.cost[resource] < nextGoal) {
                    nextGoal = generator.cost[resource];
                    currentResource = resource;
                }
            });
        }
    });
    
    // Auf Konverter-Ziele prüfen
    gameState.converters.forEach(converter => {
        if (converter.unlocked) {
            Object.keys(converter.cost).forEach(resource => {
                if (gameState.resources[resource] < converter.cost[resource] && converter.cost[resource] < nextGoal) {
                    nextGoal = converter.cost[resource];
                    currentResource = resource;
                }
            });
        }
    });
    
    // Auf Upgrade-Ziele prüfen
    gameState.upgrades.forEach(upgrade => {
        if (upgrade.unlocked && !upgrade.purchased) {
            Object.keys(upgrade.cost).forEach(resource => {
                if (gameState.resources[resource] < upgrade.cost[resource] && upgrade.cost[resource] < nextGoal) {
                    nextGoal = upgrade.cost[resource];
                    currentResource = resource;
                }
            });
        }
    });
    
    // Wenn kein Ziel gefunden, Münzen für Prestige verwenden
    if (nextGoal === Infinity || !currentResource) {
        nextGoal = 1000000;
        currentResource = 'coins';
    }
    
    // Fortschritt als Prozentsatz berechnen
    let progressPercent = Math.min(100, (gameState.resources[currentResource] / nextGoal) * 100);
    progressBar.style.width = `${progressPercent}%`;
}

// Button-Status basierend auf Ressourcenverfügbarkeit aktualisieren
export function updateButtonStates() {
    // Generator-Buttons
    document.querySelectorAll('.buy-generator').forEach(button => {
        const generatorId = button.getAttribute('data-id');
        const generator = gameState.generators.find(g => g.id === generatorId);
        
        let affordable = canAfford(generator.cost);
        button.disabled = !affordable;
    });
    
    // Konverter-Buttons
    document.querySelectorAll('.buy-converter').forEach(button => {
        const converterId = button.getAttribute('data-id');
        const converter = gameState.converters.find(c => c.id === converterId);
        
        let affordable = canAfford(converter.cost);
        button.disabled = !affordable;
    });
    
    // Upgrade-Buttons
    document.querySelectorAll('.buy-upgrade').forEach(button => {
        const upgradeId = button.getAttribute('data-id');
        const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
        
        let affordable = canAfford(upgrade.cost);
        button.disabled = !affordable;
    });
    
    // Prestige-Button
    const prestigeButton = document.getElementById('prestige-btn');
    if (prestigeButton) {
        prestigeButton.disabled = gameState.resources.coins < 1000000;
    }
    
    // Konverter-Toggle-Buttons aktualisieren
    document.querySelectorAll('.toggle-converter').forEach(button => {
        const converterId = button.getAttribute('data-id');
        const isActive = isConverterActive(converterId);
        
        // CSS-Klassen aktualisieren
        button.classList.remove('active-converter', 'inactive-converter');
        button.classList.add(isActive ? 'active-converter' : 'inactive-converter');
        
        // Text aktualisieren
        button.textContent = isActive ? 'Aktiv' : 'Inaktiv';
    });
}

// Prestige-Informationen aktualisieren
export function updatePrestigeInfo() {
    const potentialPoints = Math.floor(Math.sqrt(gameState.resources.coins / 10000));
    prestigePointsDisplay.textContent = potentialPoints;
    
    prestigeMultiplierDisplay.textContent = gameState.prestigeMultiplier.toFixed(1);
    prestigeResetsDisplay.textContent = gameState.prestigeResets;
}

// Große Zahlen formatieren
export function formatNumber(num) {
    return parseFloat(num).toLocaleString('de-DE');
}

// Ersten Buchstaben groß schreiben
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
