// scarcity.js - Resource scarcity and depletion system

import { gameState } from './gameState.js';
import { calculateProduction } from './gameLoop.js';
import { updateDisplay } from './display.js';

// Configuration for the scarcity system
const scarcityConfig = {
    // Initial resource deposits (maximum available)
    initialDeposits: {
        wood: 100000,
        stone: 80000,
        iron: 50000,
        copper: 30000
    },
    
    // Minimum efficiency percentage when resources are nearly depleted
    minEfficiency: 0.2, // 20% minimum efficiency
    
    // Threshold at which efficiency starts decreasing (percentage of initial deposit)
    efficiencyThreshold: 0.5, // 50% of initial deposit
    
    // Price multiplier for scarce resources
    priceMultiplier: {
        base: 1.0,
        max: 5.0 // Maximum price increase (5x)
    },
    
    // Regeneration rate per minute (percentage of initial deposit)
    regenerationRate: {
        wood: 0.001, // 0.1% per minute
        stone: 0.0005, // 0.05% per minute
        iron: 0.0002, // 0.02% per minute
        copper: 0.0001 // 0.01% per minute
    },
    
    // Whether resource depletion is enabled
    enabled: true
};

// Current state of resource deposits
export const resourceDeposits = {
    // Format: { resource: remainingAmount }
};

// Efficiency multipliers for each resource
export const efficiencyMultipliers = {
    // Format: { resource: multiplier }
};

// Initialize the scarcity system
export function initScarcitySystem() {
    console.log('Initializing resource scarcity system...');
    
    // Initialize resource deposits if not already set
    Object.keys(scarcityConfig.initialDeposits).forEach(resource => {
        if (!resourceDeposits[resource]) {
            resourceDeposits[resource] = scarcityConfig.initialDeposits[resource];
        }
    });
    
    // Initialize efficiency multipliers
    updateEfficiencyMultipliers();
    
    // Set up periodic updates for regeneration and UI
    setInterval(regenerateResources, 60000); // Every minute
    setInterval(updateScarcityDisplay, 5000); // Update UI every 5 seconds
    
    console.log('Resource scarcity system initialized.');
}

// Update efficiency multipliers based on current resource levels
export function updateEfficiencyMultipliers() {
    Object.keys(resourceDeposits).forEach(resource => {
        const initialAmount = scarcityConfig.initialDeposits[resource];
        const currentAmount = resourceDeposits[resource];
        const ratio = currentAmount / initialAmount;
        
        // Calculate efficiency multiplier
        let multiplier = 1.0;
        
        if (ratio < scarcityConfig.efficiencyThreshold) {
            // Linear decrease from 100% to minEfficiency as resources deplete
            const range = scarcityConfig.efficiencyThreshold;
            const normalizedRatio = ratio / range;
            multiplier = scarcityConfig.minEfficiency + (normalizedRatio * (1 - scarcityConfig.minEfficiency));
        }
        
        efficiencyMultipliers[resource] = multiplier;
    });
}

// Process resource consumption and apply scarcity effects
export function processResourceConsumption(resource, amount) {
    if (!scarcityConfig.enabled || !resourceDeposits[resource]) {
        return amount; // Scarcity system disabled or resource not tracked
    }
    
    // Calculate how much can actually be consumed
    const availableAmount = Math.min(amount, resourceDeposits[resource]);
    
    // Reduce deposit
    resourceDeposits[resource] -= availableAmount;
    
    // Update efficiency multipliers
    updateEfficiencyMultipliers();
    
    // Return the amount that was actually consumed
    return availableAmount;
}

// Apply efficiency multipliers to production rates
export function applyEfficiencyToProduction() {
    if (!scarcityConfig.enabled) return;
    
    // Apply efficiency multipliers to generators
    gameState.generators.forEach(generator => {
        const resource = generator.resource;
        
        // Only apply to resources that have scarcity
        if (efficiencyMultipliers[resource]) {
            // Store original output if not already stored
            if (!generator.originalBaseOutput) {
                generator.originalBaseOutput = generator.baseOutput;
            }
            
            // Apply efficiency multiplier
            generator.baseOutput = generator.originalBaseOutput * efficiencyMultipliers[resource];
        }
    });
    
    // Recalculate production rates
    calculateProduction();
}

