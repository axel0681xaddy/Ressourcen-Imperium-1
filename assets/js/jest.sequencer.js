/**
 * Jest Custom Sequencer
 * Definiert die Reihenfolge der Testausführung
 */

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Sortiert die Testpfade für optimale Ausführung
   * @param {Array} tests - Array von Testobjekten
   * @returns {Array} Sortierte Tests
   */
  sort(tests) {
    // Gruppiere Tests nach Typ
    const testGroups = {
      unit: [],
      integration: [],
      e2e: [],
      other: []
    };

    // Sortiere Tests in Gruppen
    tests.forEach(test => {
      const path = test.path;
      
      if (path.includes('/__tests__/unit/')) {
        testGroups.unit.push(test);
      } else if (path.includes('/__tests__/integration/')) {
        testGroups.integration.push(test);
      } else if (path.includes('/__tests__/e2e/')) {
        testGroups.e2e.push(test);
      } else {
        testGroups.other.push(test);
      }
    });

    // Sortiere innerhalb jeder Gruppe nach Priorität und Abhängigkeiten
    const sortGroup = (group) => {
      return group.sort((testA, testB) => {
        // Priorisiere Setup-Tests
        if (testA.path.includes('.setup.')) return -1;
        if (testB.path.includes('.setup.')) return 1;

        // Priorisiere Core-Komponenten
        if (testA.path.includes('/core/')) return -1;
        if (testB.path.includes('/core/')) return 1;

        // Sortiere nach Dateinamen
        return testA.path.localeCompare(testB.path);
      });
    };

    // Sortiere alle Gruppen
    Object.keys(testGroups).forEach(key => {
      testGroups[key] = sortGroup(testGroups[key]);
    });

    // Kombiniere die Gruppen in der gewünschten Reihenfolge
    return [
      ...testGroups.unit,           // Unit-Tests zuerst
      ...testGroups.integration,    // dann Integration-Tests
      ...testGroups.e2e,           // dann E2E-Tests
      ...testGroups.other          // andere Tests zum Schluss
    ];
  }

  /**
   * Cache-Key für die Sortierung
   * @param {string} testPath - Pfad zur Testdatei
   * @returns {string} Cache-Key
   */
  cacheKey(testPath) {
    const { createHash } = require('crypto');
    
    return createHash('md5')
      .update(testPath)
      .update(super.cacheKey(testPath))
      .digest('hex');
  }

  /**
   * Prüft, ob Tests parallel ausgeführt werden können
   * @param {Array} tests - Array von Testobjekten
   * @returns {Object} Parallelisierungskonfiguration
   */
  shard(tests, { shardCount, shardIndex }) {
    const sortedTests = this.sort(tests);
    
    // Verteile Tests auf Shards
    return sortedTests.filter((test, index) => {
      return index % shardCount === shardIndex;
    });
  }

  /**
   * Schätzt die Testlaufzeit
   * @param {Object} test - Testobjekt
   * @returns {number} Geschätzte Laufzeit in ms
   */
  estimateTestDuration(test) {
    // Lade gespeicherte Testlaufzeiten
    const testTimings = this.loadTestTimings();
    
    // Verwende gespeicherte Zeit oder Standardwert
    return testTimings[test.path] || 1000;
  }

  /**
   * Lädt gespeicherte Testlaufzeiten
   * @returns {Object} Testlaufzeiten
   */
  loadTestTimings() {
    try {
      return require('./.jest-timing.json');
    } catch {
      return {};
    }
  }

  /**
   * Speichert Testlaufzeiten
   * @param {Object} timings - Testlaufzeiten
   */
  saveTestTimings(timings) {
    const fs = require('fs');
    fs.writeFileSync('.jest-timing.json', JSON.stringify(timings, null, 2));
  }
}

module.exports = CustomSequencer;
