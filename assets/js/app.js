import { GAME_CONFIG } from './gameConfig.js';

class Game {
    constructor() {
    this.resources = {
        wood: { 
            amount: 0, 
            production: 0,
            maxStorage: GAME_CONFIG.RESOURCES.WOOD.baseStorage
        },
        stone: { 
            amount: 0, 
            production: 0,
            maxStorage: GAME_CONFIG.RESOURCES.STONE.baseStorage
        }
    };
    
    this.buildings = {
        woodcutter: { 
            level: GAME_CONFIG.INITIAL_STATE.buildings.WOODCUTTER,
            baseCost: { wood: 10 }, 
            production: { wood: 0.5 } 
        },
        quarry: { 
            level: GAME_CONFIG.INITIAL_STATE.buildings.QUARRY, 
            baseCost: { wood: 50 },
            production: { stone: 0.3 } 
        }
    };

    this.upgrades = {
        BETTER_TOOLS: { 
            purchased: false, 
            cost: { wood: 100, stone: 50 }, 
            multiplier: 1.5 
        },
        LARGER_STORAGE: {
            purchased: false,
            cost: { wood: 90, stone: 45 },
            multiplier: 2.0
        }
    };

    this.achievements = {
        woodCollector: { earned: false, requirement: 1000, progress: 0 }
    };

    // NEUE ZEILE HINZUFÜGEN:
    this.resourcesProduced = {
        wood: 0,
        stone: 0
    };

    this.lastUpdate = Date.now();
    this.totalProduction = 0;
    this.startTime = Date.now();
    this.lastStorageCheck = Date.now();
    this.storageCheckInterval = 10000;

    this.initializeUI();
    this.loadGame();
    this.startGameLoop();
}


    initializeUI() {
        console.log("UI-Initialisierung beginnt...");

        // Loading Screen sofort entfernen
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';

        // Event-Listener für Gebäude
        document.querySelectorAll('.building').forEach(building => {
            console.log("Füge Building-Event-Listener hinzu:", building.dataset.building);
            building.querySelector('.upgrade-button').addEventListener('click', () => {
                this.upgradeBuilding(building.dataset.building);
            });
        });

        // Event-Listener für Upgrades
        document.querySelectorAll('.upgrade').forEach(upgrade => {
            upgrade.querySelector('.buy-button').addEventListener('click', () => {
                this.purchaseUpgrade(upgrade.dataset.upgrade);
            });
        });

        // Event-Listener für Settings
        document.getElementById('settings-button').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        // Event-Listener für Modal schließen
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        // Event-Listener für Speichern
        document.getElementById('save-button').addEventListener('click', () => {
            this.saveGame();
            this.showNotification('Spiel gespeichert!', 'success');
        });

        // Automatisches Speichern alle 60 Sekunden
        setInterval(() => {
            this.saveGame();
            console.log('Spiel automatisch gespeichert');
        }, GAME_CONFIG.STORAGE.AUTO_SAVE_INTERVAL);

        this.updateUI(); // Initiales UI-Update
    }

    update(delta) {
    // Ressourcenproduktion mit Begrenzung
    for (const [buildingName, building] of Object.entries(this.buildings)) {
        for (const [resource, production] of Object.entries(building.production)) {
            const totalProduction = production * building.level * delta;
            
            // Prüfe Speicherlimit
            const currentAmount = this.resources[resource].amount;
            const maxStorage = this.resources[resource].maxStorage;
            const newAmount = currentAmount + totalProduction;
            
            // Begrenze auf maximale Speicherkapazität
            this.resources[resource].amount = Math.min(newAmount, maxStorage);
            this.resources[resource].production = production * building.level;
            
            // NEUE ZEILE: Zähle die Gesamtproduktion, auch wenn der Speicher voll ist
            this.resourcesProduced[resource] += totalProduction;
            
            // Nur zur Statistik hinzufügen, wenn tatsächlich produziert wurde
            if (newAmount <= maxStorage) {
                this.totalProduction += totalProduction;
            }

            // Speicher-Warnung (nur alle 10 Sekunden prüfen)
            const now = Date.now();
            if (now - this.lastStorageCheck >= this.storageCheckInterval) {
                if (this.resources[resource].amount >= maxStorage * GAME_CONFIG.BALANCE.CRITICAL_STORAGE_THRESHOLD) {
                    this.showNotification(
                        `${resource.charAt(0).toUpperCase() + resource.slice(1)}-Speicher fast voll!`, 
                        'warning'
                    );
                }
                this.lastStorageCheck = now;
            }
        }
    }

    // Achievement-Prüfung
    this.checkAchievements();

    // UI aktualisieren
    this.updateUI();
}

