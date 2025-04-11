module.exports = {
  // Presets
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          browsers: [
            'last 2 versions',
            '> 1%',
            'not dead',
            'not ie 11'
          ]
        },
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true },
        modules: false,
        debug: process.env.NODE_ENV === 'development',
        loose: true
      }
    ]
  ],

  // Plugins
  plugins: [
    // Klassentransformationen
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    
    // Dekoratoren
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    
    // Async/Await Optimierung
    '@babel/plugin-transform-runtime',
    
    // Optional Chaining und Nullish Coalescing
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    
    // Dynamic Import
    '@babel/plugin-syntax-dynamic-import',
    
    // Export Extensions
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    
    // Logical Assignment
    '@babel/plugin-proposal-logical-assignment-operators',
    
    // Pipeline Operator
    ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
    
    // Throw Expressions
    '@babel/plugin-proposal-throw-expressions',
    
    // Development Plugins
    process.env.NODE_ENV === 'development' && 'babel-plugin-styled-components'
  ].filter(Boolean),

  // Umgebungsspezifische Konfiguration
  env: {
    // Produktionsumgebung
    production: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: [
              'last 2 versions',
              '> 1%',
              'not dead',
              'not ie 11'
            ]
          },
          useBuiltIns: 'usage',
          corejs: 3,
          modules: false,
          debug: false
        }]
      ],
      plugins: [
        'babel-plugin-transform-remove-console',
        'babel-plugin-transform-remove-debugger',
        ['babel-plugin-transform-react-remove-prop-types', {
          removeImport: true
        }]
      ]
    },
    
    // Testumgebung
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          }
        }]
      ],
      plugins: [
        'babel-plugin-dynamic-import-node'
      ]
    },
    
    // Entwicklungsumgebung
    development: {
      plugins: [
        'babel-plugin-styled-components',
        'babel-plugin-transform-react-jsx-source'
      ]
    }
  },

  // Cache-Konfiguration
  cacheDirectory: true,
  cacheCompression: false,

  // Konfiguration für verschiedene Module
  overrides: [
    {
      test: ['./node_modules/lodash-es'],
      presets: [
        ['@babel/preset-env', {
          modules: false,
          targets: {
            esmodules: true
          }
        }]
      ]
    }
  ],

  // Ignoriere bestimmte Dateien
  ignore: [
    '**/*.spec.js',
    '**/*.test.js',
    '**/node_modules/**',
    '**/dist/**'
  ],

  // Source Maps
  sourceMaps: process.env.NODE_ENV === 'development' ? 'inline' : false,

  // Kompakte Ausgabe
  compact: process.env.NODE_ENV === 'production',

  // Kommentare entfernen
  comments: process.env.NODE_ENV === 'development',

  // Minifizierung
  minified: process.env.NODE_ENV === 'production',

  // Konfiguration für verschiedene Dateitypen
  assumptions: {
    setPublicClassFields: true,
    privateFieldsAsProperties: true,
    constantSuper: true,
    noClassCalls: true,
    noDocumentAll: true,
    noNewArrows: true
  }
};
