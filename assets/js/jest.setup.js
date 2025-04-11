// Jest Setup-Datei für globale Test-Konfiguration

// Importiere notwendige Test-Utilities
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import 'jest-localstorage-mock';

// Mock für window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock für window.IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock für window.requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Mock für window.performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(),
    getEntriesByType: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
});

// Mock für console-Methoden
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock für fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
);

// Benutzerdefinierte Jest-Matcher
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Globale Test-Timeouts
jest.setTimeout(10000); // 10 Sekunden

// Cleanup nach jedem Test
afterEach(() => {
  // LocalStorage leeren
  localStorage.clear();
  sessionStorage.clear();
  
  // DOM-Elemente aufräumen
  document.body.innerHTML = '';
  
  // Alle Mocks zurücksetzen
  jest.clearAllMocks();
  
  // Event-Listener entfernen
  window.matchMedia.mockClear();
  
  // Fetch-Mocks zurücksetzen
  fetch.mockClear();
});

// Globale Test-Utilities
global.sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Mock für WebSocket
class WebSocketMock {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen && this.onopen();
    }, 0);
  }

  send = jest.fn();
  close = jest.fn();

  // WebSocket Konstanten
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
}

global.WebSocket = WebSocketMock;

// Mock für Audio
class AudioMock {
  constructor() {
    this.paused = true;
    this.currentTime = 0;
    this.volume = 1;
  }

  play = jest.fn(() => Promise.resolve());
  pause = jest.fn();
  load = jest.fn();
}

global.Audio = AudioMock;

// Mock für Spielspezifische Funktionen
global.gameConfig = {
  TICK_RATE: 60,
  BASE_PRODUCTION_RATE: 1.0,
  RESOURCE_TYPES: {
    HOLZ: { name: 'Holz', baseProduction: 1.0 },
    STEIN: { name: 'Stein', baseProduction: 0.8 },
  },
};

// Hilfsfunktionen für Tests
global.createTestResource = (type, amount) => ({
  type,
  amount,
  production: gameConfig.RESOURCE_TYPES[type].baseProduction,
});

// Error-Handling für nicht abgefangene Promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail tests on unhandled rejections
  throw reason;
});

// Zufallszahlen-Generator mit festem Seed für reproduzierbare Tests
global.Math.random = () => 0.5;

// ResizeObserver Mock
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Mutation Observer Mock
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
};
