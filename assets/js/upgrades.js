// upgrades.js - Freischaltungen und Upgrade-Logik

import { gameState } from './gameState.js';
import { renderGenerators, renderConverters, renderUpgrades, updateDisplay } from './display.js';
import { calculateProduction } from './gameLoop.js';

// Prüft auf Freischaltungen basierend auf Ressourcen und anderen Bedingungen
export function checkUnlocks() {
    // Freischaltungen prüfen
    const unlocksChanged = checkResourceUnlocks() || 
                        checkGeneratorUnlocks() || 
                        checkConverterUnlocks() || 
                        checkUpgradeUnlocks();
    
    // Debug-Ausgabe für Freischaltungen
    if (unlocksChanged) {
        console.log("Neue Freischaltungen verfügbar. Aktualisiere UI...");
    }
    
    // UI nur aktualisieren, wenn sich etwas geändert hat
    if (unlocksChanged) {
        renderGenerators();
        renderConverters();
        renderUpgrades();
        updateDisplay();
        
        // Produktion neu berechnen, falls neue Gebäude freigeschaltet wurden
        calculateProduction();
    }
}

// Prüft auf Ressourcen-Freischaltungen
function checkResourceUnlocks() {
    let changed = false;
    
    // Primäre Ressourcen freischalten
    if (gameState.resources.wood >= 20 && !gameState.unlockedResources.stone) {
        gameState.unlockedResources.stone = true;
        changed = true;
        console.log("Ressource freigeschaltet: Stein");
    }
    
    if (gameState.resources.stone >= 30 && !gameState.unlockedResources.iron) {
        gameState.unlockedResources.iron = true;
        changed = true;
        console.log("Ressource freigeschaltet: Eisen");
    }
    
    if (gameState.resources.iron >= 20 && !gameState.unlockedResources.copper) {
        gameState.unlockedResources.copper = true;
        changed = true;
        console.log("Ressource freigeschaltet: Kupfer");
    }
    
    // Sekundäre Ressourcen freischalten
    if (gameState.resources.wood >= 40 && !gameState.unlockedResources.planks) {
        gameState.unlockedResources.planks = true;
        changed = true;
        console.log("Ressource freigeschaltet: Bretter");
    }
    
    if (gameState.resources.stone >= 60 && !gameState.unlockedResources.bricks) {
        gameState.unlockedResources.bricks = true;
        changed = true;
        console.log("Ressource freigeschaltet: Ziegel");
    }
    
    // Tertiäre Ressourcen freischalten
    if (gameState.resources.iron >= 40 && gameState.resources.planks >= 20 && !gameState.unlockedResources.tools) {
        gameState.unlockedResources.tools = true;
        changed = true;
        console.log("Ressource freigeschaltet: Werkzeuge");
    }
    
    if (gameState.resources.copper >= 30 && gameState.resources.iron >= 20 && !gameState.unlockedResources.jewelry) {
        gameState.unlockedResources.jewelry = true;
        changed = true;
        console.log("Ressource freigeschaltet: Schmuck");
    }
    
    return changed;
}

// Generatoren freischalten - GEÄNDERT: Alle Generatoren von Anfang an sichtbar machen
function checkGeneratorUnlocks() {
    let changed = false;
    
    // Alle Generatoren von Anfang an anzeigen
    gameState.generators.forEach(generator => {
        if (!generator.unlocked) {
            generator.unlocked = true;
            changed = true;
            console.log(`Generator freigeschaltet (Anzeige): ${generator.name}`);
        }
    });
    
    return changed;
}

// Konverter freischalten - GEÄNDERT: Alle Konverter von Anfang an sichtbar machen
function checkConverterUnlocks() {
    let changed = false;
    
    // Alle Konverter von Anfang an anzeigen
    gameState.converters.forEach(converter => {
        if (!converter.unlocked) {
            converter.unlocked = true;
            changed = true;
            console.log(`Konverter freigeschaltet (Anzeige): ${converter.name}`);
        }
    });
    
    return changed;
}

// Upgrades freischalten - GEÄNDERT: Alle Upgrades von Anfang an sichtbar machen
function checkUpgradeUnlocks() {
    let changed = false;
    
    // Alle Upgrades von Anfang an anzeigen
    gameState.upgrades.forEach(upgrade => {
        if (!upgrade.unlocked) {
            upgrade.unlocked = true;
            changed = true;
            console.log(`Upgrade freigeschaltet (Anzeige): ${upgrade.name}`);
        }
    });
    
    return changed;
}

// NEUER EXPORT: Funktion zur manuellen Überprüfung und Korrektur der Upgrade-Zustände
export function verifyAndFixUpgradeStates() {
    let fixedAny = false;
    
    // Überprüfen ob Upgrades korrekt freigeschaltet sind
    gameState.upgrades.forEach(upgrade => {
        // Für 'betterAxe' (immer freigeschaltet)
        if (upgrade.id === 'betterAxe' && !upgrade.unlocked) {
            upgrade.unlocked = true;
            console.log("Upgrade-Zustand korrigiert: Bessere Axt");
            fixedAny = true;
        }
        
        // Für 'stonePickaxe'
        if (upgrade.id === 'stonePickaxe' && gameState.resources.stone >= 10 && !upgrade.unlocked) {
            upgrade.unlocked = true;
            console.log("Upgrade-Zustand korrigiert: Steinspitzhacke");
            fixedAny = true;
        }
        
        // Für 'ironPickaxe'
        if (upgrade.id === 'ironPickaxe' && gameState.resources.iron >= 10 && !upgrade.unlocked) {
            upgrade.unlocked = true;
            console.log("Upgrade-Zustand korrigiert: Eisenspitzhacke");
            fixedAny = true;
        }
        
        // Für 'copperPickaxe'
        if (upgrade.id === 'copperPickaxe' && gameState.resources.copper >= 10 && !upgrade.unlocked) {
            upgrade.unlocked = true;
            console.log("Upgrade-Zustand korrigiert: Kupferspitzhacke");
            fixedAny = true;
        }
        
        // Für 'efficientWoodcutters'
        if (upgrade.id === 'efficientWoodcutters' && gameState.resources.wood >= 40 && !upgrade.unlocked) {
            upgrade.unlocked = true;
            console.log("Upgrade-Zustand korrigiert: Effiziente Holzfäller");
            fixedAny = true;
        }
    });
    
    if (fixedAny) {
        renderUpgrades();
    }
    
    return fixedAny;
}