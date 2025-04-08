// market.js - Marktstand-Verkaufssystem

import { gameState } from './gameState.js';
import { saveGame } from './storage.js';
import { updateDisplay, formatNumber, capitalizeFirstLetter } from './display.js';
import { calculateProduction } from './gameLoop.js';
// Import der Tracking-Funktionen für Statistiken
import { trackResourceSpent, trackResourceGain } from './statistics.js';

// Marktstand-Konfiguration
export const marketConfig = {
    // Ressourcen, die verkauft werden können
    sellableResources: [
        'wood', 'stone', 'iron', 'copper', 'planks', 'bricks', 'tools', 'jewelry'
    ],
    
    // Basis-Preise pro Einheit (in Münzen)
    basePrice: {
        wood: 1,
        stone: 2,
        iron: 5,
        copper: 7,
        planks: 3,
        bricks: 6,
        tools: 15,
        jewelry: 25
    },
    
    // Mindestpreis pro Einheit, um Nullwerte zu vermeiden
    minPrice: 0.1,
    
    // Verkaufsrate pro Sekunde (basierend auf Marktstand-Level)
    getSellRate: function(marketLevel) {
        if (marketLevel <= 0) return 0;
        // Minimale Rate von 0.2/s, +0.1 pro Level
        return Math.max(0.2, 0.2 * (1 + (marketLevel * 0.5)));
    },
    
    // Preismultiplikator (steigt mit Marktstand-Level)
    getPriceMultiplier: function(marketLevel) {
        if (marketLevel <= 0) return 0;
        // Minimaler Multiplikator von 1.0, +5% pro Level
        return Math.max(1.0, 1 + (marketLevel * 0.05));
    }
};

// Aktive Verkäufe (welche Ressourcen werden gerade verkauft)
export const activeMarketSales = {
    // Format: { resource: true/false }
};

// Verkaufsstatistiken
export const marketStats = {
    totalResourcesSold: {}, // Gesamt verkaufte Ressourcen
    totalCoinsEarned: 0,    // Gesamt verdiente Münzen durch Verkauf
    // Format: { resource: amount }
};

// Marktstand-System initialisieren
export function initMarketSystem() {
    console.log('Initialisiere Marktstand-System...');
    
    // Aktive Verkäufe für alle verkaufbaren Ressourcen initialisieren
    marketConfig.sellableResources.forEach(resource => {
        activeMarketSales[resource] = false;
        
        // Verkaufsstatistiken initialisieren
        if (!marketStats.totalResourcesSold[resource]) {
            marketStats.totalResourcesSold[resource] = 0;
        }
    });
    
    // UI-Elemente für das Marktstand-System erstellen
    createMarketUI();
    
    // Event-Listener für Marktstand-UI hinzufügen
    initMarketEventListeners();
    
    console.log('Marktstand-System initialisiert.');
}

// Ressourcen über den Marktstand verkaufen (wird jede Sekunde aufgerufen)
export function processMarketSales() {
    // Marktstand-Level bestimmen (Anzahl der gebauten Marktstände)
    const marketGenerator = gameState.generators.find(g => g.id === 'market');
    if (!marketGenerator || marketGenerator.amount === 0) return;
    
    const marketLevel = marketGenerator.amount;
    const sellRate = marketConfig.getSellRate(marketLevel);
    const priceMultiplier = marketConfig.getPriceMultiplier(marketLevel);
    
    let totalCoinsEarned = 0;
    
    // Für jede aktive Verkaufsressource
    Object.keys(activeMarketSales).forEach(resource => {
        if (activeMarketSales[resource] && gameState.resources[resource] > 0) {
            // Berechnen, wie viel verkauft werden kann (basierend auf Rate und verfügbaren Ressourcen)
            const maxToSell = Math.min(sellRate, gameState.resources[resource]);
            
            if (maxToSell > 0) {
                // Ressourcen vom Bestand abziehen
                gameState.resources[resource] -= maxToSell;
                
                // Münzen basierend auf Preis hinzufügen
                const price = Math.max(marketConfig.minPrice, marketConfig.basePrice[resource] * priceMultiplier);
                const earned = maxToSell * price;
                
                // Sicherstellen, dass earned ein positiver Wert ist
                if (earned > 0) {
                    gameState.resources.coins += earned;
                    totalCoinsEarned += earned;
                    
                    // Statistiken aktualisieren
                    marketStats.totalResourcesSold[resource] += maxToSell;
                    marketStats.totalCoinsEarned += earned;
                    
                    // Tracking für Statistiken
                    trackResourceSpent(resource, maxToSell);
                    trackResourceGain('coins', earned);
                    
                    // Verkaufsanimation anzeigen
                    showSaleAnimation(resource, maxToSell, earned);
                }
            }
        }
    });
    
    // UI aktualisieren bei aktivem Verkauf
    if (totalCoinsEarned > 0) {
        updateDisplay();
        
        // Gelegentlich speichern
        if (Math.random() < 0.1) { // 10% Chance pro Sekunde
            saveGame();
        }
    }
}

