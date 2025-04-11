/**
 * Jest Custom Resolver
 * Konfiguriert die Modul-Auflösung für Tests
 */

const path = require('path');
const fs = require('fs');

// Unterstützte Dateierweiterungen
const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.vue'];

// Mapping für Aliase
const ALIAS_MAP = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@managers': path.resolve(__dirname, 'src/managers'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@assets': path.resolve(__dirname, 'src/assets'),
  '@tests': path.resolve(__dirname, 'tests')
};

// Mock-Verzeichnis
const MOCKS_DIR = path.resolve(__dirname, '__mocks__');

/**
 * Prüft, ob eine Datei existiert
 * @param {string} filePath - Pfad zur Datei
 * @returns {boolean}
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Sucht nach einer Datei mit unterstützten Erweiterungen
 * @param {string} basePath - Basis-Pfad
 * @returns {string|null}
 */
function findFile(basePath) {
  for (const ext of SUPPORTED_EXTENSIONS) {
    const filePath = basePath + ext;
    if (fileExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Löst Mock-Module auf
 * @param {string} sourcePath - Quellpfad
 * @returns {string|null}
 */
function resolveMock(sourcePath) {
  const mockPath = path.join(MOCKS_DIR, sourcePath);
  return findFile(mockPath);
}

/**
 * Löst Alias-Pfade auf
 * @param {string} sourcePath - Quellpfad
 * @returns {string|null}
 */
function resolveAlias(sourcePath) {
  for (const [alias, aliasPath] of Object.entries(ALIAS_MAP)) {
    if (sourcePath.startsWith(alias)) {
      const resolvedPath = path.join(aliasPath, sourcePath.slice(alias.length));
      return findFile(resolvedPath);
    }
  }
  return null;
}

/**
 * Hauptresolver-Funktion
 * @param {string} sourcePath - Quellpfad
 * @param {Object} options - Jest Resolver Optionen
 * @returns {string}
 */
module.exports = function resolver(sourcePath, options) {
  // Prüfe auf Mock-Module
  const mockPath = resolveMock(sourcePath);
  if (mockPath) {
    return mockPath;
  }

  // Prüfe auf Aliase
  const aliasPath = resolveAlias(sourcePath);
  if (aliasPath) {
    return aliasPath;
  }

  // Spezielle Behandlung für Assets
  if (sourcePath.match(/\.(css|less|scss|sass|svg|png|jpg|jpeg|gif|webp)$/)) {
    return path.resolve(__dirname, '__mocks__/fileMock.js');
  }

  // Node-Module-Auflösung
  try {
    return options.defaultResolver(sourcePath, {
      ...options,
      packageFilter: pkg => {
        // Verwende "module" statt "main" für ESM
        if (pkg.module) {
          return { ...pkg, main: pkg.module };
        }
        return pkg;
      }
    });
  } catch (error) {
    // Fallback für nicht gefundene Module
    console.warn(`Warning: Could not resolve "${sourcePath}"`);
    return sourcePath;
  }
};

/**
 * Cache-Konfiguration
 */
module.exports.getCacheKey = () => {
  // Generiere Cache-Key basierend auf Konfiguration
  const configHash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(ALIAS_MAP))
    .digest('hex');
  
  return `jest-resolver-${configHash}`;
};

/**
 * Resolver-Optionen
 */
module.exports.options = {
  // Unterstützte Erweiterungen
  extensions: SUPPORTED_EXTENSIONS,
  
  // Modul-Verzeichnisse
  moduleDirectories: ['node_modules', 'src'],
  
  // Alias-Mapping
  moduleNameMapper: Object.entries(ALIAS_MAP).reduce((acc, [alias, path]) => {
    acc[`^${alias}(.*)$`] = `${path}$1`;
    return acc;
  }, {}),
  
  // Asset-Mapping
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'vue'],
  
  // Ignoriere bestimmte Pfade
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/'
  ]
};
