// saveUI.js - Vereinfachte UI für das Speicher- und Ladesystem mit Datei-Export/Import

import { saveGame, loadGame, exportSave, importSave, resetGame } from './storage.js';

// Modal-Dialog-Status
let isModalOpen = false;

// Initialisiert die Speicher-UI
export function initSaveUI() {
    console.log('Initialisiere Speicher-UI...');
    
    // Event-Listener für die Speicher-Buttons hinzufügen
    const exportButton = document.getElementById('export-game-button');
    const importButton = document.getElementById('import-game-button');
    const resetButton = document.getElementById('reset-button');
    
    if (exportButton) {
        exportButton.addEventListener('click', handleExportGame);
    }
    
    if (importButton) {
        importButton.addEventListener('click', openImportModal);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', handleResetGame);
    }
    
    // Styles für die UI-Elemente hinzufügen
    addSaveUIStyles();
    
    console.log('Speicher-UI initialisiert.');
}

// Spiel exportieren
function handleExportGame() {
    exportSave();
}

// Import-Modal öffnen
function openImportModal() {
    if (isModalOpen) return;
    isModalOpen = true;
    
    const modal = document.createElement('div');
    modal.className = 'save-modal-overlay';
    modal.innerHTML = `
        <div class="save-modal">
            <div class="save-modal-header">
                <h2>Spielstand importieren</h2>
                <button class="save-modal-close">×</button>
            </div>
            <div class="save-modal-content">
                <p>Wähle eine Spielstand-Datei zum Importieren aus:</p>
                <div class="file-upload-container">
                    <input type="file" id="import-file" accept=".json">
                    <p class="drag-drop-info">Oder ziehe eine Datei hierher</p>
                </div>
                <div class="alternative-import">
                    <p>Alternativ kannst du auch den Spielstand-Code einfügen:</p>
                    <textarea class="import-textarea" placeholder="Spielstand-Code hier einfügen..."></textarea>
                </div>
                <div class="save-modal-actions">
                    <button class="import-save-button">Spielstand importieren</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event-Listener für Schließen-Button
    modal.querySelector('.save-modal-close').addEventListener('click', closeModal);
    
    // Event-Listener für Import-Button
    modal.querySelector('.import-save-button').addEventListener('click', function() {
        const fileInput = document.getElementById('import-file');
        const textInput = modal.querySelector('.import-textarea');
        
        if (fileInput.files.length > 0) {
            importSave(fileInput.files[0]);
            closeModal();
        } else if (textInput.value.trim() !== '') {
            importSave(textInput.value.trim());
            closeModal();
        } else {
            alert('Bitte wähle eine Datei aus oder füge einen Spielstand-Code ein.');
        }
    });
    
    // Drag & Drop Unterstützung
    const dropZone = modal.querySelector('.file-upload-container');
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            document.getElementById('import-file').files = e.dataTransfer.files;
        }
    });
    
    // Event-Listener für Außenbereich (zum Schließen)
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Escape-Taste zum Schließen
    const escKeyHandler = function(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escKeyHandler);
        }
    };
    document.addEventListener('keydown', escKeyHandler);
}

// Spiel zurücksetzen
function handleResetGame() {
    resetGame(true); // Mit Bestätigungsdialog
}

// Modal schließen
function closeModal() {
    const modal = document.querySelector('.save-modal-overlay');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            isModalOpen = false;
        }, 300);
    }
}

// Styles für die UI-Elemente hinzufügen
function addSaveUIStyles() {
    if (!document.getElementById('save-ui-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'save-ui-styles';
        styleElement.textContent = `
            .save-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fade-in 0.2s;
            }
            
            .save-modal {
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: modal-in 0.3s;
            }
            
            .save-modal-header {
                background-color: #3498db;
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .save-modal-header h2 {
                margin: 0;
                font-size: 1.4em;
            }
            
            .save-modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .save-modal-content {
                padding: 20px;
                overflow-y: auto;
                max-height: calc(90vh - 60px);
            }
            
            .file-upload-container {
                border: 2px dashed #ccc;
                padding: 20px;
                text-align: center;
                margin: 15px 0;
                border-radius: 5px;
                transition: background-color 0.2s;
            }
            
            .file-upload-container.drag-over {
                background-color: #f1f9ff;
                border-color: #3498db;
            }
            
            .drag-drop-info {
                color: #666;
                margin-top: 10px;
                font-style: italic;
            }
            
            .alternative-import {
                margin-top: 20px;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
            
            .import-textarea {
                width: 100%;
                height: 120px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                resize: none;
                font-family: monospace;
                margin: 10px 0;
            }
            
            .save-modal-actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 15px;
            }
            
            .import-save-button {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .import-save-button:hover {
                background-color: #2980b9;
            }
            
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes modal-in {
                from {
                    opacity: 0;
                    transform: scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .save-modal-overlay.fade-out {
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .save-modal-overlay.fade-out .save-modal {
                transform: scale(0.8);
                transition: transform 0.3s;
            }
            
            @media (max-width: 600px) {
                .save-modal {
                    width: 95%;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}