/**
 * @fileoverview Mathematische Hilfsfunktionen für das Ressourcen-Imperium
 * @author Ressourcen-Imperium Team
 */

/**
 * Berechnet Zinseszins
 * @param {number} principal - Anfangswert
 * @param {number} rate - Zinsrate (als Dezimalzahl)
 * @param {number} time - Zeitraum
 * @returns {number} Endergebnis
 */
export function calculateCompoundInterest(principal, rate, time) {
    return principal * Math.pow(1 + rate, time);
}

/**
 * Berechnet exponentielles Wachstum mit Obergrenze
 * @param {number} value - Aktueller Wert
 * @param {number} rate - Wachstumsrate
 * @param {number} cap - Obergrenze
 * @returns {number} Neuer Wert
 */
export function calculateLimitedGrowth(value, rate, cap) {
    return cap * (1 - Math.exp(-rate * value / cap));
}

/**
 * Berechnet den Mittelwert
 * @param {number[]} numbers - Array von Zahlen
 * @returns {number} Mittelwert
 */
export function calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * Berechnet die Standardabweichung
 * @param {number[]} numbers - Array von Zahlen
 * @returns {number} Standardabweichung
 */
export function calculateStandardDeviation(numbers) {
    if (numbers.length === 0) return 0;
    const avg = calculateAverage(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(calculateAverage(squareDiffs));
}

/**
 * Interpoliert linear zwischen zwei Werten
 * @param {number} start - Startwert
 * @param {number} end - Endwert
 * @param {number} t - Interpolationsfaktor (0-1)
 * @returns {number} Interpolierter Wert
 */
export function lerp(start, end, t) {
    return start + (end - start) * Math.max(0, Math.min(1, t));
}

/**
 * Berechnet gleichmäßig verteilte Zufallszahl
 * @param {number} min - Minimaler Wert
 * @param {number} max - Maximaler Wert
 * @returns {number} Zufallszahl
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Berechnet ganzzahlige Zufallszahl
 * @param {number} min - Minimaler Wert
 * @param {number} max - Maximaler Wert
 * @returns {number} Ganzzahlige Zufallszahl
 */
export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

/**
 * Berechnet Wahrscheinlichkeit für ein Ereignis
 * @param {number} probability - Wahrscheinlichkeit (0-1)
 * @returns {boolean} Ob das Ereignis eintritt
 */
export function chance(probability) {
    return Math.random() < probability;
}

/**
 * Rundet auf eine bestimmte Anzahl Dezimalstellen
 * @param {number} value - Zu rundender Wert
 * @param {number} decimals - Anzahl Dezimalstellen
 * @returns {number} Gerundeter Wert
 */
export function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Berechnet exponentiellen Bewegungsdurchschnitt
 * @param {number} current - Aktueller Wert
 * @param {number} previous - Vorheriger Durchschnitt
 * @param {number} alpha - Glättungsfaktor (0-1)
 * @returns {number} Neuer Durchschnitt
 */
export function exponentialMovingAverage(current, previous, alpha) {
    return alpha * current + (1 - alpha) * previous;
}

/**
 * Berechnet Ressourcen-Produktionsrate mit Multiplikatoren
 * @param {number} baseRate - Grundrate
 * @param {number} multiplier - Multiplikator
 * @param {number} efficiency - Effizienz (0-1)
 * @returns {number} Endgültige Produktionsrate
 */
export function calculateProductionRate(baseRate, multiplier, efficiency) {
    return baseRate * multiplier * efficiency;
}

/**
 * Berechnet Upgrade-Kosten mit exponentieller Steigerung
 * @param {number} baseCost - Grundkosten
 * @param {number} level - Aktuelles Level
 * @param {number} scalingFactor - Skalierungsfaktor
 * @returns {number} Neue Kosten
 */
export function calculateUpgradeCost(baseCost, level, scalingFactor) {
    return Math.floor(baseCost * Math.pow(scalingFactor, level));
}

/**
 * Berechnet Prestige-Bonus basierend auf Ressourcen
 * @param {number} resources - Gesammelte Ressourcen
 * @param {number} baseMultiplier - Basis-Multiplikator
 * @returns {number} Prestige-Bonus
 */
export function calculatePrestigeBonus(resources, baseMultiplier) {
    return Math.log10(Math.max(1, resources)) * baseMultiplier;
}

/**
 * Berechnet Offline-Fortschritt mit reduzierter Effizienz
 * @param {number} timePassed - Vergangene Zeit in Sekunden
 * @param {number} productionRate - Produktionsrate pro Sekunde
 * @param {number} offlineEfficiency - Offline-Effizienz (0-1)
 * @returns {number} Offline-Fortschritt
 */
export function calculateOfflineProgress(timePassed, productionRate, offlineEfficiency) {
    return timePassed * productionRate * offlineEfficiency;
}

/**
 * Berechnet gleichverteilte Zufallswerte mit Gewichtung
 * @param {Object[]} options - Array von Optionen mit Gewichtungen
 * @returns {*} Zufällig ausgewählte Option
 */
export function weightedRandom(options) {
    const totalWeight = options.reduce((sum, option) => sum + (option.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
        random -= (option.weight || 1);
        if (random <= 0) return option.value;
    }
    
    return options[options.length - 1].value;
}

/**
 * Berechnet Fibonacci-Sequenz bis zu einem bestimmten Index
 * @param {number} n - Index in der Sequenz
 * @returns {number} Fibonacci-Zahl an Position n
 */
export function fibonacci(n) {
    if (n <= 1) return n;
    let prev = 0, current = 1;
    
    for (let i = 2; i <= n; i++) {
        const next = prev + current;
        prev = current;
        current = next;
    }
    
    return current;
}
