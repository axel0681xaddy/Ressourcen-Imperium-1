// compression.js - Funktionen für Datenkomprimierung

/**
 * Komprimiert ein JavaScript-Objekt für die Speicherung
 * Nutzt eine Kombination aus Datenoptimierung und String-Komprimierung
 */
export function compressGameData(gameData) {
    try {
        // Kopie des Spielstand erstellen, um Original nicht zu verändern
        const dataCopy = JSON.parse(JSON.stringify(gameData));
        
        // Spielstand optimieren (unnötige Daten entfernen und kompakter machen)
        const optimizedData = optimizeGameData(dataCopy);
        
        // In JSON umwandeln
        const jsonString = JSON.stringify(optimizedData);
        
        // Basis-Komprimierung mit LZUTF8 (falls verfügbar) oder eigener Implementierung
        const compressedData = compressString(jsonString);
        
        return compressedData;
    } catch (error) {
        console.error('Fehler bei der Komprimierung:', error);
        // Bei Fehler Originalformat zurückgeben
        return JSON.stringify(gameData);
    }
}

/**
 * Dekomprimiert Spielstanddaten
 */
export function decompressGameData(compressedData) {
    try {
        // Prüfen, ob die Daten komprimiert sind
        if (isCompressedData(compressedData)) {
            // Dekomprimieren
            const jsonString = decompressString(compressedData);
            
            // JSON parsen
            const gameData = JSON.parse(jsonString);
            
            // Datenstruktur wiederherstellen
            return restoreGameData(gameData);
        } else {
            // Vermutlich unkomprimierte Daten, direkt parsen
            return JSON.parse(compressedData);
        }
    } catch (error) {
        console.error('Fehler bei der Dekomprimierung:', error);
        throw new Error('Konnte die Spieldaten nicht dekomprimieren');
    }
}

/**
 * Optimiert die Spielstanddaten für Komprimierung
 * - Entfernt unnötige temporäre Daten
 * - Kürzt Eigenschaftsnamen
 * - Komprimiert Zahlen und Arrays
 */
function optimizeGameData(data) {
    // Tiefe Kopie erstellen
    const optimized = { ...data };
    
    // Temporäre Daten entfernen, die nicht gespeichert werden müssen
    delete optimized.tempData;
    
    // Verwende eine Eigenschaftskarte für kürzere Schlüssel
    const propertyMap = {
        resources: 'r',
        production: 'p',
        clickValue: 'cv',
        totalClicks: 'tc',
        startTime: 'st',
        lastSaveTime: 'ls',
        generators: 'g',
        converters: 'c',
        upgrades: 'u',
        achievements: 'a',
        prestigePoints: 'pp',
        prestigeMultiplier: 'pm',
        prestigeResets: 'pr',
        unlockedResources: 'ur',
        converterAccumulator: 'ca',
        amount: 'am',
        baseOutput: 'bo',
        baseSpeed: 'bs',
        cost: 'co',
        baseCost: 'bc',
        unlocked: 'ul',
        purchased: 'pu',
        achieved: 'ac',
        resource: 're',
        gameId: 'gi'
    };
    
    // Funktion zum Komprimieren von Objekten
    function compressObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        // Arrays behalten ihre ursprüngliche Form
        if (Array.isArray(obj)) {
            return obj.map(item => compressObject(item));
        }
        
        // Neue komprimierte Objekteigenschaften erstellen
        const compressed = {};
        
        Object.entries(obj).forEach(([key, value]) => {
            // Schlüssel komprimieren
            const compressedKey = propertyMap[key] || key;
            
            // Wert rekursiv komprimieren, wenn es ein Objekt ist
            if (value !== null && typeof value === 'object') {
                compressed[compressedKey] = compressObject(value);
            } else {
                // Primitive Werte direkt zuweisen
                compressed[compressedKey] = value;
            }
        });
        
        return compressed;
    }
    
    return compressObject(optimized);
}

/**
 * Stellt die Datenstruktur nach der Dekomprimierung wieder her
 */
