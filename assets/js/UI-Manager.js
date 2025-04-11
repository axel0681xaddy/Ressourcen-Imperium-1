/**
 * @fileoverview Verwaltung der Benutzeroberfläche und UI-Updates
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.elements = {};
        this.updateQueue = new Set();
        this.lastUpdate = 0;
        this.updateInterval = GAME_CONFIG.UI_UPDATE_INTERVAL || 100; // 100ms Standard
        
        this.initializeUI();
        this.setupEventListeners();
    }

    /**
     * Initialisiert alle UI-Elemente
     * @private
     */
    initializeUI() {
        // Hauptcontainer
        this.elements = {
            resources: document.getElementById('resources-container'),
            upgrades: document.getElementById('upgrades-container'),
            achievements: document.getElementById('achievements-container'),
            statistics: document.getElementById('statistics-container'),
            notifications: document.getElementById('notifications-container'),
            settings: document.getElementById('settings-container')
        };

        // Prüfe ob alle erforderlichen Elemente vorhanden sind
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.error(`UI-Element nicht gefunden: ${key}`);
            }
        }

        this.createResourceDisplays();
        this.createUpgradeButtons();
        this.createAchievementList();
        this.createStatisticsDisplay();
        this.createSettingsPanel();
    }

    /**
     * Erstellt die Ressourcenanzeigen
     * @private
     */
    createResourceDisplays() {
        const container = this.elements.resources;
        container.innerHTML = '';

        for (const [id, resource] of this.gameState.resourceManager.resources) {
            const resourceElement = document.createElement('div');
            resourceElement.className = 'resource-display';
            resourceElement.id = `resource-${id}`;

            resourceElement.innerHTML = `
                <div class="resource-header">
                    <img src="assets/icons/${id}.png" alt="${resource.name}" class="resource-icon">
                    <h3>${resource.name}</h3>
                </div>
                <div class="resource-info">
                    <span class="resource-amount">0</span>
                    <span class="resource-rate">(+0/s)</span>
                </div>
                <div class="resource-progress">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <button class="upgrade-button" data-resource="${id}">
                    Verbessern (<span class="upgrade-cost">0</span>)
                </button>
            `;

            container.appendChild(resourceElement);
            this.elements[`resource-${id}`] = resourceElement;
        }
    }

    /**
     * Erstellt die Upgrade-Buttons
     * @private
     */
    createUpgradeButtons() {
        const container = this.elements.upgrades;
        container.innerHTML = '';

        for (const [id, upgrade] of this.gameState.upgradeManager.upgrades) {
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade-item';
            upgradeElement.id = `upgrade-${id}`;

            upgradeElement.innerHTML = `
                <div class="upgrade-header">
                    <h4>${upgrade.name}</h4>
                    <span class="upgrade-level">Level: ${upgrade.level}</span>
                </div>
                <p class="upgrade-description">${upgrade.description}</p>
                <button class="purchase-button" data-upgrade="${id}">
                    Kaufen (<span class="upgrade-cost">${upgrade.cost}</span>)
                </button>
            `;

            container.appendChild(upgradeElement);
            this.elements[`upgrade-${id}`] = upgradeElement;
        }
    }

    /**
     * Erstellt die Achievement-Liste
     * @private
     */
    createAchievementList() {
        const container = this.elements.achievements;
        container.innerHTML = '';

        for (const achievement of this.gameState.achievementManager.getVisibleAchievements()) {
            const achievementElement = document.createElement('div');
            achievementElement.className = 'achievement-item';
            achievementElement.id = `achievement-${achievement.id}`;

            achievementElement.innerHTML = `
                <div class="achievement-icon">
                    <img src="${achievement.icon}" alt="${achievement.name}">
                </div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar" style="width: ${achievement.progress * 100}%"></div>
                    </div>
                </div>
            `;

            container.appendChild(achievementElement);
            this.elements[`achievement-${achievement.id}`] = achievementElement;
        }
    }

    /**
     * Erstellt die Statistik-Anzeige
     * @private
     */
    createStatisticsDisplay() {
        const container = this.elements.statistics;
        container.innerHTML = `
            <h3>Statistiken</h3>
            <div class="statistics-grid">
                <div class="stat-item">
                    <span class="stat-label">Spielzeit:</span>
                    <span id="stat-playtime">0:00:00</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Gesammelte Ressourcen:</span>
                    <span id="stat-total-resources">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Gekaufte Upgrades:</span>
                    <span id="stat-total-upgrades">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Prestige Level:</span>
                    <span id="stat-prestige-level">0</span>
                </div>
            </div>
        `;
    }

    /**
     * Erstellt das Einstellungen-Panel
     * @private
     */
    createSettingsPanel() {
        const container = this.elements.settings;
        container.innerHTML = `
            <h3>Einstellungen</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <label for="setting-sound">Sound</label>
                    <input type="checkbox" id="setting-sound" checked>
                </div>
                <div class="setting-item">
                    <label for="setting-particles">Partikeleffekte</label>
                    <input type="checkbox" id="setting-particles" checked>
                </div>
                <div class="setting-item">
                    <label for="setting-autosave">Automatisches Speichern</label>
                    <input type="checkbox" id="setting-autosave" checked>
                </div>
                <div class="setting-item">
                    <button id="save-game">Spiel speichern</button>
                    <button id="load-game">Spiel laden</button>
                    <button id="reset-game">Spiel zurücksetzen</button>
                </div>
            </div>
        `;
    }

    /**
     * Richtet Event-Listener ein
     * @private
     */
    setupEventListeners() {
        // Resource Upgrade Buttons
        document.querySelectorAll('.upgrade-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const resourceId = e.target.dataset.resource;
                this.gameState.resourceManager.upgradeResource(resourceId);
                this.queueUpdate('resources');
            });
        });

        // Upgrade Purchase Buttons
        document.querySelectorAll('.purchase-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const upgradeId = e.target.dataset.upgrade;
                this.gameState.upgradeManager.purchaseUpgrade(upgradeId, this.gameState);
                this.queueUpdate('upgrades');
            });
        });

        // Settings Controls
        document.getElementById('setting-sound').addEventListener('change', (e) => {
            this.gameState.settings.soundEnabled = e.target.checked;
        });

        document.getElementById('setting-particles').addEventListener('change', (e) => {
            this.gameState.settings.particleEffects = e.target.checked;
        });

        document.getElementById('setting-autosave').addEventListener('change', (e) => {
            this.gameState.settings.autoSave = e.target.checked;
        });

        document.getElementById('save-game').addEventListener('click', () => {
            this.gameState.saveManager.saveGame(this.gameState);
            this.showNotification('Spiel gespeichert!');
        });

        document.getElementById('load-game').addEventListener('click', () => {
            if (this.gameState.saveManager.loadGame()) {
                this.showNotification('Spiel geladen!');
                this.queueUpdate('all');
            }
        });

        document.getElementById('reset-game').addEventListener('click', () => {
            if (confirm('Möchtest du wirklich das Spiel zurücksetzen? Dieser Vorgang kann nicht rückgängig gemacht werden!')) {
                this.gameState.reset();
                this.showNotification('Spiel zurückgesetzt!');
                this.queueUpdate('all');
            }
        });
    }

    /**
     * Plant ein UI-Update
     * @param {string} section - Zu aktualisierende Sektion
     */
    queueUpdate(section) {
        this.updateQueue.add(section);
    }

    /**
     * Führt geplante Updates aus
     */
    update() {
        const currentTime = performance.now();
        if (currentTime - this.lastUpdate < this.updateInterval) return;

        if (this.updateQueue.size > 0) {
            for (const section of this.updateQueue) {
                switch (section) {
                    case 'resources':
                        this.updateResources();
                        break;
                    case 'upgrades':
                        this.updateUpgrades();
                        break;
                    case 'achievements':
                        this.updateAchievements();
                        break;
                    case 'statistics':
                        this.updateStatistics();
                        break;
                    case 'all':
                        this.updateAll();
                        break;
                }
            }
            this.updateQueue.clear();
        }

        this.lastUpdate = currentTime;
    }

    /**
     * Aktualisiert alle UI-Elemente
     * @private
     */
    updateAll() {
        this.updateResources();
        this.updateUpgrades();
        this.updateAchievements();
        this.updateStatistics();
    }

    /**
     * Zeigt eine Benachrichtigung an
     * @param {string} message - Nachrichtentext
     * @param {string} type - Typ der Nachricht (info, success, warning, error)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        this.elements.notifications.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    /**
     * Formatiert eine Zahl für die Anzeige
     * @param {number} number - Zu formatierende Zahl
     * @returns {string} Formatierte Zahl
     * @private
     */
    formatNumber(number) {
        if (number >= 1e9) {
            return (number / 1e9).toFixed(2) + 'B';
        } else if (number >= 1e6) {
            return (number / 1e6).toFixed(2) + 'M';
        } else if (number >= 1e3) {
            return (number / 1e3).toFixed(2) + 'K';
        }
        return number.toFixed(2);
    }

    /**
     * Formatiert Zeit für die Anzeige
     * @param {number} seconds - Sekunden
     * @returns {string} Formatierte Zeit
     * @private
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Aktualisiert die Ressourcenanzeigen
     * @private
     */
    updateResources() {
        for (const [id, resource] of this.gameState.resourceManager.resources) {
            const element = this.elements[`resource-${id}`];
            if (!element) continue;

            // Aktualisiere Menge und Produktionsrate
            const amountElement = element.querySelector('.resource-amount');
            const rateElement = element.querySelector('.resource-rate');
            const progressBar = element.querySelector('.progress-bar');
            const upgradeButton = element.querySelector('.upgrade-button');
            const upgradeCost = element.querySelector('.upgrade-cost');

            amountElement.textContent = this.formatNumber(resource.amount);
            rateElement.textContent = `(+${this.formatNumber(resource.baseProduction * resource.multiplier)}/s)`;

            // Aktualisiere Fortschrittsbalken
            const progress = (resource.amount / this.gameState.resourceManager.calculateResourceCap(resource)) * 100;
            progressBar.style.width = `${Math.min(100, progress)}%`;

            // Aktualisiere Upgrade-Button
            const canUpgrade = resource.amount >= resource.upgradeCost;
            upgradeButton.disabled = !canUpgrade;
            upgradeButton.classList.toggle('available', canUpgrade);
            upgradeCost.textContent = this.formatNumber(resource.upgradeCost);
        }
    }

    /**
     * Aktualisiert die Upgrade-Anzeigen
     * @private
     */
    updateUpgrades() {
        for (const [id, upgrade] of this.gameState.upgradeManager.upgrades) {
            const element = this.elements[`upgrade-${id}`];
            if (!element) continue;

            const levelElement = element.querySelector('.upgrade-level');
            const purchaseButton = element.querySelector('.purchase-button');
            const costElement = element.querySelector('.upgrade-cost');

            levelElement.textContent = `Level: ${upgrade.level}`;
            costElement.textContent = this.formatNumber(upgrade.calculateCost());

            const isAvailable = this.gameState.upgradeManager.availableUpgrades.has(id);
            element.classList.toggle('available', isAvailable);
            purchaseButton.disabled = !isAvailable;
        }
    }

    /**
     * Aktualisiert die Achievement-Anzeigen
     * @private
     */
    updateAchievements() {
        const achievements = this.gameState.achievementManager.getVisibleAchievements();
        
        for (const achievement of achievements) {
            const element = this.elements[`achievement-${achievement.id}`];
            if (!element) continue;

            const progressBar = element.querySelector('.progress-bar');
            const isUnlocked = this.gameState.achievementManager.unlockedAchievements.has(achievement.id);

            element.classList.toggle('unlocked', isUnlocked);
            progressBar.style.width = `${achievement.progress * 100}%`;
        }
    }

    /**
     * Aktualisiert die Statistik-Anzeigen
     * @private
     */
    updateStatistics() {
        const stats = this.gameState.statistics;
        
        document.getElementById('stat-playtime').textContent = 
            this.formatTime(this.gameState.totalPlayTime);
        
        document.getElementById('stat-total-resources').textContent = 
            this.formatNumber(stats.totalResourcesGathered);
        
        document.getElementById('stat-total-upgrades').textContent = 
            stats.totalUpgradesPurchased;
        
        document.getElementById('stat-prestige-level').textContent = 
            this.gameState.prestigeLevel;
    }

    /**
     * Fügt einen Partikeleffekt hinzu
     * @param {number} x - X-Koordinate
     * @param {number} y - Y-Koordinate
     * @param {string} text - Anzuzeigender Text
     * @param {string} type - Typ des Effekts
     */
    addParticleEffect(x, y, text, type = 'default') {
        if (!this.gameState.settings.particleEffects) return;

        const particle = document.createElement('div');
        particle.className = `particle particle-${type}`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.textContent = text;

        document.body.appendChild(particle);

        // Animation
        particle.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: 'translateY(-50px) scale(1.2)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }

    /**
     * Spielt einen Sound ab
     * @param {string} soundId - ID des Sounds
     */
    playSound(soundId) {
        if (!this.gameState.settings.soundEnabled) return;

        const sound = document.getElementById(`sound-${soundId}`);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.warn('Sound konnte nicht abgespielt werden:', error));
        }
    }

    /**
     * Zeigt einen Tooltip an
     * @param {HTMLElement} element - Element für den Tooltip
     * @param {string} content - Tooltip-Inhalt
     */
    showTooltip(element, content) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = content;

        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;

        document.body.appendChild(tooltip);

        element.addEventListener('mouseleave', () => tooltip.remove());
    }
}
