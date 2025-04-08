// statisticsDisplay.js - UI-Komponenten für Statistikanzeige
// Vereinfachte Version für bessere Kompatibilität

import { gameState } from './gameState.js';
import { gameStatistics, getAverageProduction, getResourceGrowth, getFormattedPlayTime } from './statistics.js';
import { formatNumber, capitalizeFirstLetter } from './display.js';

// Chart-Instanzen
let resourceChart = null;
let productionChart = null;

// Farben für Ressourcen-Charts - einfache RGB-Farben
const resourceColors = {
    coins: '#f1c40f',    // Gold
    wood: '#8b4513',     // Braun
    stone: '#7f8c8d',    // Grau
    iron: '#95a5a6',     // Silber
    copper: '#e67e22',   // Kupferfarben
    planks: '#d35400',   // Dunkelorange
    bricks: '#c0392b',   // Rot
    tools: '#34495e',    // Dunkelblau
    jewelry: '#9b59b6'   // Lila
};

// Hauptfunktion zum Rendern des Statistik-Tabs
export function renderStatisticsTab() {
    console.log("Rendere Statistik-Tab...");
    
    const tabContent = document.getElementById('statistics');
    if (!tabContent) {
        console.error('Statistik-Tab nicht gefunden!');
        return;
    }
    
    // Einfachere Struktur
    tabContent.innerHTML = `
        <h2>Spielstatistiken</h2>
        
        <div class="stats-container">
            <!-- Allgemeine Statistiken -->
            <div class="stats-section">
                <h3>Allgemeine Statistiken</h3>
                <div class="stats-grid" id="general-stats-grid"></div>
            </div>
            
            <!-- Diagramme -->
            <div class="stats-section">
                <h3>Ressourcen-Entwicklung</h3>
                <div class="simple-chart-container">
                    <canvas id="resource-chart" height="250"></canvas>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button id="refresh-charts-btn" class="refresh-btn">Diagramme neu laden</button>
                </div>
            </div>
            
            <!-- Ressourcenstatistiken -->
            <div class="stats-section">
                <h3>Ressourcenübersicht</h3>
                <div class="resource-stats-grid" id="resource-stats-grid"></div>
            </div>
            
            <!-- Errungenschaften -->
            <div class="stats-section">
                <h3>Errungenschaften</h3>
                <div id="achievements-stats-content"></div>
            </div>
        </div>
    `;
    
    // Event-Listener für Refresh-Button
    const refreshButton = document.getElementById('refresh-charts-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            console.log("Chart-Aktualisierung durch Button-Klick");
            destroyCharts();
            renderCharts();
        });
    }
    
    // Statistiken rendern
    renderGeneralStats();
    renderResourceStats();
    renderAchievementStats();
    
    // Charts mit Verzögerung initialisieren
    setTimeout(() => {
        renderCharts();
    }, 500);
    
    // Globale Funktion für Debug
    window.refreshStats = function() {
        console.log("Manuelles Statistik-Update gestartet");
        updateStatisticsDisplay();
    };
}