// Get price multiplier for a resource based on scarcity
export function getPriceMultiplier(resource) {
    if (!scarcityConfig.enabled || !resourceDeposits[resource]) {
        return 1.0; // No price change if scarcity is disabled or resource not tracked
    }
    
    const initialAmount = scarcityConfig.initialDeposits[resource];
    const currentAmount = resourceDeposits[resource];
    const ratio = currentAmount / initialAmount;
    
    // Calculate price multiplier (inverse of resource availability)
    // As resources become scarce, prices increase
    const baseMult = scarcityConfig.priceMultiplier.base;
    const maxMult = scarcityConfig.priceMultiplier.max;
    
    if (ratio >= 1.0) {
        return baseMult; // Base price when resources are plentiful
    } else {
        // Exponential increase as resources deplete
        return baseMult + ((1 - ratio) * (maxMult - baseMult));
    }
}

// Regenerate resources over time
function regenerateResources() {
    if (!scarcityConfig.enabled) return;
    
    Object.keys(resourceDeposits).forEach(resource => {
        const initialAmount = scarcityConfig.initialDeposits[resource];
        const regenerationAmount = initialAmount * scarcityConfig.regenerationRate[resource];
        
        // Only regenerate if below initial amount
        if (resourceDeposits[resource] < initialAmount) {
            resourceDeposits[resource] = Math.min(
                initialAmount, 
                resourceDeposits[resource] + regenerationAmount
            );
        }
    });
    
    // Update efficiency multipliers after regeneration
    updateEfficiencyMultipliers();
    
    // Apply updated efficiency to production
    applyEfficiencyToProduction();
}

// Update UI to show resource scarcity information
function updateScarcityDisplay() {
    // Only update if the scarcity tab is active
    const scarcityTab = document.querySelector('.tab-content#scarcity');
    if (scarcityTab && scarcityTab.classList.contains('active')) {
        renderScarcityInfo();
    }
}

// Render scarcity information in the UI
export function renderScarcityInfo() {
    const scarcityContainer = document.getElementById('scarcity-info-container');
    if (!scarcityContainer) return;
    
    let html = `
        <h3>Ressourcenvorkommen</h3>
        <div class="scarcity-grid">
    `;
    
    Object.keys(resourceDeposits).forEach(resource => {
        const initialAmount = scarcityConfig.initialDeposits[resource];
        const currentAmount = resourceDeposits[resource];
        const percentage = Math.round((currentAmount / initialAmount) * 100);
        const efficiency = Math.round(efficiencyMultipliers[resource] * 100);
        const priceMultiplier = getPriceMultiplier(resource).toFixed(1);
        
        // Determine status color based on percentage
        let statusColor = '#2ecc71'; // Green for abundant
        if (percentage < 25) {
            statusColor = '#e74c3c'; // Red for critical
        } else if (percentage < 50) {
            statusColor = '#f39c12'; // Orange for low
        } else if (percentage < 75) {
            statusColor = '#3498db'; // Blue for moderate
        }
        
        html += `
            <div class="scarcity-card">
                <div class="scarcity-header">
                    <span class="resource-icon ${resource}-icon"></span>
                    <span>${capitalizeFirstLetter(resource)}</span>
                </div>
                <div class="scarcity-progress">
                    <div class="scarcity-bar-container">
                        <div class="scarcity-bar" style="width: ${percentage}%; background-color: ${statusColor};"></div>
                    </div>
                    <div class="scarcity-percentage">${percentage}% übrig</div>
                </div>
                <div class="scarcity-details">
                    <div class="scarcity-detail">
                        <span class="detail-label">Effizienz:</span>
                        <span class="detail-value">${efficiency}%</span>
                    </div>
                    <div class="scarcity-detail">
                        <span class="detail-label">Preismultiplikator:</span>
                        <span class="detail-value">${priceMultiplier}x</span>
                    </div>
                    <div class="scarcity-detail">
                        <span class="detail-label">Regeneration:</span>
                        <span class="detail-value">${(scarcityConfig.regenerationRate[resource] * 100).toFixed(3)}% pro Min.</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="scarcity-controls">
            <button id="toggle-scarcity-btn" class="${scarcityConfig.enabled ? 'active' : 'inactive'}">
                Ressourcenknappheit ${scarcityConfig.enabled ? 'deaktivieren' : 'aktivieren'}
            </button>
        </div>
    `;
    
    scarcityContainer.innerHTML = html;
    
    // Add event listener for toggle button
    const toggleButton = document.getElementById('toggle-scarcity-btn');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleScarcitySystem);
    }
}

