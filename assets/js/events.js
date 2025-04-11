// events.js - Event-Handler für Benutzerinteraktionen

import { gameState, canAfford, deductCosts, toggleConverter } from './gameState.js';
import { saveGame, loadGame } from './storage.js';
import { updateDisplay, renderGenerators, renderConverters, renderUpgrades } from './display.js';
import { calculateProduction } from './gameLoop.js';
// Import der Tracking-Funktionen für Statistiken
import { trackResourceGain, trackResourceSpent, trackBuildingPurchase, trackUpgradePurchase } from './statistics.js';

// Event-Handler initialisieren
export function initEventHandlers() {
    console.log('Initialisiere Event-Handler...');
    
    // Click-Handler für Sammel-Button
    initClickHandlers();
    
    // Kauf-Handler für Generatoren, Konverter und Upgrades
    initBuyHandlers();
    
    // Event-Handler für Konverter-Toggle
    initConverterToggleHandlers();
    
    // Tab-Wechsel
    initTabHandlers();
    
    // Prestige-System
    initPrestigeHandlers();
    
    console.log('Event-Handler initialisiert.');
}

// Event-Handler für Konverter-Toggle
function initConverterToggleHandlers() {
    // Event-Delegation für Konverter-Toggle-Buttons
    document.addEventListener('click', function(event) {
        const toggleButton = event.target.closest('.toggle-converter');
        if (!toggleButton) return;
        
        const converterId = toggleButton.getAttribute('data-id');
        
        // Konverter-Status umschalten
        const newState = toggleConverter(converterId);
        
        // Button visuell aktualisieren
        toggleButton.classList.remove('active-converter', 'inactive-converter');
        toggleButton.classList.add(newState ? 'active-converter' : 'inactive-converter');
        toggleButton.textContent = newState ? 'Aktiv' : 'Inaktiv';
        
        // Produktion neu berechnen
        calculateProduction();
        
        // UI aktualisieren
        updateDisplay();
        
        // Debug-Meldung
        console.log(`Konverter ${converterId} ist jetzt${newState ? 'aktiv' : 'inaktiv'}`);
    });
}

// Handler für Klick-Button
function initClickHandlers() {
    const clickBtn = document.getElementById('click-btn');
    const progressBar = document.getElementById('progress-bar');
    
    if (!clickBtn) {
        console.warn('Sammel-Button nicht gefunden!');
        return;
    }
    
    let clickCooldown = false;
    
    clickBtn.addEventListener('click', function() {
        if (clickCooldown) return;
        
        // Cooldown aktivieren
        clickCooldown = true;
        progressBar.style.width = '0%';
        
        // Cooldown-Animation (500ms)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                clickCooldown = false;
            }
        }, 50);
        
        // Klick-Belohnung - nur verfügbare Ressourcen (mit clickValue > 0)
        Object.keys(gameState.clickValue).forEach(resource => {
            if (gameState.clickValue[resource] > 0) {
                const amount = gameState.clickValue[resource] * gameState.prestigeMultiplier;
                gameState.resources[resource] += amount;
                
                // Statistik-Tracking: Ressourcengewinn
                trackResourceGain(resource, amount);
                
                // Animation für gesammelte Ressource
                showResourceAnimation(resource, amount);
            }
        });
        
        // Klick-Zähler erhöhen
        gameState.totalClicks++;
        
        // UI aktualisieren
        updateDisplay();
    });
}

// Handler für Kauf-Buttons (Generator, Konverter, Upgrades)
function initBuyHandlers() {
    console.log('Initialisiere Kauf-Buttons Handler...');
    
    // Delegation für alle Kauf-Buttons
    document.addEventListener('click', function(event) {
        // Kauf von Generatoren
        const generatorButton = event.target.closest('.buy-generator');
        if (generatorButton) {
            const generatorId = generatorButton.getAttribute('data-id');
            buyGenerator(generatorId);
            return;
        }
        
        // Kauf von Konvertern
        const converterButton = event.target.closest('.buy-converter');
        if (converterButton) {
            const converterId = converterButton.getAttribute('data-id');
            buyConverter(converterId);
            return;
        }
        
        // Kauf von Upgrades
        const upgradeButton = event.target.closest('.buy-upgrade');
        if (upgradeButton) {
            const upgradeId = upgradeButton.getAttribute('data-id');
            buyUpgrade(upgradeId);
            return;
        }
    });
}

