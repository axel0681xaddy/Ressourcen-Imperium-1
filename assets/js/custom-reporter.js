/**
 * Jest Custom Reporter
 * Erstellt benutzerdefinierte Testberichte
 */

class CustomReporter {
  constructor(globalConfig, options = {}) {
    this._globalConfig = globalConfig;
    this._options = options;
    
    // Initialisiere Statistiken
    this.stats = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: null,
      endTime: null,
      duration: 0,
      slowTests: [],
      failedTests: [],
      coverage: {},
      suites: new Map()
    };

    // Output-Konfiguration
    this.outputFile = options.outputFile || 'test-report.json';
    this.consoleOutput = options.consoleOutput !== false;
    this.slowTestThreshold = options.slowTestThreshold || 1000; // 1 Sekunde
  }

  /**
   * Wird beim Start der Tests aufgerufen
   */
  onRunStart(results, options) {
    this.stats.startTime = new Date();
    
    if (this.consoleOutput) {
      console.log('\n🚀 Starting test suite...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }

  /**
   * Wird beim Start einer Test-Suite aufgerufen
   */
  onTestFileStart(test) {
    const suiteName = this._getRelativePath(test.path);
    this.stats.suites.set(suiteName, {
      name: suiteName,
      startTime: Date.now(),
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0
    });
  }

  /**
   * Wird nach jedem einzelnen Test aufgerufen
   */
  onTestResult(test, testResult) {
    const suiteName = this._getRelativePath(test.path);
    const suiteStats = this.stats.suites.get(suiteName);

    testResult.testResults.forEach(result => {
      // Test-Statistiken aktualisieren
      this.stats.total++;
      
      const duration = result.duration || 0;
      const testCase = {
        title: result.title,
        status: result.status,
        duration: duration,
        failureMessages: result.failureMessages || []
      };

      // Status-spezifische Verarbeitung
      switch (result.status) {
        case 'passed':
          this.stats.passed++;
          suiteStats.passed++;
          if (duration > this.slowTestThreshold) {
            this.stats.slowTests.push({
              title: result.title,
              duration: duration,
              suite: suiteName
            });
          }
          break;

        case 'failed':
          this.stats.failed++;
          suiteStats.failed++;
          this.stats.failedTests.push({
            title: result.title,
            failureMessages: result.failureMessages,
            suite: suiteName
          });
          break;

        case 'skipped':
          this.stats.skipped++;
          suiteStats.skipped++;
          break;
      }

      suiteStats.tests.push(testCase);
    });

    // Console Output für fehlgeschlagene Tests
    if (this.consoleOutput && testResult.failureMessage) {
      console.error('\n❌ Test failures in', suiteName);
      console.error(testResult.failureMessage);
    }
  }

  /**
   * Wird beim Ende der Tests aufgerufen
   */
  onRunComplete(contexts, results) {
    this.stats.endTime = new Date();
    this.stats.duration = this.stats.endTime - this.stats.startTime;

    // Coverage-Informationen sammeln
    if (results.coverageMap) {
      this.stats.coverage = results.coverageMap.getCoverageSummary().toJSON();
    }

    // Bericht generieren und speichern
    this._generateReport();

    // Console Output
    if (this.consoleOutput) {
      this._printSummary();
    }
  }

  /**
   * Generiert den Testbericht
   */
  _generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: {
        total: this.stats.total,
        passed: this.stats.passed,
        failed: this.stats.failed,
        skipped: this.stats.skipped,
        duration: this.stats.duration,
        coverage: this.stats.coverage
      },
      slowTests: this.stats.slowTests,
      failedTests: this.stats.failedTests,
      suites: Array.from(this.stats.suites.values())
    };

    // Speichere Bericht
    const fs = require('fs');
    fs.writeFileSync(this.outputFile, JSON.stringify(report, null, 2));
  }

  /**
   * Gibt eine Zusammenfassung in der Konsole aus
   */
  _printSummary() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Tests: ${this.stats.total}`);
    console.log(`✅ Passed:   ${this.stats.passed}`);
    console.log(`❌ Failed:   ${this.stats.failed}`);
    console.log(`⏭️  Skipped:  ${this.stats.skipped}`);
    console.log(`⏱️  Duration: ${this.stats.duration}ms`);

    if (this.stats.slowTests.length > 0) {
      console.log('\n⚠️  Slow Tests:');
      this.stats.slowTests.forEach(test => {
        console.log(`  - ${test.suite} > ${test.title} (${test.duration}ms)`);
      });
    }

    if (this.stats.coverage.lines) {
      console.log('\n📊 Coverage:');
      console.log(`  Lines:      ${this.stats.coverage.lines.pct}%`);
      console.log(`  Functions:  ${this.stats.coverage.functions.pct}%`);
      console.log(`  Statements: ${this.stats.coverage.statements.pct}%`);
      console.log(`  Branches:   ${this.stats.coverage.branches.pct}%`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Konvertiert absoluten Pfad in relativen Pfad
   */
  _getRelativePath(absolutePath) {
    const path = require('path');
    return path.relative(process.cwd(), absolutePath);
  }
}

module.exports = CustomReporter;
