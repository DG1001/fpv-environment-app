// Verbesserte GPS-Funktionalität mit Fokus auf hoher Genauigkeit
class GPSManager {
    constructor() {
        this.position = null;
        this.callbacks = [];
        this.lastUpdateTime = null;
        this.isSupported = navigator.geolocation !== undefined;
        this.isUpdating = false;
        
        // Lokaler Speicher für die letzte bekannte Position
        this.loadLastPosition();
    }

    // Prüfen, ob Geolocation unterstützt wird
    checkSupport() {
        return this.isSupported;
    }

    // Einmalige Positionsabfrage mit hoher Genauigkeit
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
                return;
            }

            // Status aktualisieren
            this.isUpdating = true;
            
            // Optionen für hohe Genauigkeit
            const options = {
                enableHighAccuracy: true,  // Hohe Genauigkeit anfordern
                timeout: 15000,            // 15 Sekunden Timeout
                maximumAge: 0              // Keine zwischengespeicherten Positionen verwenden
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Prüfen, ob die Genauigkeit ausreichend ist (< 50m)
                    if (position.coords.accuracy > 50) {
                        console.warn(`GPS-Genauigkeit (${position.coords.accuracy.toFixed(1)}m) ist über dem Zielwert von 50m`);
                    }
                    
                    this.position = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };
                    
                    // Letzte Aktualisierungszeit speichern
                    this.lastUpdateTime = new Date();
                    
                    // Position im lokalen Speicher speichern
                    this.savePosition();
                    
                    // Status aktualisieren
                    this.isUpdating = false;
                    
                    // Callbacks aufrufen
                    this.notifyCallbacks();
                    
                    resolve(this.position);
                },
                (error) => {
                    // Status aktualisieren
                    this.isUpdating = false;
                    
                    console.error('Fehler beim Abrufen der GPS-Position:', error);
                    
                    // Fehlermeldung basierend auf Fehlercode
                    let errorMessage;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Zugriff auf Geolocation wurde verweigert';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Positionsdaten sind nicht verfügbar';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Zeitüberschreitung bei der Positionsabfrage';
                            break;
                        case error.UNKNOWN_ERROR:
                        default:
                            errorMessage = 'Unbekannter Fehler bei der Positionsabfrage';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }

    // Position im lokalen Speicher speichern
    savePosition() {
        if (this.position && window.localStorage) {
            try {
                localStorage.setItem('lastPosition', JSON.stringify(this.position));
                localStorage.setItem('lastUpdateTime', this.lastUpdateTime.toISOString());
            } catch (error) {
                console.error('Fehler beim Speichern der Position im lokalen Speicher:', error);
            }
        }
    }

    // Letzte Position aus dem lokalen Speicher laden
    loadLastPosition() {
        if (window.localStorage) {
            try {
                const positionStr = localStorage.getItem('lastPosition');
                const updateTimeStr = localStorage.getItem('lastUpdateTime');
                
                if (positionStr && updateTimeStr) {
                    this.position = JSON.parse(positionStr);
                    this.lastUpdateTime = new Date(updateTimeStr);
                    console.log('Letzte bekannte Position aus lokalem Speicher geladen');
                }
            } catch (error) {
                console.error('Fehler beim Laden der Position aus dem lokalen Speicher:', error);
            }
        }
    }

    // Callback für Positionsänderungen registrieren
    addPositionCallback(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
    }

    // Callback entfernen
    removePositionCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    // Callbacks benachrichtigen
    notifyCallbacks() {
        for (const callback of this.callbacks) {
            callback(this.position);
        }
    }

    // Aktuelle Position abrufen
    getLastPosition() {
        return this.position;
    }

    // Zeitpunkt der letzten Aktualisierung abrufen
    getLastUpdateTime() {
        return this.lastUpdateTime;
    }

    // Prüfen, ob gerade eine Aktualisierung läuft
    isUpdatingPosition() {
        return this.isUpdating;
    }

    // Genauigkeit der letzten Position abrufen
    getAccuracy() {
        return this.position ? this.position.accuracy : null;
    }

    // Prüfen, ob die Genauigkeit ausreichend ist (< 50m)
    hasGoodAccuracy() {
        return this.position && this.position.accuracy && this.position.accuracy < 50;
    }
}

// Globale Instanz erstellen
const gpsManager = new GPSManager();