    checkAchievements() {
		// Holzsammler-Achievement
		if (!this.achievements.woodCollector.earned) {
			// Nutze die Gesamtproduktion statt der aktuellen Menge
			this.achievements.woodCollector.progress = this.resourcesProduced.wood;
			console.log("Achievement Fortschritt:", {
            progress: this.achievements.woodCollector.progress,
            requirement: this.achievements.woodCollector.requirement,
            totalWoodProduced: this.resourcesProduced.wood
			});
        
			if (this.achievements.woodCollector.progress >= this.achievements.woodCollector.requirement) {
            this.achievements.woodCollector.earned = true;
            this.showNotification('Erfolg freigeschaltet: Holzsammler!', 'success');
            this.applyAchievementBonus('woodCollector');
			}
		}
	}


    applyAchievementBonus(achievementName) {
        if (achievementName === 'woodCollector') {
            // 10% Bonus auf Holzproduktion
            const woodcutter = this.buildings.woodcutter;
            woodcutter.production.wood *= 1.1;
        }
    }

    updateUI() {
        // Ressourcen aktualisieren
        for (const [resource, data] of Object.entries(this.resources)) {
            const element = document.querySelector(`[data-resource="${resource}"]`);
            if (element) {
                const amountElement = element.querySelector('.resource-amount');
                const rateElement = element.querySelector('.resource-rate');
                const storageElement = element.querySelector('.resource-storage');
                
                if (amountElement) {
                    amountElement.textContent = Math.floor(data.amount);
                    // Färbe rot wenn fast voll
                    amountElement.classList.toggle('near-full', 
                        data.amount >= data.maxStorage * GAME_CONFIG.BALANCE.CRITICAL_STORAGE_THRESHOLD);
                }
                if (rateElement) rateElement.textContent = `+${data.production.toFixed(1)}/s`;
                if (storageElement) storageElement.textContent = data.maxStorage;
            }
        }

        // Gebäude aktualisieren
        for (const [buildingName, building] of Object.entries(this.buildings)) {
            const element = document.querySelector(`[data-building="${buildingName}"]`);
            if (element) {
                element.querySelector('.building-level').textContent = `Level: ${building.level}`;
                const cost = this.calculateBuildingCost(buildingName);
                const costText = Object.entries(cost)
                    .map(([resource, amount]) => `${amount} ${resource}`)
                    .join(', ');
                element.querySelector('.building-cost').textContent = `Kosten: ${costText}`;
                
                // Produktionsanzeige aktualisieren
                const productionText = Object.entries(building.production)
                    .map(([resource, amount]) => `${(amount * building.level).toFixed(1)} ${resource}/s`)
                    .join(', ');
                element.querySelector('.building-production').textContent = `Produktion: ${productionText}`;
                
                // Button-Status aktualisieren
                const button = element.querySelector('.upgrade-button');
                button.disabled = !this.canAfford(cost);
                if (building.level >= GAME_CONFIG.BUILDINGS[buildingName.toUpperCase()].maxLevel) {
                    button.disabled = true;
                    button.textContent = 'Max Level';
                }
            }
        }

        // Upgrades aktualisieren
        for (const [upgradeName, upgrade] of Object.entries(this.upgrades)) {
            const element = document.querySelector(`[data-upgrade="${upgradeName}"]`);
            if (element) {
                const button = element.querySelector('.buy-button');
                button.disabled = upgrade.purchased || !this.canAfford(upgrade.cost);
                if (upgrade.purchased) {
                    button.textContent = 'Gekauft';
                }
            }
        }

        // Achievements aktualisieren
        for (const [achievementName, achievement] of Object.entries(this.achievements)) {
            const element = document.querySelector(`[data-achievement="${achievementName}"]`);
            if (element) {
                const progressElement = element.querySelector('.achievement-progress');
                if (progressElement) {
                    progressElement.textContent = `${Math.floor(achievement.progress)}/${achievement.requirement}`;
                    if (achievement.earned) {
                        element.classList.add('earned');
                    }
                }
            }
        }

        // Spielzeit aktualisieren
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(playTime / 3600);
        const minutes = Math.floor((playTime % 3600) / 60);
        const seconds = playTime % 60;
        document.getElementById('playtime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Gesamtproduktion aktualisieren
        document.getElementById('total-production').textContent = Math.floor(this.totalProduction);
    }

    startGameLoop() {
        setInterval(() => {
            const now = Date.now();
            const delta = (now - this.lastUpdate) / 1000;
            this.update(delta);
            this.lastUpdate = now;
        }, 1000 / GAME_CONFIG.TICK_RATE);
    }

    upgradeBuilding(buildingName) {
        const building = this.buildings[buildingName];
        const config = GAME_CONFIG.BUILDINGS[buildingName.toUpperCase()];
        
        // Prüfe Max Level
        if (building.level >= config.maxLevel) {
            this.showNotification(`${config.name} ist bereits auf maximalem Level!`, 'warning');
            return;
        }

        const cost = this.calculateBuildingCost(buildingName);
        if (this.canAfford(cost)) {
            this.deductResources(cost);
            building.level++;
            this.showNotification(
                `${config.name} auf Level ${building.level} verbessert!`, 
                'success'
            );
        } else {
            this.showNotification('Nicht genügend Ressourcen!', 'error');
        }
    }

    purchaseUpgrade(upgradeName) {
        console.log("Versuche Upgrade zu kaufen:", upgradeName); // Debug
        
        const upgrade = this.upgrades[upgradeName];
        if (!upgrade) {
            console.error("Upgrade nicht gefunden:", upgradeName);
            return;
        }

        console.log("Upgrade-Status:", upgrade); // Debug
        console.log("Aktuelle Ressourcen:", this.resources); // Debug

        if (upgrade.purchased) {
            this.showNotification('Verbesserung bereits gekauft!', 'warning');
            return;
        }

        if (this.canAfford(upgrade.cost)) {
            console.log("Kann Upgrade kaufen, ziehe Ressourcen ab"); // Debug
            this.deductResources(upgrade.cost);
            upgrade.purchased = true;
            this.applyUpgrade(upgradeName);
            this.showNotification(`Verbesserung ${upgradeName} gekauft!`, 'success');
            this.updateUI();
        } else {
            console.log("Nicht genug Ressourcen für Upgrade"); // Debug
            this.showNotification('Nicht genügend Ressourcen!', 'error');
        }
    }

    calculateBuildingCost(buildingName) {
        const building = this.buildings[buildingName];
        const cost = {};
        for (const [resource, baseCost] of Object.entries(building.baseCost)) {
            cost[resource] = Math.floor(baseCost * Math.pow(GAME_CONFIG.BALANCE.COST_MULTIPLIER, building.level));
        }
        return cost;
    }

    canAfford(cost) {
        console.log("Prüfe Kosten:", cost); // Debug-Ausgabe
        console.log("Aktuelle Ressourcen:", this.resources); // Debug-Ausgabe
        
        return Object.entries(cost).every(([resource, amount]) => {
            // Konvertiere den Ressourcennamen zu Kleinbuchstaben
            const resourceName = resource.toLowerCase();
            
            // Prüfe ob die Ressource existiert
            if (!this.resources[resourceName]) {
                console.error(`Ressource ${resourceName} nicht gefunden!`);
                return false;
            }

            const hasEnough = this.resources[resourceName].amount >= amount;
            console.log(`${resourceName}: benötigt ${amount}, vorhanden ${this.resources[resourceName].amount}`);
            return hasEnough;
        });
    }

    deductResources(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            const resourceName = resource.toLowerCase();
            this.resources[resourceName].amount -= amount;
        }
    }

