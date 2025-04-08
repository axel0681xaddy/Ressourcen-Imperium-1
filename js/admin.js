// admin.js - Admin-Oberfläche für Spieleinstellungen

// Konfigurationsdaten
let configData = {
    generators: [],
    converters: [],
    balancing: {
        generatorCostMultiplier: 1.15,
        converterCostMultiplier: 1.20,
        clickCooldown: 500,
        clickValues: {
            wood: 1,
            stone: 0,
            iron: 0,
            copper: 0
        }
    },
    prestige: {
        requirement: 1000000,
        formula: 'sqrt',
        multiplierValue: 0.1
    }
};

// Status-Nachricht anzeigen
function showStatusMessage(message, isError = false) {
    const statusElement = document.getElementById('status-message');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = 'status-message ' + (isError ? 'error' : 'success');
    
    // Nach 3 Sekunden ausblenden
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }, 3000);
}

// Lädt die Spielkonfiguration aus dem localStorage
function loadGameConfig() {
    try {
        // Spielstand laden, falls vorhanden
        const savedGame = localStorage.getItem('resourceImperiumSave');
        
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            
            // Generatoren extrahieren
            configData.generators = gameState.generators.map(generator => ({
                id: generator.id,
                name: generator.name,
                resource: generator.resource,
                baseOutput: generator.baseOutput,
                baseCost: {...generator.baseCost},
                cost: {...generator.cost},
                amount: generator.amount,
                unlocked: generator.unlocked
            }));
            
            // Konverter extrahieren
            configData.converters = gameState.converters.map(converter => ({
                id: converter.id,
                name: converter.name,
                input: {...converter.input},
                output: {...converter.output},
                baseSpeed: converter.baseSpeed,
                baseCost: {...converter.baseCost},
                cost: {...converter.cost},
                amount: converter.amount,
                unlocked: converter.unlocked
            }));
            
            // Balancing-Einstellungen extrahieren
            // Wir verwenden hier Default-Werte, wenn sie im Spielstand nicht explizit gespeichert sind
            configData.balancing = {
                generatorCostMultiplier: 1.15,
                converterCostMultiplier: 1.20,
                clickCooldown: 500,
                clickValues: {
                    wood: gameState.clickValue?.wood || 1,
                    stone: gameState.clickValue?.stone || 0,
                    iron: gameState.clickValue?.iron || 0,
                    copper: gameState.clickValue?.copper || 0
                }
            };
            
            // Prestige-Einstellungen
            configData.prestige = {
                requirement: 1000000,
                formula: 'sqrt',
                multiplierValue: 0.1
            };
            
            console.log('Spielkonfiguration erfolgreich geladen');
            renderAllSections();
            
            // NEU: Prestige-Punkte im Formular anzeigen
            const prestigePointsInput = document.getElementById('prestige-points-input');
            if (prestigePointsInput && gameState.prestigePoints !== undefined) {
                prestigePointsInput.value = gameState.prestigePoints;
            }
            
            return true;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Spielkonfiguration:', error);
        showStatusMessage('Fehler beim Laden der Spielkonfiguration: ' + error.message, true);
    }
    
    return false;
}