// Chart-Rendering
function renderCharts() {
    try {
        console.log("Rendere Charts...");
        
        // Prüfen, ob Chart.js geladen ist
        if (typeof Chart === 'undefined') {
            console.error("Chart.js ist nicht verfügbar!");
            showChartErrorMessage("Chart.js konnte nicht geladen werden. Die Bibliothek ist nicht verfügbar.");
            return;
        }
        
        // Ressourcen-Chart erstellen
        const resourceCanvas = document.getElementById('resource-chart');
        if (!resourceCanvas) {
            console.error("Canvas für Ressourcen-Chart nicht gefunden!");
            return;
        }
        
        // Alte Charts zerstören
        destroyCharts();
        
        // Daten vorbereiten
        const datasets = [];
        const labels = [];
        
        // Zeitpunkte für X-Achse - letzten 10 Minuten
        const now = Date.now();
        for (let i = 9; i >= 0; i--) {
            const timePoint = now - (i * 60000);
            labels.push(new Date(timePoint).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        }
        
        // Nur die wichtigsten Ressourcen anzeigen
        const mainResources = ['coins', 'wood', 'stone', 'iron', 'copper'];
        
        mainResources.forEach(resource => {
            if (gameState.resources[resource] > 0) {
                // Daten für die Ressource erstellen
                const data = [];
                
                // Echte Daten oder Schätzungen verwenden
                if (gameStatistics.timeSeries && 
                    gameStatistics.timeSeries.resources && 
                    gameStatistics.timeSeries.resources[resource] && 
                    gameStatistics.timeSeries.resources[resource].length > 3) {
                    
                    // Die letzten Werte verwenden
                    const valuesFromStats = gameStatistics.timeSeries.resources[resource].slice(-10);
                    
                    // Werte auf 10 Punkte reduzieren/erweitern
                    for (let i = 0; i < 10; i++) {
                        const index = Math.min(Math.floor(i * valuesFromStats.length / 10), valuesFromStats.length - 1);
                        data.push(valuesFromStats[index]?.value || 0);
                    }
                    
                    // Aktuellen Wert als letzten Punkt setzen
                    data[data.length - 1] = gameState.resources[resource];
                } else {
                    // Einfache Simulation basierend auf aktuellem Wert
                    const currentValue = gameState.resources[resource];
                    const productionRate = gameState.production[resource];
                    
                    for (let i = 0; i < 10; i++) {
                        // Werte in der Vergangenheit sind niedriger
                        const pastValue = Math.max(0, currentValue - (productionRate * (10-i) * 60));
                        data.push(Math.round(pastValue));
                    }
                }
                
                // Dataset hinzufügen
                datasets.push({
                    label: capitalizeFirstLetter(resource),
                    data: data,
                    borderColor: resourceColors[resource],
                    backgroundColor: resourceColors[resource] + '33', // Mit Alpha für Transparenz
                    borderWidth: 2,
                    tension: 0.3
                });
            }
        });
        
        // Ressourcen-Chart erstellen - einfacher Linien-Chart
        try {
            resourceChart = new Chart(resourceCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            console.log("Ressourcen-Chart erfolgreich erstellt!");
        } catch (chartError) {
            console.error("Fehler beim Erstellen des Ressourcen-Charts:", chartError);
            showChartErrorMessage("Fehler beim Erstellen des Diagramms: " + chartError.message);
        }
    } catch (error) {
        console.error("Fehler beim Rendern der Charts:", error);
        showChartErrorMessage("Fehler beim Rendern der Diagramme: " + error.message);
    }
}

// Fehlermeldung anzeigen
function showChartErrorMessage(message) {
    const container = document.querySelector('.simple-chart-container');
    if (container) {
        container.innerHTML = `
            <div style="background-color: #FFF3CD; color: #856404; padding: 15px; border-radius: 5px; border: 1px solid #FFEEBA; margin: 10px 0;">
                <h4 style="margin-top: 0;">Diagramm konnte nicht geladen werden</h4>
                <p>${message}</p>
                <p>Versuche die Seite neu zu laden oder überprüfe die Konsole für weitere Details.</p>
            </div>
            <button onclick="window.refreshStats()" style="background-color: #3498db; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                Erneut versuchen
            </button>
        `;
    }
}

// Charts zerstören bevor neue erstellt werden
function destroyCharts() {
    if (resourceChart) {
        resourceChart.destroy();
        resourceChart = null;
    }
    if (productionChart) {
        productionChart.destroy();
        productionChart = null;
    }
}

// Allgemeine Statistiken rendern
function renderGeneralStats() {
    const generalStatsGrid = document.getElementById('general-stats-grid');
    if (!generalStatsGrid) return;
    
    const stats = gameStatistics.general;
    
    generalStatsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
                <div class="stat-title">Spielzeit</div>
                <div class="stat-value">${getFormattedPlayTime()}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">👆</div>
            <div class="stat-content">
                <div class="stat-title">Gesamt-Klicks</div>
                <div class="stat-value">${formatNumber(stats.totalClicks)}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div class="stat-content">
                <div class="stat-title">Gebäude gekauft</div>
                <div class="stat-value">${formatNumber(stats.buildingsPurchased)}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">⚙️</div>
            <div class="stat-content">
                <div class="stat-title">Konverter gekauft</div>
                <div class="stat-value">${formatNumber(stats.convertersPurchased)}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">⬆️</div>
            <div class="stat-content">
                <div class="stat-title">Upgrades gekauft</div>
                <div class="stat-value">${formatNumber(stats.upgradesPurchased)}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
                <div class="stat-title">Prestige-Resets</div>
                <div class="stat-value">${formatNumber(stats.prestigeCount)}</div>
            </div>
        </div>
    `;
}

// Ressourcenstatistiken rendern
function renderResourceStats() {
    const resourceStatsGrid = document.getElementById('resource-stats-grid');
    if (!resourceStatsGrid) return;
    
    let html = '';
    
    Object.keys(gameState.resources).forEach(resource => {
        const currentAmount = gameState.resources[resource];
        const productionRate = gameState.production[resource];
        const totalGained = gameStatistics.general.totalResourcesGained[resource] || 0;
        const totalSpent = gameStatistics.general.totalResourcesSpent[resource] || 0;
        
        html += `
            <div class="resource-stat-card" data-resource="${resource}">
                <div class="resource-stat-header">
                    <span class="resource-icon ${resource}-icon"></span>
                    <span>${capitalizeFirstLetter(resource)}</span>
                </div>
                <div class="resource-stat-grid">
                    <div class="resource-stat">
                        <div class="resource-stat-label">Aktuell</div>
                        <div class="resource-stat-value">${formatNumber(currentAmount)}</div>
                    </div>
                    <div class="resource-stat">
                        <div class="resource-stat-label">Produktion</div>
                        <div class="resource-stat-value">${formatNumber(productionRate)}/s</div>
                    </div>
                    <div class="resource-stat">
                        <div class="resource-stat-label">Gesamt erhalten</div>
                        <div class="resource-stat-value">${formatNumber(totalGained)}</div>
                    </div>
                    <div class="resource-stat">
                        <div class="resource-stat-label">Gesamt ausgegeben</div>
                        <div class="resource-stat-value">${formatNumber(totalSpent)}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    resourceStatsGrid.innerHTML = html;
}

// Errungenschaftsstatistiken rendern
function renderAchievementStats() {
    const achievementsContainer = document.getElementById('achievements-stats-content');
    if (!achievementsContainer) return;
    
    let achievedCount = 0;
    let totalCount = gameState.achievements.length;
    
    gameState.achievements.forEach(achievement => {
        if (achievement.achieved) {
            achievedCount++;
        }
    });
    
    const achievementPercentage = totalCount > 0 ? Math.floor((achievedCount / totalCount) * 100) : 0;
    
    achievementsContainer.innerHTML = `
        <div class="achievement-progress">
            <div class="achievement-progress-bar">
                <div class="achievement-progress-fill" style="width: ${achievementPercentage}%"></div>
            </div>
            <div class="achievement-progress-text">
                ${achievedCount} / ${totalCount} Errungenschaften freigeschaltet (${achievementPercentage}%)
            </div>
        </div>
        
        <div class="achievement-list">
            ${gameState.achievements.map(achievement => `
                <div class="achievement-item ${achievement.achieved ? 'achieved' : 'locked'}">
                    <div class="achievement-icon">${achievement.achieved ? '🏆' : '🔒'}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Statistiken aktualisieren
export function updateStatisticsDisplay() {
    console.log("Aktualisiere Statistik-Anzeige...");
    
    // Nur aktualisieren, wenn der Tab sichtbar ist
    const statisticsTab = document.getElementById('statistics');
    if (!statisticsTab || !statisticsTab.classList.contains('active')) {
        console.log("Statistik-Tab nicht aktiv, überspringe Aktualisierung");
        return;
    }
    
    // UI aktualisieren
    renderGeneralStats();
    renderResourceStats();
    renderAchievementStats();
    
    // Charts neu rendern
    renderCharts();
}