// Toggle the scarcity system on/off
function toggleScarcitySystem() {
    scarcityConfig.enabled = !scarcityConfig.enabled;
    
    // Reset production to original values if disabled
    if (!scarcityConfig.enabled) {
        gameState.generators.forEach(generator => {
            if (generator.originalBaseOutput) {
                generator.baseOutput = generator.originalBaseOutput;
            }
        });
    } else {
        // Apply efficiency if enabled
        applyEfficiencyToProduction();
    }
    
    // Update UI
    calculateProduction();
    updateDisplay();
    renderScarcityInfo();
    
    console.log(`Scarcity system ${scarcityConfig.enabled ? 'enabled' : 'disabled'}`);
}

// Save scarcity data
export function saveScarcityData() {
    return {
        deposits: resourceDeposits,
        enabled: scarcityConfig.enabled
    };
}

// Load scarcity data
export function loadScarcityData(data) {
    if (data && data.deposits) {
        Object.assign(resourceDeposits, data.deposits);
    }
    
    if (data && data.enabled !== undefined) {
        scarcityConfig.enabled = data.enabled;
    }
    
    // Update efficiency multipliers after loading
    updateEfficiencyMultipliers();
    
    // Apply efficiency to production
    if (scarcityConfig.enabled) {
        applyEfficiencyToProduction();
    }
}

// Apply scarcity effects to a specific resource amount
export function applyScarcityEffects(resource, amount) {
    if (!scarcityConfig.enabled || !resourceDeposits[resource]) {
        return amount; // No effect if disabled or resource not tracked
    }
    
    // Apply efficiency multiplier to the amount
    if (efficiencyMultipliers[resource]) {
        amount *= efficiencyMultipliers[resource];
    }
    
    // Update the resource deposit
    resourceDeposits[resource] = Math.max(0, resourceDeposits[resource] - amount);
    
    // Update efficiency after consumption
    updateEfficiencyMultipliers();
    
    return amount;
}

// Show scarcity information for a specific resource
export function showScarcityInfo(resourceId) {
    // Create a modal dialog with detailed scarcity information
    const modal = document.createElement('div');
    modal.className = 'scarcity-modal';
    
    const initialAmount = scarcityConfig.initialDeposits[resourceId];
    const currentAmount = resourceDeposits[resourceId];
    const percentage = Math.round((currentAmount / initialAmount) * 100);
    const efficiency = Math.round(efficiencyMultipliers[resourceId] * 100);
    
    modal.innerHTML = `
        <div class="scarcity-modal-content">
            <h3>Ressourcenknappheit: ${capitalizeFirstLetter(resourceId)}</h3>
            <div class="scarcity-detail-row">
                <span>Verbleibend:</span>
                <span>$${Math.floor(currentAmount)} /$$ {initialAmount} (${percentage}%)</span>
            </div>
            <div class="scarcity-detail-row">
                <span>Effizienz:</span>
                <span>${efficiency}%</span>
            </div>
            <div class="scarcity-detail-row">
                <span>Regeneration:</span>
                <span>${(scarcityConfig.regenerationRate[resourceId] * 100).toFixed(3)}% pro Minute</span>
            </div>
            <div class="scarcity-progress-bar">
                <div class="scarcity-progress-fill" style="width: ${percentage}%"></div>
            </div>
            <button class="close-scarcity-modal">Schließen</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for close button
    modal.querySelector('.close-scarcity-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add styles if not already added
    addScarcityModalStyles();
}

// Add styles for scarcity modal
function addScarcityModalStyles() {
    if (!document.getElementById('scarcity-modal-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'scarcity-modal-styles';
        styleElement.textContent = `
            .scarcity-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .scarcity-modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 400px;
                width: 100%;
            }
            
            .scarcity-detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
            }
            
            .scarcity-progress-bar {
                height: 20px;
                background-color: #ecf0f1;
                border-radius: 10px;
                overflow: hidden;
                margin: 15px 0;
            }
            
            .scarcity-progress-fill {
                height: 100%;
                background-color: #3498db;
            }
            
            .close-scarcity-modal {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
                width: 100%;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Helper function: Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
