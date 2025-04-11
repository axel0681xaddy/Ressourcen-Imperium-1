/**
 * @fileoverview Spielschleife und Timing-Funktionen
 * @author Ressourcen-Imperium Team
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export class GameLoop {
    constructor(game) {
        this.game = game;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.frames = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        this.fpsUpdateCallback = null;
        this.frameId = null;
        
        // Konstanten
        this.FIXED_TIMESTEP = 1000 / GAME_CONFIG.TICK_RATE;
        this.MAX_FRAME_TIME = GAME_CONFIG.MAX_DELTA_TIME * 1000;
    }

    /**
     * Startet die Spielschleife
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.lastFpsUpdate = this.lastFrameTime;
        this.frames = 0;
        
        this.loop(this.lastFrameTime);
    }

    /**
     * Pausiert die Spielschleife
     */
    pause() {
        this.isRunning = false;
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    /**
     * Setzt die Spielschleife fort
     */
    resume() {
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Die Hauptspielschleife
     * @param {number} currentTime - Aktuelle Zeit in Millisekunden
     * @private
     */
    loop(currentTime) {
        if (!this.isRunning) return;

        this.frameId = requestAnimationFrame(time => this.loop(time));

        // Berechne vergangene Zeit
        let deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Verhindere zu große Zeitsprünge
        if (deltaTime > this.MAX_FRAME_TIME) {
            deltaTime = this.MAX_FRAME_TIME;
        }

        // Aktualisiere FPS-Zähler
        this.updateFps(currentTime);

        // Akkumuliere Zeit für feste Zeitschritte
        this.accumulator += deltaTime;

        // Führe Updates mit festen Zeitschritten durch
        while (this.accumulator >= this.FIXED_TIMESTEP) {
            try {
                this.fixedUpdate(this.FIXED_TIMESTEP / 1000); // Konvertiere zu Sekunden
            } catch (error) {
                console.error('Fehler im fixedUpdate:', error);
                this.handleError(error);
            }
            this.accumulator -= this.FIXED_TIMESTEP;
        }

        // Berechne Interpolationsfaktor
        const alpha = this.accumulator / this.FIXED_TIMESTEP;

        // Führe Rendering durch
        try {
            this.render(alpha);
        } catch (error) {
            console.error('Fehler im render:', error);
            this.handleError(error);
        }
    }

    /**
     * Update mit festem Zeitschritt
     * @param {number} deltaTime - Zeitschritt in Sekunden
     * @private
     */
    fixedUpdate(deltaTime) {
        // Aktualisiere Spiellogik
        this.game.update(deltaTime);
    }

    /**
     * Rendert das Spiel
     * @param {number} interpolation - Interpolationsfaktor zwischen Updates
     * @private
     */
    render(interpolation) {
        // Aktualisiere UI mit Interpolation
        this.game.uiManager.update(interpolation);
    }

    /**
     * Aktualisiert FPS-Zähler
     * @param {number} currentTime - Aktuelle Zeit
     * @private
     */
    updateFps(currentTime) {
        this.frames++;

        if (currentTime > this.lastFpsUpdate + 1000) {
            this.currentFps = Math.round(
                (this.frames * 1000) / (currentTime - this.lastFpsUpdate)
            );

            this.lastFpsUpdate = currentTime;
            this.frames = 0;

            if (this.fpsUpdateCallback) {
                this.fpsUpdateCallback(this.currentFps);
            }

            // Performance-Warnung bei niedrigen FPS
            if (this.currentFps < 30) {
                console.warn('Niedrige FPS:', this.currentFps);
                this.checkPerformance();
            }
        }
    }

    /**
     * Setzt den Callback für FPS-Updates
     * @param {Function} callback - Callback-Funktion
     */
    setFpsUpdateHandler(callback) {
        this.fpsUpdateCallback = callback;
    }

    /**
     * Überprüft die Performance
     * @private
     */
    checkPerformance() {
        // Sammle Performance-Metriken
        const metrics = {
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null,
            fps: this.currentFps,
            timing: performance.timing
        };

        // Protokolliere Metriken
        console.debug('Performance Metriken:', metrics);

        // Führe Optimierungen durch wenn nötig
        if (this.currentFps < 20) {
            this.applyEmergencyOptimizations();
        }
    }

    /**
     * Führt Notfall-Optimierungen durch
     * @private
     */
    applyEmergencyOptimizations() {
        // Reduziere Partikeleffekte
        if (this.game.settings.particleEffects) {
            this.game.settings.particleEffects = false;
            console.log('Partikeleffekte deaktiviert für bessere Performance');
        }

        // Reduziere UI-Update-Rate
        this.game.uiManager.updateInterval *= 2;
        console.log('UI-Update-Rate reduziert für bessere Performance');
    }

    /**
     * Behandelt Fehler in der Spielschleife
     * @param {Error} error - Aufgetretener Fehler
     * @private
     */
    handleError(error) {
        // Protokolliere Fehler
        console.error('Spielschleifenfehler:', error);

        // Versuche Wiederherstellung
        try {
            this.accumulator = 0; // Reset Akkumulator
            this.lastFrameTime = performance.now();

            // Benachrichtige Benutzer
            this.game.uiManager.showNotification(
                'Ein Fehler ist aufgetreten. Das Spiel versucht sich zu erholen.',
                'error'
            );

        } catch (recoveryError) {
            // Bei kritischem Fehler: Pausiere Spiel
            console.error('Kritischer Fehler - Pausiere Spiel:', recoveryError);
            this.pause();
            
            // Zeige Fehlerdialog
            this.game.uiManager.showErrorDialog(
                'Ein kritischer Fehler ist aufgetreten. Bitte lade das Spiel neu.'
            );
        }
    }

    /**
     * Gibt den aktuellen Performance-Status zurück
     * @returns {Object} Performance-Status
     */
    getPerformanceStatus() {
        return {
            fps: this.currentFps,
            frameTime: performance.now() - this.lastFrameTime,
            isRunning: this.isRunning,
            accumulator: this.accumulator
        };
    }
}
