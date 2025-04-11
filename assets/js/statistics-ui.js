// statisticsDisplay.js - UI-Komponenten für Statistikanzeige

import { gameState } from './gameState.js';
import { gameStatistics, getAverageProduction, getResourceGrowth, getFormattedPlayTime } from './statistics.js';
import { formatNumber } from './display.js';

// Hauptfunktion zum Rendern des Statistik-Tabs
export function renderStatisticsTab() {
    const tabContent = document.getElementById('statistics');
    if (!tabContent) {
        console.warn('Statistik-Tab nicht gefunden');
        return;
    }
    
    tabContent.innerHTML = `
        <h2>Spielstatistiken</h2>
        
        <div class="stats-container">
            <div class="stats-section" id="general-stats">
                <h3>Allgemeine Statistiken</h3>
                <div class="stats-grid" id="general-stats-grid"></div>
            </div>
            
            <div class="stats-section" id="resource-stats">
                <h3>Ressourcenstatistiken</h3>
                <div class="resources-tabs">
                    <button class="resource-tab active" data-resource="all">Alle</button>
                    ${Object.keys(gameState.resources).map(resource => 
                        `<button class="resource-tab" data-resource="${resource}">${capitalizeFirstLetter(resource)}</button>`
                    ).join('')}
                </div>
                <div class="resource-stats-content">
                    <div class="resource-chart-container">
                        <canvas id="resource-chart" width="600" height="300"></canvas>
                    </div>
                    <div class="resource-stats-grid" id="resource-stats-grid"></div>
                </div>
            </div>
            
            <div class="stats-section" id="production-stats">
                <h3>Produktionsstatistiken</h3>
                <div class="time-range-selector">
                    <button class="time-range active" data-range="60">Letzte Minute</button>
                    <button class="time-range" data-range="300">5 Minuten</button>
                    <button class="time-range" data-range="1800">30 Minuten</button>
                    <button class="time-range" data-range="3600">1 Stunde</button>
                </div>
                <div class="production-chart-container">
                    <canvas id="production-chart" width="600" height="300"></canvas>
                </div>
            </div>
            
            <div class="stats-section" id="achievements-stats">
                <h3>Errungenschaften und Meilensteine</h3>
                <div id="achievements-stats-content"></div>
            </div>
        </div>
    `;
    
    // Event-Listener für Ressourcen-Tabs
    const resourceTabs = tabContent.querySelectorAll('.resource-tab');
    resourceTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Aktiven Tab deaktivieren
            document.querySelector('.resource-tab.active').classList.remove('active');
            // Neuen Tab aktivieren
            this.classList.add('active');
            // Chart aktualisieren
            updateResourceChart(this.dataset.resource);
        });
    });
    
    // Event-Listener für Zeitbereichsauswahl
    const timeRanges = tabContent.querySelectorAll('.time-range');
    timeRanges.forEach(range => {
        range.addEventListener('click', function() {
            // Aktiven Bereich deaktivieren
            document.querySelector('.time-range.active').classList.remove('active');
            // Neuen Bereich aktivieren
            this.classList.add('active');
            // Chart aktualisieren
            updateProductionChart(parseInt(this.dataset.range));
        });
    });
    
    // Statistiken rendern
    renderGeneralStats();
    renderResourceStats();
    renderAchievementStats();
    
    // Charts initialisieren
    setTimeout(() => {
        initCharts();
    }, 100);
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
        const averageProduction = getAverageProduction(resource, 60);
        const growth = getResourceGrowth(resource, 60);
        const highestProduction = gameStatistics.general.highestProduction[resource] || 0;
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
                        <div class="resource-stat-label">Avg. Produktion</div>
                        <div class="resource-stat-value">${formatNumber(averageProduction)}/s</div>
                    </div>
                    <div class="resource-stat">
                        <div class="resource-stat-label">Änderung (1m)</div>
                        <div class="resource-stat-value ${growth >= 0 ? 'positive' : 'negative'}">
                            ${growth >= 0 ? '+' : ''}${formatNumber(growth)}
                        </div>
                    </div>
                    <div class="resource-stat">
                        <div class="resource-stat-label">Max. Produktion</div>
                        <div class="resource-stat-value">${formatNumber(highestProduction)}/s</div>
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

// Charts initialisieren
function initCharts() {
    // Canvas-Elemente abrufen
    const resourceChartCanvas = document.getElementById('resource-chart');
    const productionChartCanvas = document.getElementById('production-chart');
    
    if (!resourceChartCanvas || !productionChartCanvas) {
        console.warn('Chart-Canvas nicht gefunden');
        return;
    }
    
    // Chart.js laden
    if (typeof Chart === 'undefined') {
        // Falls Chart.js nicht verfügbar ist, temporär einbinden
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function() {
            // Charts erstellen, nachdem Chart.js geladen ist
            createResourceChart();
            createProductionChart();
        };
        document.head.appendChild(script);
    } else {
        // Chart.js ist bereits verfügbar
        createResourceChart();
        createProductionChart();
    }
}