function restoreGameData(compressedData) {
    // Umgekehrte Eigenschaftskarte
    const reversePropertyMap = {
        r: 'resources',
        p: 'production',
        cv: 'clickValue',
        tc: 'totalClicks',
        st: 'startTime',
        ls: 'lastSaveTime',
        g: 'generators',
        c: 'converters',
        u: 'upgrades',
        a: 'achievements',
        pp: 'prestigePoints',
        pm: 'prestigeMultiplier',
        pr: 'prestigeResets',
        ur: 'unlockedResources',
        ca: 'converterAccumulator',
        am: 'amount',
        bo: 'baseOutput',
        bs: 'baseSpeed',
        co: 'cost',
        bc: 'baseCost',
        ul: 'unlocked',
        pu: 'purchased',
        ac: 'achieved',
        re: 'resource',
        gi: 'gameId'
    };
    
    // Funktion zum Dekomprimieren von Objekten
    function decompressObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        // Arrays rekursiv dekomprimieren
        if (Array.isArray(obj)) {
            return obj.map(item => decompressObject(item));
        }
        
        // Neue dekomprimierte Objekteigenschaften erstellen
        const decompressed = {};
        
        Object.entries(obj).forEach(([key, value]) => {
            // Schlüssel dekomprimieren
            const decompressedKey = reversePropertyMap[key] || key;
            
            // Wert rekursiv dekomprimieren, wenn es ein Objekt ist
            if (value !== null && typeof value === 'object') {
                decompressed[decompressedKey] = decompressObject(value);
            } else {
                // Primitive Werte direkt zuweisen
                decompressed[decompressedKey] = value;
            }
        });
        
        return decompressed;
    }
    
    return decompressObject(compressedData);
}

/**
 * Komprimiert einen String 
 * Verwendet LZUTF8 falls verfügbar, sonst eine einfachere Methode
 */
function compressString(str) {
    // Prüfen, ob LZUTF8 verfügbar ist (separat eingebunden)
    if (typeof LZUTF8 !== 'undefined') {
        try {
            return LZUTF8.compress(str, { outputEncoding: "Base64" });
        } catch (e) {
            console.warn('LZUTF8-Komprimierung fehlgeschlagen, verwende Fallback:', e);
        }
    }
    
    // Einfache Komprimierung als Fallback
    // Verwende nur Base64-Kodierung für kleinere Speichergrößen
    return {
        fmt: 'b64',
        data: btoa(str)
    };
}

/**
 * Dekomprimiert einen komprimierten String
 */
function decompressString(compressed) {
    // LZUTF8-komprimierte Daten (String-Format)
    if (typeof compressed === 'string') {
        if (typeof LZUTF8 !== 'undefined') {
            try {
                return LZUTF8.decompress(compressed, { inputEncoding: "Base64" });
            } catch (e) {
                console.warn('LZUTF8-Dekomprimierung fehlgeschlagen:', e);
                // Versuche als normales Base64 zu dekodieren
                return atob(compressed);
            }
        } else {
            // Versuche als normales Base64 zu dekodieren
            return atob(compressed);
        }
    }
    
    // Einfache Objekt-Komprimierung
    if (compressed && compressed.fmt === 'b64') {
        return atob(compressed.data);
    }
    
    // Wenn nicht komprimiert, als String zurückgeben
    return typeof compressed === 'object' ? JSON.stringify(compressed) : compressed;
}

/**
 * Prüft, ob die Daten komprimiert sind
 */
function isCompressedData(data) {
    // Als String komprimierte Daten (LZUTF8)
    if (typeof data === 'string') {
        // Prüfen, ob Base64
        return /^[A-Za-z0-9+/=]+$/.test(data);
    }
    
    // Objekt-Format mit Komprimierungsmarkierung
    return typeof data === 'object' && data && data.fmt === 'b64';
}

/**
 * Gibt die geschätzte Speichergröße einer Variable zurück (in Bytes)
 */
export function estimateSize(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return str.length * 2; // Ungefähre Größe in Bytes (UTF-16)
}

/**
 * Überprüft, ob genügend localStorage-Speicherplatz verfügbar ist
 */
export function checkStorageSpace(dataToStore, buffer = 0.1) {
    try {
        // Geschätzte Größe der zu speichernden Daten
        const dataSize = estimateSize(dataToStore);
        
        // Verfügbarer Speicherplatz berechnen
        const totalSpace = 5 * 1024 * 1024; // Annahme: 5MB (üblicher Wert für die meisten Browser)
        let usedSpace = 0;
        
        // Berechnung des bereits verwendeten Speicherplatzes
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            usedSpace += estimateSize(key) + estimateSize(value);
        }
        
        // Verfügbarer Speicherplatz
        const availableSpace = totalSpace - usedSpace;
        
        // Prüfen, ob genügend Speicherplatz mit Puffer verfügbar ist
        const requiredSpace = dataSize * (1 + buffer); // Zusätzlicher Puffer
        
        return {
            hasEnoughSpace: availableSpace > requiredSpace,
            availableSpace,
            requiredSpace: dataSize,
            totalSpace,
            usedSpace
        };
    } catch (error) {
        console.error('Fehler bei der Speicherplatzprüfung:', error);
        return { hasEnoughSpace: false, error };
    }
}