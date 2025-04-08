// gameState.js - Definition des Spielzustands und der Ressourcen

// Initialer Spielstatus - wird exportiert, damit andere Module darauf zugreifen können
export const gameState = {
    resources: {
        coins: 0,
        wood: 0,
        stone: 0,
        iron: 0,
        copper: 0,
        planks: 0,
        bricks: 0,
        tools: 0,
        jewelry: 0
    },
    production: {
        coins: 0,
        wood: 0,
        stone: 0,
        iron: 0,
        copper: 0,
        planks: 0,
        bricks: 0,
        tools: 0,
        jewelry: 0
    },
    // OPTIMIERUNG: Zu Beginn nur Holz sammelbar
    clickValue: {
        coins: 0,
        wood: 1,
        stone: 0,
        iron: 0,
        copper: 0
    },
    totalClicks: 0,
    startTime: Date.now(),
    lastSaveTime: Date.now(),
    prestigePoints: 0,
    prestigeMultiplier: 1,
    prestigeResets: 0,
    unlockedResources: {
        coins: true,
        wood: true,
        stone: false,
        iron: false,
        copper: false,
        planks: false,
        bricks: false,
        tools: false,
        jewelry: false
    },
    // OPTIMIERUNG: Aktive Konverter (standardmäßig alle aktiv)
    activeConverters: {},
    // Generator definitions
    generators: [
        // Primary resource generators
        { id: 'woodcutter', name: 'Holzfäller', resource: 'wood', baseCost: { coins: 10 }, cost: { coins: 10 }, baseOutput: 0.5, amount: 0, unlocked: true },
        { id: 'miner', name: 'Steinmetz', resource: 'stone', baseCost: { coins: 50, wood: 20 }, cost: { coins: 50, wood: 20 }, baseOutput: 0.3, amount: 0, unlocked: true },
        { id: 'ironMiner', name: 'Eisenmine', resource: 'iron', baseCost: { coins: 200, wood: 50, stone: 50 }, cost: { coins: 200, wood: 50, stone: 50 }, baseOutput: 0.2, amount: 0, unlocked: true },
        { id: 'copperMiner', name: 'Kupfermine', resource: 'copper', baseCost: { coins: 300, wood: 100, stone: 80 }, cost: { coins: 300, wood: 100, stone: 80 }, baseOutput: 0.1, amount: 0, unlocked: true },
        
        // OPTIMIERUNG: Marktstand produziert keine Münzen mehr, ist nur noch für den Ressourcenverkauf zuständig
        { id: 'market', name: 'Marktstand', resource: 'none', baseCost: { wood: 30 }, cost: { wood: 30 }, baseOutput: 0, amount: 0, unlocked: true, description: 'Ermöglicht den Verkauf von Ressourcen' },
        { id: 'bank', name: 'Bank', resource: 'coins', baseCost: { wood: 100, stone: 50 }, cost: { wood: 100, stone: 50 }, baseOutput: 2, amount: 0, unlocked: true }
    ],
    
    // Converter definitions
    converters: [
        { id: 'sawmill', name: 'Sägewerk', input: { wood: 2 }, output: { planks: 1 }, baseCost: { coins: 100, wood: 50 }, cost: { coins: 100, wood: 50 }, baseSpeed: 0.2, amount: 0, unlocked: true },
        { id: 'brickmaker', name: 'Ziegelei', input: { stone: 3 }, output: { bricks: 1 }, baseCost: { coins: 200, wood: 80, stone: 40 }, cost: { coins: 200, wood: 80, stone: 40 }, baseSpeed: 0.15, amount: 0, unlocked: true },
        { id: 'toolsmith', name: 'Werkzeugschmiede', input: { iron: 2, planks: 1 }, output: { tools: 1 }, baseCost: { coins: 500, planks: 50, iron: 30 }, cost: { coins: 500, planks: 50, iron: 30 }, baseSpeed: 0.1, amount: 0, unlocked: true },
        { id: 'jeweler', name: 'Schmuckwerkstatt', input: { copper: 2, iron: 1 }, output: { jewelry: 1 }, baseCost: { coins: 800, planks: 100, bricks: 50 }, cost: { coins: 800, planks: 100, bricks: 50 }, baseSpeed: 0.05, amount: 0, unlocked: true }
    ],
    
    // Upgrades
    upgrades: [
        // Clicking upgrades
        { id: 'betterAxe', name: 'Bessere Axt', cost: { coins: 50 }, purchased: false, unlocked: true, effect: 'Verdoppelt die Holzmenge pro Klick', applyEffect: () => { gameState.clickValue.wood *= 2; } },
        { id: 'stonePickaxe', name: 'Steinspitzhacke', cost: { coins: 150, wood: 50 }, purchased: false, unlocked: true, effect: 'Ermöglicht das Sammeln von Stein durch Klicken', applyEffect: () => { gameState.clickValue.stone = 1; } },
        { id: 'ironPickaxe', name: 'Eisenspitzhacke', cost: { coins: 400, wood: 100, stone: 80 }, purchased: false, unlocked: true, effect: 'Ermöglicht das Sammeln von Eisen durch Klicken', applyEffect: () => { gameState.clickValue.iron = 1; } },
        { id: 'copperPickaxe', name: 'Kupferspitzhacke', cost: { coins: 600, wood: 150, stone: 120 }, purchased: false, unlocked: true, effect: 'Ermöglicht das Sammeln von Kupfer durch Klicken', applyEffect: () => { gameState.clickValue.copper = 1; } },
        
        // Generator upgrades
        { id: 'efficientWoodcutters', name: 'Effiziente Holzfäller', cost: { coins: 200, wood: 100 }, purchased: false, unlocked: true, effect: 'Verdoppelt die Produktion von Holzfällern', applyEffect: () => { applyUpgradeToGenerator('woodcutter', 2); } },
        { id: 'efficientMiners', name: 'Effiziente Steinmetze', cost: { coins: 500, stone: 150 }, purchased: false, unlocked: true, effect: 'Verdoppelt die Produktion von Steinmetzen', applyEffect: () => { applyUpgradeToGenerator('miner', 2); } },
        
        // Converter upgrades
        { id: 'fastSawmill', name: 'Schnelle Sägewerke', cost: { coins: 300, planks: 50 }, purchased: false, unlocked: true, effect: 'Verdoppelt die Geschwindigkeit von Sägewerken', applyEffect: () => { applyUpgradeToConverter('sawmill', 2); } },
        { id: 'fastBrickmaker', name: 'Schnelle Ziegelei', cost: { coins: 600, bricks: 50 }, purchased: false, unlocked: true, effect: 'Verdoppelt die Geschwindigkeit von Ziegeleien', applyEffect: () => { applyUpgradeToConverter('brickmaker', 2); } }
    ],
    
    achievements: [
        // Resource milestones
        { id: 'woodAch1', name: 'Holzsammler', requirement: () => gameState.resources.wood >= 100, achieved: false, description: '100 Holz gesammelt' },
        { id: 'stoneAch1', name: 'Steinbruch', requirement: () => gameState.resources.stone >= 100, achieved: false, description: '100 Stein gesammelt' },
        { id: 'ironAch1', name: 'Eisenzeit', requirement: () => gameState.resources.iron >= 50, achieved: false, description: '50 Eisen gesammelt' },
        { id: 'planksAch1', name: 'Zimmermann', requirement: () => gameState.resources.planks >= 50, achieved: false, description: '50 Bretter hergestellt' },
        { id: 'toolsAch1', name: 'Werkzeugmacher', requirement: () => gameState.resources.tools >= 20, achieved: false, description: '20 Werkzeuge hergestellt' },
        { id: 'jewelryAch1', name: 'Juwelier', requirement: () => gameState.resources.jewelry >= 10, achieved: false, description: '10 Schmuckstücke hergestellt' },
        
        // Click milestones
        { id: 'clickAch1', name: 'Fleißiger Klicker', requirement: () => gameState.totalClicks >= 100, achieved: false, description: '100 mal geklickt' },
        { id: 'clickAch2', name: 'Klick-Enthusiast', requirement: () => gameState.totalClicks >= 500, achieved: false, description: '500 mal geklickt' },
        
        // Building milestones
        { id: 'buildingAch1', name: 'Baumeister', requirement: () => getTotalBuildings() >= 10, achieved: false, description: 'Insgesamt 10 Gebäude gebaut' },
        { id: 'converterAch1', name: 'Fabrikant', requirement: () => getTotalConverters() >= 5, achieved: false, description: 'Insgesamt 5 Konverter gebaut' }
    ]
};

