// Jest Setup After Environment - Wird nach der Test-Umgebung geladen

import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/dom';
import { toHaveNoViolations } from 'jest-axe';

// Erweitere Jest-Matcher für Accessibility-Tests
expect.extend(toHaveNoViolations);

// Konfiguriere Testing Library
configure({
  // Warte maximal 1000ms auf asynchrone Ereignisse
  asyncUtilTimeout: 1000,
  // Deaktiviere automatische Fehlerlogausgabe
  suppressErrorLogs: true,
  // Benutze computedStyle für getComputedStyle
  computedStyleSupportsPseudoElements: true
});

// Globale Test-Timeouts für verschiedene Operationen
const DEFAULT_TIMEOUT = 5000;
jest.setTimeout(DEFAULT_TIMEOUT);

// Benutzerdefinierte Error-Klassen für Tests
class GameTestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameTestError';
  }
}

// Globale Test-Hilfsfunktionen
global.createTestGameState = () => ({
  resources: {
    wood: { amount: 0, production: 1 },
    stone: { amount: 0, production: 1 }
  },
  upgrades: {},
  achievements: {},
  lastUpdate: Date.now()
});

// Mock für Spielzeit
global.advanceGameTime = async (milliseconds) => {
  const now = Date.now();
  jest.setSystemTime(now + milliseconds);
  await new Promise(resolve => setTimeout(resolve, 0));
};

// Erweiterte Console-Mocks mit Test-Kontext
const originalConsole = { ...console };
beforeEach(() => {
  global.console = {
    ...console,
    error: jest.fn((...args) => {
      throw new GameTestError(`Console.error called with: ${args.join(', ')}`);
    }),
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
});

afterEach(() => {
  global.console = originalConsole;
});

// Automatische Speicherbereinigung
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

// Event-Listener-Tracking
const addedEventListeners = new Set();

// Erweitere Element-Prototype für Event-Listener-Tracking
const originalAddEventListener = Element.prototype.addEventListener;
const originalRemoveEventListener = Element.prototype.removeEventListener;

Element.prototype.addEventListener = function(type, listener, options) {
  addedEventListeners.add({ element: this, type, listener, options });
  originalAddEventListener.call(this, type, listener, options);
};

Element.prototype.removeEventListener = function(type, listener, options) {
  addedEventListeners.delete({ element: this, type, listener, options });
  originalRemoveEventListener.call(this, type, listener, options);
};

// Prüfe auf nicht entfernte Event-Listener
afterEach(() => {
  if (addedEventListeners.size > 0) {
    console.warn(`Warning: ${addedEventListeners.size} event listeners were not removed`);
    addedEventListeners.clear();
  }
});

// Benutzerdefinierte Test-Matcher
expect.extend({
  toBeResourceAmount(received, expected) {
    const pass = received >= 0 && received === expected;
    return {
      message: () => `expected ${received} to be resource amount ${expected}`,
      pass
    };
  },
  toHaveUpgrade(received, upgradeName) {
    const pass = received.upgrades && received.upgrades[upgradeName];
    return {
      message: () => `expected game state to have upgrade ${upgradeName}`,
      pass
    };
  }
});

// Performance-Monitoring für Tests
const testPerformance = new Map();

beforeEach(() => {
  const testStart = performance.now();
  testPerformance.set('testStart', testStart);
});

afterEach(() => {
  const testEnd = performance.now();
  const testStart = testPerformance.get('testStart');
  const duration = testEnd - testStart;
  
  if (duration > 100) {
    console.warn(`Test took ${duration}ms to complete`);
  }
  
  testPerformance.clear();
});

// Automatische Fehlerbehandlung für async/await
process.on('unhandledRejection', (error) => {
  fail(`Unhandled promise rejection: ${error.message}`);
});

// Spielspezifische Test-Utilities
global.simulateGameTick = async (gameState, deltaTime) => {
  // Simuliere einen Spieltick
  const updatedState = { ...gameState };
  
  // Aktualisiere Ressourcen
  Object.keys(updatedState.resources).forEach(resource => {
    const { amount, production } = updatedState.resources[resource];
    updatedState.resources[resource].amount = amount + (production * deltaTime);
  });
  
  updatedState.lastUpdate += deltaTime;
  
  return updatedState;
};

// Accessibility-Test-Helfer
global.checkAccessibility = async (container) => {
  const { axe } = require('jest-axe');
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Debug-Helfer
global.debugTest = (value, label = 'Debug') => {
  if (process.env.DEBUG) {
    console.log(`${label}:`, value);
  }
};