// Generator kaufen
function buyGenerator(generatorId) {
    const generator = gameState.generators.find(g => g.id === generatorId);
    
    if (!generator || !generator.unlocked) {
        console.warn(`Generator ${generatorId} nicht gefunden oder nicht freigeschaltet`);
        return;
    }
    
    // Prüfen, ob genügend Ressourcen vorhanden sind
    if (!canAfford(generator.cost)) {
        console.log('Nicht genügend Ressourcen für:', generator.name);
        return;
    }
    
    // Statistik-Tracking: Ressourcenausgaben vor dem Abzug
    Object.keys(generator.cost).forEach(resource => {
        trackResourceSpent(resource, generator.cost[resource]);
    });
    
    // Kosten abziehen
    deductCosts(generator.cost);
    
    // Generator-Anzahl erhöhen
    generator.amount++;
    
    // Statistik-Tracking: Gebäudekauf
    trackBuildingPurchase('generator');
    
    // Kosten für den nächsten Kauf erhöhen (um 15%)
    Object.keys(generator.cost).forEach(resource => {
        generator.cost[resource] = Math.ceil(generator.cost[resource] * 1.15);
    });
    
    // Produktion neu berechnen
    calculateProduction();
    
    // UI aktualisieren
    renderGenerators();
    updateDisplay();
    
    console.log(`${generator.name} gekauft. Neue Anzahl: ${generator.amount}`);
}

// Konverter kaufen
function buyConverter(converterId) {
    const converter = gameState.converters.find(c => c.id === converterId);
    
    if (!converter || !converter.unlocked) {
        console.warn(`Konverter ${converterId} nicht gefunden oder nicht freigeschaltet`);
        return;
    }
    
    // Prüfen, ob genügend Ressourcen vorhanden sind
    if (!canAfford(converter.cost)) {
        console.log('Nicht genügend Ressourcen für:', converter.name);
        return;
    }
    
    // Statistik-Tracking: Ressourcenausgaben vor dem Abzug
    Object.keys(converter.cost).forEach(resource => {
        trackResourceSpent(resource, converter.cost[resource]);
    });
    
    // Kosten abziehen
    deductCosts(converter.cost);
    
    const isFirstPurchase = converter.amount === 0;
    
    // Konverter-Anzahl erhöhen
    converter.amount++;
    
    // Statistik-Tracking: Konverterkauf
    trackBuildingPurchase('converter');
    
    // Wenn es der erste Kauf war, Konverter als aktiv markieren
    if (isFirstPurchase) {
        toggleConverter(converter.id, true);
    }
    
    // Kosten für den nächsten Kauf erhöhen (um 20%)
    Object.keys(converter.cost).forEach(resource => {
        converter.cost[resource] = Math.ceil(converter.cost[resource] * 1.20);
    });
    
    // Produktion neu berechnen
    calculateProduction();
    
    // UI aktualisieren
    renderConverters();
    updateDisplay();
    
    console.log(`${converter.name} gekauft. Neue Anzahl: ${converter.amount}`);
}

// Upgrade kaufen
function buyUpgrade(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade || !upgrade.unlocked || upgrade.purchased) {
        console.warn(`Upgrade ${upgradeId} nicht gefunden, nicht freigeschaltet oder bereits gekauft`);
        return;
    }
    
    // Prüfen, ob genügend Ressourcen vorhanden sind
    if (!canAfford(upgrade.cost)) {
        console.log('Nicht genügend Ressourcen für:', upgrade.name);
        return;
    }
    
    // Statistik-Tracking: Ressourcenausgaben vor dem Abzug
    Object.keys(upgrade.cost).forEach(resource => {
        trackResourceSpent(resource, upgrade.cost[resource]);
    });
    
    // Kosten abziehen
    deductCosts(upgrade.cost);
    
    // Upgrade als gekauft markieren
    upgrade.purchased = true;
    
    // Statistik-Tracking: Upgrade-Kauf
    trackUpgradePurchase();
    
    // Upgrade-Effekt anwenden
    if (typeof upgrade.applyEffect === 'function') {
        upgrade.applyEffect();
        console.log(`Upgrade-Effekt angewendet: ${upgrade.name}`);
    } else {
        console.warn(`Upgrade ${upgrade.name} hat keine gültige applyEffect-Funktion!`);
    }
    
    // Produktion neu berechnen
    calculateProduction();
    
    // UI aktualisieren
    renderUpgrades();
    updateDisplay();
    
    console.log(`Upgrade "${upgrade.name}" gekauft und aktiviert.`);
}

// Resource-Sammel-Animation
function showResourceAnimation(resource, amount) {
    const container = document.querySelector('.container');
    const animation = document.createElement('div');
    
    animation.classList.add('resource-animation');
    animation.innerHTML = `+${Math.floor(amount)}${resource}`;
    animation.style.left = Math.random() * 80 + 10 + '%';
    
    container.appendChild(animation);
    
    // Animation entfernen nach Abschluss
    setTimeout(() => {
        container.removeChild(animation);
    }, 1500);
}