// OPTIMIERUNG: Funktion zum Initialisieren der aktiven Konverter
export function initActiveConverters() {
    // Alle Konverter standardmäßig auf aktiv setzen, falls sie existieren
    gameState.converters.forEach(converter => {
        if (converter.amount > 0 && gameState.activeConverters[converter.id] === undefined) {
            gameState.activeConverters[converter.id] = true;
        }
    });
}

// OPTIMIERUNG: Funktion zum Ein- oder Ausschalten eines Konverters
export function toggleConverter(converterId, state = null) {
    // Wenn kein expliziter Status übergeben wird, umschalten
    if (state === null) {
        gameState.activeConverters[converterId] = !gameState.activeConverters[converterId];
    } else {
        gameState.activeConverters[converterId] = state;
    }
    
    return gameState.activeConverters[converterId];
}

// OPTIMIERUNG: Funktion zum Prüfen, ob ein Konverter aktiv ist
export function isConverterActive(converterId) {
    return gameState.activeConverters[converterId] === true;
}

// Hilfsfunktionen für Achievements
export function getTotalBuildings() {
    return gameState.generators.reduce((total, generator) => total + generator.amount, 0) +
           gameState.converters.reduce((total, converter) => total + converter.amount, 0);
}

export function getTotalConverters() {
    return gameState.converters.reduce((total, converter) => total + converter.amount, 0);
}

