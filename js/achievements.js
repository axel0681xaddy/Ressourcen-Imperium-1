// achievements.js - Errungenschaften und deren Überprüfung

import { gameState } from './gameState.js';
import { renderAchievements } from './display.js';

// Errungenschaften prüfen
export function checkAchievements() {
    let newAchievements = false;
    
    gameState.achievements.forEach(achievement => {
        if (!achievement.achieved && achievement.requirement()) {
            achievement.achieved = true;
            newAchievements = true;
            
            // Benachrichtigung anzeigen für neue Errungenschaft
            showAchievementNotification(achievement);
        }
    });
    
    if (newAchievements) {
        renderAchievements();
    }
}

// Benachrichtigung über neue Errungenschaft anzeigen
function showAchievementNotification(achievement) {
    // Temporäres Element für die Benachrichtigung erstellen
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <strong>Errungenschaft freigeschaltet!</strong>
            <div>${achievement.name}: ${achievement.description}</div>
        </div>
    `;
    
    // Element zur Seite hinzufügen
    document.body.appendChild(notification);
    
    // CSS hinzufügen (falls noch nicht vorhanden)
    addNotificationStyles();
    
    // Notification nach einigen Sekunden ausblenden und entfernen
    setTimeout(() => {
        notification.classList.add('fadeout');
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 1000);
    }, 5000);
}

// Styles für Benachrichtigungen hinzufügen
function addNotificationStyles() {
    // Prüfen, ob Styles bereits hinzugefügt wurden
    if (!document.getElementById('achievement-notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'achievement-notification-styles';
        styleElement.textContent = `
            .achievement-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #f1c40f;
                color: #34495e;
                border-radius: 8px;
                padding: 15px;
                display: flex;
                align-items: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                animation: slidein 0.5s;
                max-width: 400px;
            }
            
            .achievement-icon {
                font-size: 24px;
                margin-right: 15px;
            }
            
            .achievement-text strong {
                display: block;
                margin-bottom: 5px;
            }
            
            @keyframes slidein {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .achievement-notification.fadeout {
                animation: fadeout 1s;
                opacity: 0;
            }
            
            @keyframes fadeout {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
}

// Regelmäßige Überprüfung der Errungenschaften initialisieren
export function initAchievementChecker() {
    // Alle 5 Sekunden auf neue Errungenschaften prüfen
    setInterval(checkAchievements, 5000);
}