// Tab-Wechsel-Funktionalität
function initTabHandlers() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Aktiven Tab und Inhalt deaktivieren
            const activeTab = document.querySelector('.tab.active');
            const activeContent = document.querySelector('.tab-content.active');
            
            if (activeTab) activeTab.classList.remove('active');
            if (activeContent) activeContent.classList.remove('active');
            
            // Neuen Tab und Inhalt aktivieren
            this.classList.add('active');
            const targetContent = document.getElementById(this.dataset.tab);
            if (targetContent) {
                targetContent.classList.add('active');
            } else {
                console.warn(`Tab-Inhalt für ${this.dataset.tab} nicht gefunden!`);
            }
        });
    });
}

// Handler für das Prestige-System
function initPrestigeHandlers() {
    const prestigeBtn = document.getElementById('prestige-btn');
    
    if (!prestigeBtn) {
        console.warn('Prestige-Button nicht gefunden!');
        return;
    }
    
    // Update-Funktion für den Prestige-Button
    function updatePrestigeButton() {
        const coinsRequired = 1000000; // 1 Million Münzen
        const prestigePointsDisplay = document.getElementById('prestige-points');
        
        if (!prestigePointsDisplay) return;
        
        if (gameState.resources.coins >= coinsRequired) {
            prestigeBtn.disabled = false;
            
            // Prestige-Punkte berechnen (mit Math.log10 oder Ersatzformel)
            let newPoints;
            if (typeof Math.log10 === 'function') {
                newPoints = Math.floor(Math.log10(gameState.resources.coins / 10000));
            } else {
                // Fallback für Browser ohne Math.log10
                newPoints = Math.floor(Math.log(gameState.resources.coins / 10000) / Math.log(10));
            }
            
            prestigePointsDisplay.textContent = newPoints;
        } else {
            prestigeBtn.disabled = true;
            prestigePointsDisplay.textContent = '0';
        }
    }
    
    // Prestige-Button-Aktualisierung alle 2 Sekunden
    setInterval(updatePrestigeButton, 2000);
    
    // Prestige-Button-Klick-Handler
    prestigeBtn.addEventListener('click', function() {
        const coinsRequired = 1000000;
        
        if (gameState.resources.coins < coinsRequired) {
            return;
        }
        
        // Bestätigung anfordern
        if (!confirm('Möchtest du wirklich ein Prestige durchführen? Alle Ressourcen und Gebäude werden zurückgesetzt, aber du erhältst einen permanenten Produktionsbonus!')) {
            return;
        }
        
        // Prestige-Punkte berechnen und hinzufügen
        let newPoints;
        if (typeof Math.log10 === 'function') {
            newPoints = Math.floor(Math.log10(gameState.resources.coins / 10000));
        } else {
            // Fallback für Browser ohne Math.log10
            newPoints = Math.floor(Math.log(gameState.resources.coins / 10000) / Math.log(10));
        }
        
        gameState.prestigePoints += newPoints;
        
        // Multiplikator berechnen (1 + 0.1 pro Punkt)
        gameState.prestigeMultiplier = 1 + (gameState.prestigePoints * 0.1);
        
        // Prestige-Zähler erhöhen
        gameState.prestigeResets++;
        
        // Ressourcen zurücksetzen
        Object.keys(gameState.resources).forEach(resource => {
            gameState.resources[resource] = 0;
        });
        
        // Gebäude zurücksetzen
        if (gameState.buildings) {
            Object.keys(gameState.buildings).forEach(building => {
                gameState.buildings[building] = 0;
            });
        }
        
        // Generator- und Konverter-Anzahl zurücksetzen
        gameState.generators.forEach(generator => {
            generator.amount = 0;
            // Kosten auf Basiswerte zurücksetzen
            Object.keys(generator.cost).forEach(resource => {
                generator.cost[resource] = generator.baseCost[resource];
            });
        });
        
        gameState.converters.forEach(converter => {
            converter.amount = 0;
            // Kosten auf Basiswerte zurücksetzen
            Object.keys(converter.cost).forEach(resource => {
                converter.cost[resource] = converter.baseCost[resource];
            });
        });
        
        // Konverter-Status zurücksetzen
        gameState.activeConverters = {};
        
        // Produktion neu berechnen
        calculateProduction();
        
        // UI aktualisieren
        updateDisplay();
        renderGenerators();
        renderConverters();
        renderUpgrades();
        
        // Update anzeigen
        alert(`Prestige abgeschlossen! Du hast ${newPoints} Prestige-Punkte erhalten und dein Multiplikator ist jetzt${gameState.prestigeMultiplier.toFixed(1)}x!`);
    });
}