// Erstellt die UI-Elemente für das Marktstand-System
function createMarketUI() {
    // UI nur erstellen, wenn der Container existiert
    const marketContainer = document.getElementById('market-sales-container');
    if (!marketContainer) return;
    
    let html = `
        <h3>Marktstand-Verkäufe</h3>
    `;
    
    // Marktstand-Level und Informationen anzeigen
    const marketGenerator = gameState.generators.find(g => g.id === 'market');
    const marketLevel = marketGenerator ? marketGenerator.amount : 0;
    
    if (marketLevel === 0) {
        html += `
            <div class="market-info">
                <p>Du hast noch keinen Marktstand gebaut. Baue einen Marktstand unter "Ressourcen-Sammler", um Ressourcen verkaufen zu können.</p>
            </div>
        `;
        marketContainer.innerHTML = html;
        return;
    }
    
    html += `
        <p>Wähle Ressourcen zum Verkaufen aus:</p>
        <div class="market-resources-grid">
    `;
    
    // Für jede verkaufbare Ressource eine Karte erstellen
    marketConfig.sellableResources.forEach(resource => {
        // Nur Ressourcen anzeigen, die freigeschaltet sind
        if (gameState.unlockedResources[resource]) {
            const basePrice = marketConfig.basePrice[resource];
            const actualPrice = Math.max(marketConfig.minPrice, basePrice * marketConfig.getPriceMultiplier(marketLevel));
            
            html += `
                <div class="market-resource-card" data-resource="${resource}">
                    <div class="market-resource-header">
                        <span class="resource-icon ${resource}-icon"></span>
                        <span>${capitalizeFirstLetter(resource)}</span>
                    </div>
                    <div class="market-resource-info">
                        <div>Preis: <span class="resource-price">${actualPrice.toFixed(1)}</span> Münzen</div>
                        <div>Aktuell: <span class="resource-amount">${formatNumber(gameState.resources[resource])}</span></div>
                    </div>
                    <button class="market-toggle-btn ${activeMarketSales[resource] ? 'active' : ''}" data-resource="${resource}">
                        ${activeMarketSales[resource] ? 'Verkauf stoppen' : 'Verkaufen starten'}
                    </button>
                </div>
            `;
        }
    });
    
    html += `
        </div>
        <div class="market-stats">
            <h4>Marktstatistiken</h4>
            <div class="market-stats-grid">
                <div class="market-stat">
                    <div class="market-stat-label">Marktstände</div>
                    <div class="market-stat-value" id="market-level">${marketLevel}</div>
                </div>
                <div class="market-stat">
                    <div class="market-stat-label">Verkaufsrate</div>
                    <div class="market-stat-value" id="market-sell-rate">${marketConfig.getSellRate(marketLevel).toFixed(1)}/s</div>
                </div>
                <div class="market-stat">
                    <div class="market-stat-label">Preismultiplikator</div>
                    <div class="market-stat-value" id="market-price-multiplier">${marketConfig.getPriceMultiplier(marketLevel).toFixed(2)}x</div>
                </div>
                <div class="market-stat">
                    <div class="market-stat-label">Gesamt verdient</div>
                    <div class="market-stat-value" id="market-total-earned">${formatNumber(marketStats.totalCoinsEarned)}</div>
                </div>
            </div>
        </div>
    `;
    
    marketContainer.innerHTML = html;
}

// Event-Listener für die Marktstand-UI initialisieren
function initMarketEventListeners() {
    // Event-Delegation für alle Verkaufsschalter
    document.addEventListener('click', function(event) {
        const toggleButton = event.target.closest('.market-toggle-btn');
        if (!toggleButton) return;
        
        const resource = toggleButton.getAttribute('data-resource');
        
        // Verkaufsstatus umschalten
        activeMarketSales[resource] = !activeMarketSales[resource];
        
        // Button-Text und Klasse aktualisieren
        toggleButton.textContent = activeMarketSales[resource] ? 'Verkauf stoppen' : 'Verkaufen starten';
        toggleButton.classList.toggle('active', activeMarketSales[resource]);
        
        // Statistiken aktualisieren
        updateMarketStats();
    });
}

// Aktualisiert die Marktstatistik-Anzeige
export function updateMarketStats() {
    // Marktstand-Level bestimmen
    const marketGenerator = gameState.generators.find(g => g.id === 'market');
    if (!marketGenerator) return;
    
    const marketLevel = marketGenerator.amount;
    
    // Prüfen, ob der Tab aktiv ist und neu rendern
    const marketTab = document.querySelector('.tab-content#market');
    if (marketTab && marketTab.classList.contains('active')) {
        // Komplette UI neu erstellen, um alle Werte zu aktualisieren
        createMarketUI();
    }
}

// Zeigt eine Animation für einen Verkauf an
function showSaleAnimation(resource, amount, earned) {
    const marketCard = document.querySelector(`.market-resource-card[data-resource="${resource}"]`);
    if (!marketCard) return;
    
    // Werte korrekt formatieren (auf 1 Dezimalstelle runden, um zu kleine Zahlen zu vermeiden)
    const roundedAmount = Math.max(0.1, Math.round(amount * 10) / 10);
    const roundedEarned = Math.max(0.1, Math.round(earned * 10) / 10);
    
    // Temporäres Element für die Verkaufsanimation
    const animation = document.createElement('div');
    animation.className = 'market-sale-animation';
    animation.innerHTML = `
        -$${roundedAmount}$$ {resource}
        <span class="market-sale-earned">+${roundedEarned} coins</span>
    `;
    
    // Animation zur Karte hinzufügen
    marketCard.appendChild(animation);
    
    // Animation nach kurzer Zeit wieder entfernen
    setTimeout(() => {
        animation.classList.add('fadeout');
        setTimeout(() => {
            if (marketCard.contains(animation)) {
                marketCard.removeChild(animation);
            }
        }, 500);
    }, 1000);
}