// Upgrade-Funktionen
export function applyUpgradeToGenerator(generatorId, multiplier) {
    const generator = gameState.generators.find(g => g.id === generatorId);
    if (generator) {
        generator.baseOutput *= multiplier;
    }
}

export function applyUpgradeToConverter(converterId, multiplier) {
    const converter = gameState.converters.find(c => c.id === converterId);
    if (converter) {
        converter.baseSpeed *= multiplier;
    }
}

// Hilfsfunktionen für die Ressourcenüberprüfung
export function canAfford(costs) {
    let affordable = true;
    Object.keys(costs).forEach(resource => {
        if (gameState.resources[resource] < costs[resource]) {
            affordable = false;
        }
    });
    return affordable;
}

// Funktion zum Abziehen von Kosten
export function deductCosts(costs) {
    Object.keys(costs).forEach(resource => {
        gameState.resources[resource] -= costs[resource];
    });
}

// In gameState.js - Neue Funktion zur Berechnung der Gesamteffizienz
export function getGeneratorEfficiency(generatorId) {
    const generator = gameState.generators.find(g => g.id === generatorId);
    if (!generator) return 1.0;
    
    // Basis-Effizienz (Prestige-Multiplikator)
    let efficiency = gameState.prestigeMultiplier;
    
    // Weitere Faktoren einbeziehen (z.B. Upgrades, temporäre Boosts)
    // Beispiel: Upgrade-Effekte
    if (generator.id === 'woodcutter' && gameState.upgrades.find(u => u.id === 'efficientWoodcutters')?.purchased) {
        efficiency *= 2;
    }
    
    // Ressourcenknappheit berücksichtigen (falls implementiert)
    if (typeof window.scarcitySystem !== 'undefined' && 
        window.scarcitySystem.efficiencyMultipliers && 
        window.scarcitySystem.efficiencyMultipliers[generator.resource]) {
        efficiency *= window.scarcitySystem.efficiencyMultipliers[generator.resource];
    }
    
    return efficiency;
}