// Ressourcen-Chart erstellen
let resourceChart = null;
function createResourceChart() {
    const canvas = document.getElementById('resource-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    resourceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Zeitstempel
            datasets: [] // Wird durch updateResourceChart() gefüllt
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
                    title: {
                        display: true,
                        text: 'Zeit'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Menge'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
    
    // Initialen Datensatz laden
    updateResourceChart('all');
}

// Ressourcen-Chart aktualisieren
function updateResourceChart(resourceFilter) {
    if (!resourceChart) return;
    
    const datasets = [];
    const colors = {
        coins: 'rgb(241, 196, 15)',
        wood: 'rgb(139, 69, 19)',
        stone: 'rgb(127, 140, 141)',
        iron: 'rgb(149, 165, 166)',
        copper: 'rgb(230, 126, 34)',
        planks: 'rgb(211, 84, 0)',
        bricks: 'rgb(192, 57, 43)',
        tools: 'rgb(52, 73, 94)',
        jewelry: 'rgb(155, 89, 182)'
    };
    
    // Ressourcen filtern
    let resourcesToShow = Object.keys(gameState.resources);
    if (resourceFilter !== 'all') {
        resourcesToShow = [resourceFilter];
    }
    
    // Datensätze für jede Ressource erstellen
    resourcesToShow.forEach(resource => {
        if (gameStatistics.timeSeries.resources[resource]) {
            const data = gameStatistics.timeSeries.resources[resource].map(point => ({
                x: point.time,
                y: point.value
            }));
            
            datasets.push({
                label: capitalizeFirstLetter(resource),
                data: data,
                borderColor: colors[resource] || getRandomColor(),
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 5,
                tension: 0.4
            });
        }
    });
    
    resourceChart.data.datasets = datasets;
    resourceChart.update();
}

// Produktions-Chart erstellen
let productionChart = null;
function createProductionChart() {
    const canvas = document.getElementById('production-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    productionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Zeitstempel
            datasets: [] // Wird durch updateProductionChart() gefüllt
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
                    title: {
                        display: true,
                        text: 'Zeit'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Produktion/s'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
    
    // Initialen Datensatz laden
    updateProductionChart(60); // Standard: letzte Minute
}

// Produktions-Chart aktualisieren
function updateProductionChart(timeRange) {
    if (!productionChart) return;
    
    const datasets = [];
    const colors = {
        coins: 'rgb(241, 196, 15)',
        wood: 'rgb(139, 69, 19)',
        stone: 'rgb(127, 140, 141)',
        iron: 'rgb(149, 165, 166)',
        copper: 'rgb(230, 126, 34)',
        planks: 'rgb(211, 84, 0)',
        bricks: 'rgb(192, 57, 43)',
        tools: 'rgb(52, 73, 94)',
        jewelry: 'rgb(155, 89, 182)'
    };
    
    const currentTime = Date.now();
    const cutoffTime = currentTime - (timeRange * 1000);
    
    // Datensätze für jede Ressource erstellen
    Object.keys(gameState.resources).forEach(resource => {
        if (gameStatistics.timeSeries.production[resource]) {
            // Nur Datenpunkte innerhalb des Zeitbereichs
            const data = gameStatistics.timeSeries.production[resource]
                .filter(point => point.time >= cutoffTime)
                .map(point => ({
                    x: point.time,
                    y: point.value
                }));
            
            datasets.push({
                label: capitalizeFirstLetter(resource),
                data: data,
                borderColor: colors[resource] || getRandomColor(),
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 5,
                tension: 0.4
            });
        }
    });
    
    productionChart.data.datasets = datasets;
    productionChart.update();
}

// Statistiken aktualisieren
export function updateStatisticsDisplay() {
    renderGeneralStats();
    renderResourceStats();
    renderAchievementStats();
    
    // Aktiven Ressourcen-Tab abrufen
    const activeResourceTab = document.querySelector('.resource-tab.active');
    if (activeResourceTab) {
        updateResourceChart(activeResourceTab.dataset.resource);
    }
    
    // Aktiven Zeitbereich abrufen
    const activeTimeRange = document.querySelector('.time-range.active');
    if (activeTimeRange) {
        updateProductionChart(parseInt(activeTimeRange.dataset.range));
    }
}

// Hilfsfunktion: Ersten Buchstaben groß schreiben
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Hilfsfunktion: Zufällige Farbe generieren
function getRandomColor() {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgb(${r}, ${g}, ${b})`;
}
