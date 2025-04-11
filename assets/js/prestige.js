// prestige.js - Prestige-System

import { gameState } from './gameState.js';
import { calculateProduction } from './gameLoop.js';
import { renderGenerators, renderConverters, renderUpgrades, updateDisplay, updatePrestigeInfo } from './display.js';

// Führt einen Prestige-Reset durch, wenn genügend Ressourcen vorhanden sind
export function performPrestige() {
    if (gameState.resources.coins >= 1000000) {
        const prestigePoints = Math.floor(Math.sqrt(gameState.resources.coins / 10000));
        
        // Prestige-Statistiken aktualisieren und beibehalten
        gameState.prestigePoints += prestigePoints;
        gameState.prestigeMultiplier = 1 + (gameState.prestigePoints * 0.1); // 10% pro Prestige-Punkt
        gameState.prestigeResets++;
        
        // Prestige-Meldung anzeigen
        showPrestigeMessage(prestigePoints);
        
        // Spielstatus zurücksetzen
        resetGameState();
        
        // UI aktualisieren
        calculateProduction();
        renderGenerators();
        renderConverters();
        renderUpgrades();
        updateDisplay();
        updatePrestigeInfo();
    }
}

// Setzt den Spielstatus zurück, behält aber Prestige-bezogene Werte bei
function resetGameState() {
    // Ressourcen zurücksetzen
    Object.keys(gameState.resources).forEach(resource => {
        gameState.resources[resource] = 0;
    });
    
    // Produktion zurücksetzen
    Object.keys(gameState.production).forEach(resource => {
        gameState.production[resource] = 0;
    });
    
    // Klick-Werte zurücksetzen, aber Basis-Ressourcen beibehalten
    gameState.clickValue = {
        coins: 1,
        wood: 1,
        stone: 0,
        iron: 0,
        copper: 0
    };
    
    gameState.totalClicks = 0;
    
    // Freigeschaltete Ressourcen zurücksetzen
    Object.keys(gameState.unlockedResources).forEach(resource => {
        gameState.unlockedResources[resource] = false;
    });
    gameState.unlockedResources.coins = true;
    gameState.unlockedResources.wood = true;
    
    // Generatoren zurücksetzen
    gameState.generators.forEach(generator => {
        generator.amount = 0;
        Object.keys(generator.cost).forEach(resource => {
            generator.cost[resource] = generator.baseCost[resource];
        });
        generator.unlocked = false;
    });
    // Immer den grundlegenden Generator freischalten
    gameState.generators.find(g => g.id === 'woodcutter').unlocked = true;
    
    // Konverter zurücksetzen
    gameState.converters.forEach(converter => {
        converter.amount = 0;
        Object.keys(converter.cost).forEach(resource => {
            converter.cost[resource] = converter.baseCost[resource];
        });
        converter.unlocked = false;
    });
    
    // Upgrades zurücksetzen
    gameState.upgrades.forEach(upgrade => {
        upgrade.purchased = false;
        upgrade.unlocked = false;
    });
    // Immer das erste Upgrade freischalten
    gameState.upgrades.find(u => u.id === 'betterAxe').unlocked = true;
    
    // Errungenschaften werden nicht zurückgesetzt
}

// Zeigt eine Benachrichtigung über den Prestige-Reset an
function showPrestigeMessage(points) {
    // Temporäres Element für die Benachrichtigung erstellen
    const notification = document.createElement('div');
    notification.className = 'prestige-notification';
    notification.innerHTML = `
        <div class="prestige-icon">⭐</div>
        <div class="prestige-text">
            <h3>Prestige durchgeführt!</h3>
            <p>Du hast <strong>${points} Prestige-Punkte</strong> erhalten.</p>
            <p>Dein neuer Multiplikator ist <strong>${(1 + (gameState.prestigePoints * 0.1)).toFixed(1)}x</strong></p>
        </div>
    `;
    
    // Element zur Seite hinzufügen
    document.body.appendChild(notification);
    
    // CSS hinzufügen (falls noch nicht vorhanden)
    addPrestigeStyles();
    
    // Notification nach einiger Zeit ausblenden und entfernen
    setTimeout(() => {
        notification.classList.add('fadeout');
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 1000);
    }, 8000);
}

// Styles für Prestige-Benachrichtigungen hinzufügen
function addPrestigeStyles() {
    // Prüfen, ob Styles bereits hinzugefügt wurden
    if (!document.getElementById('prestige-notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'prestige-notification-styles';
        styleElement.textContent = `
            .prestige-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #9b59b6;
                color: white;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
                z-index: 2000;
                max-width: 400px;
                animation: zoomin 0.5s;
            }
            
            .prestige-icon {
                font-size: 40px;
                margin-bottom: 15px;
            }
            
            .prestige-text h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 24px;
            }
            
            .prestige-text p {
                margin: 5px 0;
            }
            
            @keyframes zoomin {
                from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            .prestige-notification.fadeout {
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

// Berechnet die Prestige-Punkte, die beim Reset erhalten werden
export function calculatePrestigePoints() {
    return Math.floor(Math.sqrt(gameState.resources.coins / 10000));
}