// Speichert die Änderungen zurück in den Spielstand
function saveChangesToGame() {
    try {
        // Aktuellen Spielstand laden
        const savedGame = localStorage.getItem('resourceImperiumSave');
        
        if (!savedGame) {
            showStatusMessage('Kein Spielstand gefunden, der aktualisiert werden kann.', true);
            return false;
        }
        
        const gameState = JSON.parse(savedGame);
        
        // Generatoren aktualisieren
        configData.generators.forEach(updatedGenerator => {
            const gameGenerator = gameState.generators.find(g => g.id === updatedGenerator.id);
            if (gameGenerator) {
                gameGenerator.name = updatedGenerator.name;
                gameGenerator.resource = updatedGenerator.resource;
                gameGenerator.baseOutput = updatedGenerator.baseOutput;
                // Basis-Kosten aktualisieren
                Object.keys(updatedGenerator.baseCost).forEach(resource => {
                    gameGenerator.baseCost[resource] = updatedGenerator.baseCost[resource];
                });
                // Aktuelle Kosten aktualisieren
                Object.keys(updatedGenerator.cost).forEach(resource => {
                    gameGenerator.cost[resource] = updatedGenerator.cost[resource];
                });
                gameGenerator.unlocked = updatedGenerator.unlocked;
            }
        });
        
        // Konverter aktualisieren
        configData.converters.forEach(updatedConverter => {
            const gameConverter = gameState.converters.find(c => c.id === updatedConverter.id);
            if (gameConverter) {
                gameConverter.name = updatedConverter.name;
                // Input aktualisieren
                Object.keys(updatedConverter.input).forEach(resource => {
                    gameConverter.input[resource] = updatedConverter.input[resource];
                });
                // Output aktualisieren
                Object.keys(updatedConverter.output).forEach(resource => {
                    gameConverter.output[resource] = updatedConverter.output[resource];
                });
                gameConverter.baseSpeed = updatedConverter.baseSpeed;
                // Basis-Kosten aktualisieren
                Object.keys(updatedConverter.baseCost).forEach(resource => {
                    gameConverter.baseCost[resource] = updatedConverter.baseCost[resource];
                });
                // Aktuelle Kosten aktualisieren
                Object.keys(updatedConverter.cost).forEach(resource => {
                    gameConverter.cost[resource] = updatedConverter.cost[resource];
                });
                gameConverter.unlocked = updatedConverter.unlocked;
            }
        });
        
        // Balancing-Einstellungen aktualisieren
        // Klick-Werte aktualisieren
        if (gameState.clickValue) {
            Object.keys(configData.balancing.clickValues).forEach(resource => {
                gameState.clickValue[resource] = configData.balancing.clickValues[resource];
            });
        }
        
        // Prestige-Einstellungen aktualisieren (NEU)
        // Direkt vom Formular die aktuellen Werte übernehmen
        const prestigeRequirement = document.getElementById('prestige-requirement');
        const prestigeFormula = document.getElementById('prestige-points-formula');
        const prestigeMultiplierValue = document.getElementById('prestige-multiplier-value');
        const prestigePointsInput = document.getElementById('prestige-points-input');
        
        if (prestigeRequirement && prestigeFormula && prestigeMultiplierValue && prestigePointsInput) {
            // Direktes Update des Spielzustands - wichtig für Prestige-Punkte
            gameState.prestigePoints = parseInt(prestigePointsInput.value || 0);
            gameState.prestigeMultiplier = 1 + (gameState.prestigePoints * parseFloat(prestigeMultiplierValue.value || 0.1));
            
            // Aktualisieren der Prestige-Konfiguration
            configData.prestige.requirement = parseInt(prestigeRequirement.value);
            configData.prestige.formula = prestigeFormula.value;
            configData.prestige.multiplierValue = parseFloat(prestigeMultiplierValue.value);
        }
        
        // Speichern des aktualisierten Spielstands
        localStorage.setItem('resourceImperiumSave', JSON.stringify(gameState));
        
        // NEU: Visuelle Rückmeldung hinzufügen
        showStatusMessage('Änderungen erfolgreich gespeichert!');
        
        // Zusätzlich eine auffälligere Bestätigung anzeigen
        const successPopup = document.createElement('div');
        successPopup.className = 'save-success-popup';
        successPopup.innerHTML = `
            <div class="save-success-icon">✓</div>
            <div class="save-success-message">Speichern erfolgreich!</div>
        `;
        document.body.appendChild(successPopup);
        
        // CSS für die Popup-Meldung
        if (!document.getElementById('save-success-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'save-success-styles';
            styleElement.textContent = `
                .save-success-popup {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(46, 204, 113, 0.9);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    z-index: 2000;
                    animation: popup-fade-in 0.3s ease-out;
                }
                
                .save-success-icon {
                    font-size: 24px;
                }
                
                .save-success-message {
                    font-size: 18px;
                    font-weight: bold;
                }
                
                @keyframes popup-fade-in {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -70%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
                
                @keyframes popup-fade-out {
                    from {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                    to {
                        opacity: 0;
                        transform: translate(-50%, -30%);
                    }
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        // Popup nach 2 Sekunden ausblenden
        setTimeout(() => {
            successPopup.style.animation = 'popup-fade-out 0.3s ease-out forwards';
            setTimeout(() => {
                if (successPopup.parentNode) {
                    successPopup.parentNode.removeChild(successPopup);
                }
            }, 300);
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Änderungen:', error);
        showStatusMessage('Fehler beim Speichern der Änderungen: ' + error.message, true);
        return false;
    }
}

// Generatoren-Tabelle rendern
function renderGeneratorsTable() {
    const tbody = document.querySelector('#generators-table tbody');
    tbody.innerHTML = '';
    
    configData.generators.forEach(generator => {
        const row = document.createElement('tr');
        
        // Name
        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = generator.name;
        nameInput.dataset.id = generator.id;
        nameInput.dataset.field = 'name';
        nameInput.addEventListener('change', updateGeneratorField);
        nameCell.appendChild(nameInput);
        
        // Ressource
        const resourceCell = document.createElement('td');
        const resourceSelector = document.createElement('select');
        resourceSelector.dataset.id = generator.id;
        resourceSelector.dataset.field = 'resource';
        
        const resources = ['none', 'coins', 'wood', 'stone', 'iron', 'copper'];
        resources.forEach(res => {
            const option = document.createElement('option');
            option.value = res;
            option.textContent = res === 'none' ? 'Keine' : capitalizeFirstLetter(res);
            option.selected = res === generator.resource;
            resourceSelector.appendChild(option);
        });
        
        resourceSelector.addEventListener('change', updateGeneratorField);
        resourceCell.appendChild(resourceSelector);
        
        // Basis-Produktion
        const outputCell = document.createElement('td');
        const outputInput = document.createElement('input');
        outputInput.type = 'number';
        outputInput.min = '0.1';
        outputInput.step = '0.1';
        outputInput.value = generator.baseOutput;
        outputInput.dataset.id = generator.id;
        outputInput.dataset.field = 'baseOutput';
        outputInput.style.width = '80px';
        outputInput.addEventListener('change', updateGeneratorField);
        outputCell.appendChild(outputInput);
        
        // Basis-Kosten
        const baseCostCell = document.createElement('td');
        Object.keys(generator.baseCost).forEach(resource => {
            const costDiv = document.createElement('div');
            costDiv.className = 'resource-cost';
            
            const resourceSpan = document.createElement('span');
            resourceSpan.className = `resource-icon ${resource}-icon`;
            
            const costInput = document.createElement('input');
            costInput.type = 'number';
            costInput.min = '1';
            costInput.step = '1';
            costInput.value = generator.baseCost[resource];
            costInput.dataset.id = generator.id;
            costInput.dataset.field = 'baseCost';
            costInput.dataset.resource = resource;
            costInput.style.width = '60px';
            costInput.addEventListener('change', updateGeneratorCost);
            
            costDiv.appendChild(resourceSpan);
            costDiv.appendChild(costInput);
            baseCostCell.appendChild(costDiv);
        });
        
        // Aktuelle Kosten
        const costCell = document.createElement('td');
        Object.keys(generator.cost).forEach(resource => {
            const costDiv = document.createElement('div');
            costDiv.className = 'resource-cost';
            
            const resourceSpan = document.createElement('span');
            resourceSpan.className = `resource-icon ${resource}-icon`;
            
            const costInput = document.createElement('input');
            costInput.type = 'number';
            costInput.min = '1';
            costInput.step = '1';
            costInput.value = generator.cost[resource];
            costInput.dataset.id = generator.id;
            costInput.dataset.field = 'cost';
            costInput.dataset.resource = resource;
            costInput.style.width = '60px';
            costInput.addEventListener('change', updateGeneratorCost);
            
            costDiv.appendChild(resourceSpan);
            costDiv.appendChild(costInput);
            costCell.appendChild(costDiv);
        });
        
        // Freigeschaltet
        const unlockedCell = document.createElement('td');
        const unlockedInput = document.createElement('input');
        unlockedInput.type = 'checkbox';
        unlockedInput.checked = generator.unlocked;
        unlockedInput.dataset.id = generator.id;
        unlockedInput.dataset.field = 'unlocked';
        unlockedInput.addEventListener('change', updateGeneratorField);
        unlockedCell.appendChild(unlockedInput);
        
        // Alle Zellen zur Zeile hinzufügen
        row.appendChild(nameCell);
        row.appendChild(resourceCell);
        row.appendChild(outputCell);
        row.appendChild(baseCostCell);
        row.appendChild(costCell);
        row.appendChild(unlockedCell);
        
        tbody.appendChild(row);
    });
}

// Konverter-Tabelle rendern
function renderConvertersTable() {
    const tbody = document.querySelector('#converters-table tbody');
    tbody.innerHTML = '';
    
    configData.converters.forEach(converter => {
        const row = document.createElement('tr');
        
        // Name
        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = converter.name;
        nameInput.dataset.id = converter.id;
        nameInput.dataset.field = 'name';
        nameInput.addEventListener('change', updateConverterField);
        nameCell.appendChild(nameInput);
        
        // Eingang-Ressourcen
        const inputCell = document.createElement('td');
        Object.keys(converter.input).forEach(resource => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'resource-cost';
            
            const resourceSpan = document.createElement('span');
            resourceSpan.className = `resource-icon ${resource}-icon`;
            
            const inputValueInput = document.createElement('input');
            inputValueInput.type = 'number';
            inputValueInput.min = '1';
            inputValueInput.step = '1';
            inputValueInput.value = converter.input[resource];
            inputValueInput.dataset.id = converter.id;
            inputValueInput.dataset.field = 'input';
            inputValueInput.dataset.resource = resource;
            inputValueInput.style.width = '60px';
            inputValueInput.addEventListener('change', updateConverterIO);
            
            inputDiv.appendChild(resourceSpan);
            inputDiv.appendChild(inputValueInput);
            inputDiv.appendChild(document.createTextNode(' ' + capitalizeFirstLetter(resource)));
            inputCell.appendChild(inputDiv);
        });
        
        // Ausgang-Ressourcen
        const outputCell = document.createElement('td');
        Object.keys(converter.output).forEach(resource => {
            const outputDiv = document.createElement('div');
            outputDiv.className = 'resource-cost';
            
            const resourceSpan = document.createElement('span');
            resourceSpan.className = `resource-icon ${resource}-icon`;
            
            const outputValueInput = document.createElement('input');
            outputValueInput.type = 'number';
            outputValueInput.min = '1';
            outputValueInput.step = '1';
            outputValueInput.value = converter.output[resource];
            outputValueInput.dataset.id = converter.id;
            outputValueInput.dataset.field = 'output';
            outputValueInput.dataset.resource = resource;
            outputValueInput.style.width = '60px';
            outputValueInput.addEventListener('change', updateConverterIO);
            
            outputDiv.appendChild(resourceSpan);
            outputDiv.appendChild(outputValueInput);
            outputDiv.appendChild(document.createTextNode(' ' + capitalizeFirstLetter(resource)));
            outputCell.appendChild(outputDiv);
        });
        
        // Geschwindigkeit
        const speedCell = document.createElement('td');
        const speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.min = '0.01';
        speedInput.max = '1';
        speedInput.step = '0.01';
        speedInput.value = converter.baseSpeed;
        speedInput.dataset.id = converter.id;
        speedInput.dataset.field = 'baseSpeed';
        speedInput.style.width = '80px';
        speedInput.addEventListener('change', updateConverterField);
        speedCell.appendChild(speedInput);
        
        // Kosten
        const costCell = document.createElement('td');
        Object.keys(converter.baseCost).forEach(resource => {
            const costDiv = document.createElement('div');
            costDiv.className = 'resource-cost';
            
            const resourceSpan = document.createElement('span');
            resourceSpan.className = `resource-icon ${resource}-icon`;
            
            const costInput = document.createElement('input');
            costInput.type = 'number';
            costInput.min = '1';
            costInput.step = '1';
            costInput.value = converter.baseCost[resource];
            costInput.dataset.id = converter.id;
            costInput.dataset.field = 'baseCost';
            costInput.dataset.resource = resource;
            costInput.style.width = '60px';
            costInput.addEventListener('change', updateConverterCost);
            
            costDiv.appendChild(resourceSpan);
            costDiv.appendChild(costInput);
            costDiv.appendChild(document.createTextNode(' ' + capitalizeFirstLetter(resource)));
            costCell.appendChild(costDiv);
        });
        
        // Freigeschaltet
        const unlockedCell = document.createElement('td');
        const unlockedInput = document.createElement('input');
        unlockedInput.type = 'checkbox';
        unlockedInput.checked = converter.unlocked;
        unlockedInput.dataset.id = converter.id;
        unlockedInput.dataset.field = 'unlocked';
        unlockedInput.addEventListener('change', updateConverterField);
        unlockedCell.appendChild(unlockedInput);
        
        // Alle Zellen zur Zeile hinzufügen
        row.appendChild(nameCell);
        row.appendChild(inputCell);
        row.appendChild(outputCell);
        row.appendChild(speedCell);
        row.appendChild(costCell);
        row.appendChild(unlockedCell);
        
        tbody.appendChild(row);
    });
}

// Balancing-Sektion initialisieren
function initBalancingSection() {
    // Generator-Cost-Multiplier
    document.getElementById('generator-cost-multiplier').value = configData.balancing.generatorCostMultiplier;
    document.getElementById('generator-cost-multiplier').addEventListener('change', updateBalancingField);
    
    // Converter-Cost-Multiplier
    document.getElementById('converter-cost-multiplier').value = configData.balancing.converterCostMultiplier;
    document.getElementById('converter-cost-multiplier').addEventListener('change', updateBalancingField);
    
    // Click-Cooldown
    document.getElementById('click-cooldown').value = configData.balancing.clickCooldown;
    document.getElementById('click-cooldown').addEventListener('change', updateBalancingField);
    
    // Klick-Werte
    document.getElementById('click-wood').value = configData.balancing.clickValues.wood;
    document.getElementById('click-wood').addEventListener('change', updateClickValue);
    
    document.getElementById('click-stone').value = configData.balancing.clickValues.stone;
    document.getElementById('click-stone').addEventListener('change', updateClickValue);
    
    document.getElementById('click-iron').value = configData.balancing.clickValues.iron;
    document.getElementById('click-iron').addEventListener('change', updateClickValue);
    
    document.getElementById('click-copper').value = configData.balancing.clickValues.copper;
    document.getElementById('click-copper').addEventListener('change', updateClickValue);
}

// Prestige-Sektion initialisieren
function initPrestigeSection() {
    // Prestige-Anforderung
    document.getElementById('prestige-requirement').value = configData.prestige.requirement;
    document.getElementById('prestige-requirement').addEventListener('change', updatePrestigeField);
    
    // Prestige-Punkte-Formel
    document.getElementById('prestige-points-formula').value = configData.prestige.formula;
    document.getElementById('prestige-points-formula').addEventListener('change', updatePrestigeField);
    
    // Prestige-Multiplikator-Wert
    document.getElementById('prestige-multiplier-value').value = configData.prestige.multiplierValue;
    document.getElementById('prestige-multiplier-value').addEventListener('change', updatePrestigeField);
    
    // NEU: Aktueller Prestige-Punktestand hinzufügen
    try {
        const savedGame = localStorage.getItem('resourceImperiumSave');
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            
            // Prüfen, ob wir bereits ein Input-Feld haben
            let prestigePointsInput = document.getElementById('prestige-points-input');
            
            // Wenn das Input-Feld noch nicht existiert, erstellen wir es
            if (!prestigePointsInput) {
                const container = document.querySelector('.parameter-group:first-child');
                if (container) {
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    formGroup.innerHTML = `
                        <label for="prestige-points-input">Aktuelle Prestige-Punkte:</label>
                        <input type="number" id="prestige-points-input" min="0" step="1" value="${gameState.prestigePoints || 0}">
                        <small>Direktes Ändern der aktuellen Prestige-Punkte</small>
                    `;
                    
                    // Nach dem ersten Element einfügen (Anforderung)
                    const firstFormGroup = container.querySelector('.form-group');
                    if (firstFormGroup) {
                        container.insertBefore(formGroup, firstFormGroup.nextSibling);
                    } else {
                        container.appendChild(formGroup);
                    }
                    
                    // Event-Listener hinzufügen
                    document.getElementById('prestige-points-input').addEventListener('change', updatePrestigeField);
                }
            } else {
                // Wenn es existiert, nur den Wert aktualisieren
                prestigePointsInput.value = gameState.prestigePoints || 0;
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der Prestige-Punkte:', error);
    }
}

// Debug-Sektion initialisieren
function initDebugSection() {
    // Ressourcen hinzufügen Button
    document.getElementById('add-resources-btn').addEventListener('click', addResources);
    
    // Schnelle Aktionen
    document.getElementById('unlock-all-btn').addEventListener('click', unlockAll);
    document.getElementById('reset-game-btn').addEventListener('click', resetGame);
    document.getElementById('test-progression-btn').addEventListener('click', testProgression);
}

// Alle Bereiche rendern
function renderAllSections() {
    renderGeneratorsTable();
    renderConvertersTable();
    initBalancingSection();
    initPrestigeSection();
    initDebugSection();
}

// Event-Handler für Generatorfelder
function updateGeneratorField(event) {
    const field = event.target.dataset.field;
    const id = event.target.dataset.id;
    const generator = configData.generators.find(g => g.id === id);
    
    if (!generator) return;
    
    if (field === 'unlocked') {
        generator[field] = event.target.checked;
    } else if (field === 'baseOutput') {
        generator[field] = parseFloat(event.target.value);
    } else {
        generator[field] = event.target.value;
    }
    
    console.log(`Generator ${id} aktualisiert:`, generator);
}

// Event-Handler für Generator-Kosten
function updateGeneratorCost(event) {
    const field = event.target.dataset.field;
    const id = event.target.dataset.id;
    const resource = event.target.dataset.resource;
    const generator = configData.generators.find(g => g.id === id);
    
    if (!generator || !generator[field]) return;
    
    generator[field][resource] = parseInt(event.target.value);
    console.log(`Generator ${id} ${field} für ${resource} aktualisiert:`, generator[field][resource]);
}

// Event-Handler für Konverterfelder
function updateConverterField(event) {
    const field = event.target.dataset.field;
    const id = event.target.dataset.id;
    const converter = configData.converters.find(c => c.id === id);
    
    if (!converter) return;
    
    if (field === 'unlocked') {
        converter[field] = event.target.checked;
    } else if (field === 'baseSpeed') {
        converter[field] = parseFloat(event.target.value);
    } else {
        converter[field] = event.target.value;
    }
    
    console.log(`Konverter ${id} aktualisiert:`, converter);
}

// Event-Handler für Konverter Input/Output
function updateConverterIO(event) {
    const field = event.target.dataset.field;
    const id = event.target.dataset.id;
    const resource = event.target.dataset.resource;
    const converter = configData.converters.find(c => c.id === id);
    
    if (!converter || !converter[field]) return;
    
    converter[field][resource] = parseInt(event.target.value);
    console.log(`Konverter ${id} ${field} für ${resource} aktualisiert:`, converter[field][resource]);
}

// Event-Handler für Konverter-Kosten
function updateConverterCost(event) {
    const field = event.target.dataset.field;
    const id = event.target.dataset.id;
    const resource = event.target.dataset.resource;
    const converter = configData.converters.find(c => c.id === id);
    
    if (!converter || !converter[field]) return;
    
    converter[field][resource] = parseInt(event.target.value);
    console.log(`Konverter ${id} ${field} für ${resource} aktualisiert:`, converter[field][resource]);
}

// Event-Handler für Balancing-Einstellungen
function updateBalancingField(event) {
    const id = event.target.id;
    
    switch (id) {
        case 'generator-cost-multiplier':
            configData.balancing.generatorCostMultiplier = parseFloat(event.target.value);
            break;
        case 'converter-cost-multiplier':
            configData.balancing.converterCostMultiplier = parseFloat(event.target.value);
            break;
        case 'click-cooldown':
            configData.balancing.clickCooldown = parseInt(event.target.value);
            break;
    }
    
    console.log('Balancing-Einstellung aktualisiert:', id, event.target.value);
}

// Event-Handler für Klick-Werte
function updateClickValue(event) {
    const id = event.target.id;
    const resource = id.split('-')[1]; // z.B. "click-wood" -> "wood"
    
    configData.balancing.clickValues[resource] = parseFloat(event.target.value);
    console.log(`Klick-Wert für ${resource} aktualisiert:`, configData.balancing.clickValues[resource]);
}

// Event-Handler für Prestige-Einstellungen
function updatePrestigeField(event) {
    const id = event.target.id;
    
    switch (id) {
        case 'prestige-requirement':
            configData.prestige.requirement = parseInt(event.target.value);
            break;
        case 'prestige-points-formula':
            configData.prestige.formula = event.target.value;
            break;
        case 'prestige-multiplier-value':
            configData.prestige.multiplierValue = parseFloat(event.target.value);
            break;
        case 'prestige-points-input':
            // Nur protokollieren, der Wert wird beim Speichern direkt im Spielstand aktualisiert
            console.log(`Prestige-Punkte aktualisiert: ${event.target.value}`);
            break;
    }
    
    console.log('Prestige-Einstellung aktualisiert:', id, event.target.value);
}

// Debug-Funktion: Ressourcen zum Spiel hinzufügen
function addResources() {
    try {
        // Aktuellen Spielstand laden
        const savedGame = localStorage.getItem('resourceImperiumSave');
        
        if (!savedGame) {
            showStatusMessage('Kein Spielstand gefunden.', true);
            return;
        }
        
        const gameState = JSON.parse(savedGame);
        
        // Für jede Ressource die eingegebene Menge hinzufügen
        const resources = ['coins', 'wood', 'stone', 'iron', 'copper', 'planks', 'bricks', 'tools', 'jewelry'];
        
        resources.forEach(resource => {
            const inputElement = document.getElementById(`add-${resource}`);
            if (inputElement && inputElement.value) {
                const amount = parseInt(inputElement.value);
                if (amount > 0) {
                    gameState.resources[resource] = (gameState.resources[resource] || 0) + amount;
                }
            }
        });
        
        // Spielstand speichern
        localStorage.setItem('resourceImperiumSave', JSON.stringify(gameState));
        
        showStatusMessage('Ressourcen erfolgreich hinzugefügt!');
    } catch (error) {
        console.error('Fehler beim Hinzufügen von Ressourcen:', error);
        showStatusMessage('Fehler: ' + error.message, true);
    }
}

// Debug-Funktion: Alles freischalten
function unlockAll() {
    try {
        // Aktuellen Spielstand laden
        const savedGame = localStorage.getItem('resourceImperiumSave');
        
        if (!savedGame) {
            showStatusMessage('Kein Spielstand gefunden.', true);
            return;
        }
        
        const gameState = JSON.parse(savedGame);
        
        // Alle Ressourcen freischalten
        Object.keys(gameState.unlockedResources).forEach(resource => {
            gameState.unlockedResources[resource] = true;
        });
        
        // Alle Generatoren freischalten
        gameState.generators.forEach(generator => {
            generator.unlocked = true;
        });
        
        // Alle Konverter freischalten
        gameState.converters.forEach(converter => {
            converter.unlocked = true;
        });
        
        // Alle Upgrades freischalten (aber nicht kaufen)
        gameState.upgrades.forEach(upgrade => {
            upgrade.unlocked = true;
        });
        
        // Spielstand speichern
        localStorage.setItem('resourceImperiumSave', JSON.stringify(gameState));
        
        showStatusMessage('Alle Spielfunktionen wurden freigeschaltet!');
    } catch (error) {
        console.error('Fehler beim Freischalten:', error);
        showStatusMessage('Fehler: ' + error.message, true);
    }
}

// Debug-Funktion: Spiel zurücksetzen
function resetGame() {
    if (confirm('Möchtest du wirklich das Spiel vollständig zurücksetzen? Alle Fortschritte werden verloren gehen!')) {
        try {
            localStorage.removeItem('resourceImperiumSave');
            localStorage.removeItem('resourceImperiumStats');
            
            showStatusMessage('Spiel wurde zurückgesetzt. Lade die Seite neu, um die Änderungen zu sehen.');
        } catch (error) {
            console.error('Fehler beim Zurücksetzen des Spiels:', error);
            showStatusMessage('Fehler: ' + error.message, true);
        }
    }
}

// Debug-Funktion: Progression testen
function testProgression() {
    alert('Diese Funktion ist noch nicht implementiert.');
}

// Event-Handler für die Tabs in der Seitenleiste
function initTabHandlers() {
    const tabs = document.querySelectorAll('.admin-nav a');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Aktiven Tab deaktivieren
            const activeTab = document.querySelector('.admin-nav a.active');
            const activeSection = document.querySelector('.admin-section.active');
            
            if (activeTab) activeTab.classList.remove('active');
            if (activeSection) activeSection.classList.remove('active');
            
            // Neuen Tab aktivieren
            this.classList.add('active');
            const targetSectionId = this.getAttribute('data-section') + '-section';
            const targetSection = document.getElementById(targetSectionId);
            
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// Event-Handler für Speichern-Buttons
function initSaveHandlers() {
    document.getElementById('save-generators').addEventListener('click', function() {
        if (saveChangesToGame()) {
            showStatusMessage('Generator-Einstellungen gespeichert.');
        }
    });
    
    document.getElementById('save-converters').addEventListener('click', function() {
        if (saveChangesToGame()) {
            showStatusMessage('Konverter-Einstellungen gespeichert.');
        }
    });
    
    document.getElementById('save-balancing').addEventListener('click', function() {
        if (saveChangesToGame()) {
            showStatusMessage('Balancing-Einstellungen gespeichert.');
        }
    });
    
    document.getElementById('save-prestige').addEventListener('click', function() {
        if (saveChangesToGame()) {
            showStatusMessage('Prestige-Einstellungen gespeichert.');
        }
    });
    
    // Zurücksetzen-Buttons
    document.getElementById('reset-generators').addEventListener('click', function() {
        if (confirm('Möchtest du die Generator-Einstellungen zurücksetzen?')) {
            loadGameConfig();
            showStatusMessage('Generator-Einstellungen zurückgesetzt.');
        }
    });
    
    document.getElementById('reset-converters').addEventListener('click', function() {
        if (confirm('Möchtest du die Konverter-Einstellungen zurücksetzen?')) {
            loadGameConfig();
            showStatusMessage('Konverter-Einstellungen zurückgesetzt.');
        }
    });
    
    document.getElementById('reset-balancing').addEventListener('click', function() {
        if (confirm('Möchtest du die Balancing-Einstellungen zurücksetzen?')) {
            loadGameConfig();
            showStatusMessage('Balancing-Einstellungen zurückgesetzt.');
        }
    });
    
    document.getElementById('reset-prestige').addEventListener('click', function() {
        if (confirm('Möchtest du die Prestige-Einstellungen zurücksetzen?')) {
            loadGameConfig();
            showStatusMessage('Prestige-Einstellungen zurückgesetzt.');
        }
    });
}

// Hilfsfunktion: Ersten Buchstaben großschreiben
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    // Tab-Handler initialisieren
    initTabHandlers();
    
    // Speichern-Handler initialisieren
    initSaveHandlers();
    
    // Konfiguration laden
    loadGameConfig();
});