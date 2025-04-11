/** @type {import('jest').Config} */
const config = {
  // Grundlegende Konfiguration
  verbose: true,
  testEnvironment: 'jsdom',
  rootDir: '.',
  
  // Test-Dateien
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}'
  ],
  
  // Ausgeschlossene Verzeichnisse
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.git/',
    '/coverage/'
  ],

  // Setup-Dateien
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setupAfterEnv.js'],

  // Module-Mapping
  moduleNameMapper: {
    // Pfad-Aliase
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@managers/(.*)$': '<rootDir>/src/managers/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    
    // Asset-Mocks
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Transformationen
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.test.js' }],
    '^.+\\.m?js$': 'babel-jest'
  },

  // Transformations-Ignorierung
  transformIgnorePatterns: [
    '/node_modules/(?!lodash-es)',
    '\\.pnp\\.[^\\/]+$'
  ],

  // Coverage-Konfiguration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.js',
    '!src/serviceWorker.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/managers/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Snapshot-Konfiguration
  snapshotSerializers: [
    'jest-serializer-html'
  ],

  // Timer-Konfiguration
  timers: 'modern',

  // Globale Variablen
  globals: {
    __DEV__: true
  },

  // Test-Umgebungsvariablen
  testEnvironmentOptions: {
    url: 'https://lamp.deinfo-projects.de/Game2'
  },

  // Weitere Optionen
  bail: 5,
  verbose: true,
  detectOpenHandles: true,
  errorOnDeprecated: true,
  maxConcurrency: 5,
  maxWorkers: '50%',
  notify: true,
  notifyMode: 'failure-change',
  
  // Watch-Plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    ['jest-watch-suspend', { 'key-for-suspend': 's' }]
  ],

  // Reporter
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports/junit',
        outputName: 'js-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    [
      './custom-reporter.js',
      {
        outputFile: 'reports/custom/test-report.json'
      }
    ]
  ],

  // Projekt-Info
  displayName: {
    name: 'Ressourcen-Imperium',
    color: 'blue'
  },

  // Cache-Konfiguration
  cacheDirectory: '.jest-cache',
  
  // Timeout-Einstellungen
  testTimeout: 10000,
  
  // Retry-Einstellungen
  retry: 2,

  // Parallele Ausführung
  maxWorkers: '50%',

  // Modul-Verzeichnisse
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // Modul-Dateierweiterungen
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Präprozessor-Ignorierung
  preprocessorIgnorePatterns: [
    '/node_modules/'
  ],

  // Resolver-Konfiguration
  resolver: '<rootDir>/jest.resolver.js',

  // Test-Sequencer
  testSequencer: '<rootDir>/jest.sequencer.js',

  // Injects
  injectGlobals: true,

  // Weitere Optionen für spezifische Anforderungen
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/**/*.test.js'],
      setupFiles: ['<rootDir>/jest.setup.unit.js']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/**/*.integration.test.js'],
      setupFiles: ['<rootDir>/jest.setup.integration.js']
    }
  ]
};

module.exports = config;