    applyUpgrade(upgradeName) {
        console.log("Wende Upgrade an:", upgradeName); // Debug
        const upgrade = this.upgrades[upgradeName];
        
        if (upgradeName === 'BETTER_TOOLS') {
            // Verbessere die Produktion aller Gebäude
            for (const building of Object.values(this.buildings)) {
                for (const resource in building.production) {
                    const oldProduction = building.production[resource];
                    building.production[resource] *= upgrade.multiplier;
                    console.log(`${resource} Produktion: ${oldProduction} -> ${building.production[resource]}`);
                }
            }
        } else if (upgradeName === 'LARGER_STORAGE') {
            // Erhöhe die Speicherkapazität aller Ressourcen
            for (const resource in this.resources) {
                const oldStorage = this.resources[resource].maxStorage;
                this.resources[resource].maxStorage *= upgrade.multiplier;
                console.log(`${resource} Speicher: ${oldStorage} -> ${this.resources[resource].maxStorage}`);
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Entferne die Benachrichtigung nach 3 Sekunden
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, GAME_CONFIG.UI.NOTIFICATION_DURATION);
    }

    saveGame() {
		const saveData = {
			resources: this.resources,
			buildings: this.buildings,
			upgrades: this.upgrades,
			achievements: this.achievements,
			totalProduction: this.totalProduction,
			resourcesProduced: this.resourcesProduced,  // Neue Zeile
			startTime: this.startTime
		};
    localStorage.setItem(GAME_CONFIG.STORAGE.SAVE_KEY, JSON.stringify(saveData));
	}


        loadGame() {
    const savedState = localStorage.getItem(GAME_CONFIG.STORAGE.SAVE_KEY);
    if (savedState) {
        try 	{
				const saveData = JSON.parse(savedState);
				Object.assign(this.resources, saveData.resources);
				Object.assign(this.buildings, saveData.buildings);
				Object.assign(this.upgrades, saveData.upgrades);
				Object.assign(this.achievements, saveData.achievements);
				this.totalProduction = saveData.totalProduction;
				// Lade die gespeicherte Gesamtproduktion
				this.resourcesProduced = saveData.resourcesProduced || { wood: 0, stone: 0 };
				this.startTime = saveData.startTime;
				console.log('Spielstand erfolgreich geladen');
				} catch (error) {
				console.error('Fehler beim Laden des Spielstands:', error);
				this.showNotification('Fehler beim Laden des Spielstands!', 'error');
			}
		}
	}

}

// Spiel starten
window.game = new Game();
