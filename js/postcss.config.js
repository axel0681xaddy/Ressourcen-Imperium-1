module.exports = {
  // Plugins in Ausführungsreihenfolge
  plugins: [
    // Import von CSS-Dateien
    'postcss-import',

    // CSS-Variablen und Custom Properties
    'postcss-custom-properties',

    // Verschachtelte CSS-Regeln
    'postcss-nested',

    // Modern CSS Features
    [
      'postcss-preset-env',
      {
        stage: 1,
        features: {
          'custom-properties': false,
          'custom-media-queries': true,
          'custom-selectors': true,
          'nesting-rules': true,
          'color-mod-function': true,
          'focus-visible-pseudo-class': true,
          'focus-within-pseudo-class': true,
          'gap-properties': true,
          'logical-properties-and-values': true,
          'media-query-ranges': true
        },
        autoprefixer: {
          grid: true,
          flexbox: true
        }
      }
    ],

    // Grid-System
    'postcss-grid-system',

    // Flexbox-Bugs fixen
    'postcss-flexbugs-fixes',

    // Assets-URLs anpassen
    [
      'postcss-url',
      {
        url: 'rebase'
      }
    ],

    // CSS-Sortierung
    'css-declaration-sorter',

    // Responsive Font-Größen
    [
      'postcss-responsive-font',
      {
        minSize: 14,
        maxSize: 21,
        minWidth: 320,
        maxWidth: 1920,
        unit: 'px'
      }
    ],

    // Automatische RTL-Unterstützung
    [
      'postcss-rtl',
      {
        autoRename: true,
        clean: true
      }
    ],

    // Optimierungen für Produktion
    process.env.NODE_ENV === 'production' && [
      'cssnano',
      {
        preset: [
          'advanced',
          {
            discardComments: {
              removeAll: true
            },
            reduceIdents: false,
            zindex: false
          }
        ]
      }
    ],

    // Autoprefixer für Browser-Kompatibilität
    [
      'autoprefixer',
      {
        grid: true,
        flexbox: true,
        browsers: [
          '> 1%',
          'last 2 versions',
          'not ie <= 11',
          'not dead'
        ]
      }
    ]
  ].filter(Boolean),

  // Sourcemaps nur in Entwicklung
  map: process.env.NODE_ENV !== 'production',

  // Parser-Optionen
  parser: 'postcss-scss',

  // Syntax-Optionen
  syntax: 'postcss-scss',

  // Custom Properties
  customProperties: {
    preserve: false
  },

  // Import-Optionen
  import: {
    path: ['src/styles']
  },

  // URL-Optionen
  url: {
    url: 'rebase'
  },

  // Grid-System-Optionen
  gridSystem: {
    columns: 12,
    maxWidth: '1200px',
    gutter: '20px'
  },

  // RTL-Optionen
  rtl: {
    autoRename: true,
    clean: true
  },

  // Responsive Font-Optionen
  responsiveFont: {
    minSize: 14,
    maxSize: 21,
    minWidth: 320,
    maxWidth: 1920,
    unit: 'px'
  },

  // Autoprefixer-Optionen
  autoprefixer: {
    grid: true,
    flexbox: true
  },

  // CSS Nano Optionen für Produktion
  cssnano: process.env.NODE_ENV === 'production' ? {
    preset: [
      'advanced',
      {
        discardComments: {
          removeAll: true
        },
        reduceIdents: false,
        zindex: false
      }
    ]
  } : false
};
