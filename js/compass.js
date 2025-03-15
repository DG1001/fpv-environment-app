// Verbesserte Kompass-Funktionalität für First-Person-View
class CompassManager {
    constructor() {
        this.orientation = null;
        this.isListening = false;
        this.callbacks = [];
        this.permissionGranted = false;
        this.calibrationOffset = 0; // Kalibrierungsoffset
        this.smoothingFactor = 0.2; // Glättungsfaktor (0-1)
        this.lastHeading = null; // Letzte Kompassrichtung für Glättung
        this.useAbsoluteOrientation = false; // Absolute Orientierung verwenden, falls verfügbar
    }

    // Überprüfen, ob DeviceOrientation unterstützt wird
    isSupported() {
        return window.DeviceOrientationEvent !== undefined;
    }

    // Berechtigungen anfordern (für iOS 13+)
    async requestPermission() {
        if (!this.isSupported()) {
            console.error('DeviceOrientation wird von diesem Gerät nicht unterstützt');
            return false;
        }

        // Prüfen, ob requestPermission verfügbar ist (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                // Auf iOS muss die Berechtigung durch eine Benutzeraktion ausgelöst werden
                // Wir erstellen einen temporären Button, der die Berechtigung anfordert
                return new Promise((resolve) => {
                    const permissionBtn = document.createElement('button');
                    permissionBtn.innerHTML = 'Kompass-Zugriff erlauben';
                    permissionBtn.style.position = 'fixed';
                    permissionBtn.style.top = '50%';
                    permissionBtn.style.left = '50%';
                    permissionBtn.style.transform = 'translate(-50%, -50%)';
                    permissionBtn.style.padding = '15px 20px';
                    permissionBtn.style.backgroundColor = '#4285f4';
                    permissionBtn.style.color = 'white';
                    permissionBtn.style.border = 'none';
                    permissionBtn.style.borderRadius = '5px';
                    permissionBtn.style.fontSize = '16px';
                    permissionBtn.style.zIndex = '10000';
                    
                    permissionBtn.onclick = async () => {
                        try {
                            const permission = await DeviceOrientationEvent.requestPermission();
                            this.permissionGranted = (permission === 'granted');
                            console.log(`iOS Kompass-Berechtigung: ${permission}`);
                            document.body.removeChild(permissionBtn);
                            resolve(this.permissionGranted);
                        } catch (error) {
                            console.error('Fehler beim Anfordern der DeviceOrientation-Berechtigung:', error);
                            document.body.removeChild(permissionBtn);
                            resolve(false);
                        }
                    };
                    
                    document.body.appendChild(permissionBtn);
                    
                });
            } catch (error) {
                console.error('Fehler beim Erstellen des Berechtigungs-Dialogs:', error);
                return false;
            }
        } else {
            // Auf anderen Geräten ist keine explizite Berechtigung erforderlich
            this.permissionGranted = true;
            return true;
        }
    }

    // Kompass-Überwachung starten
    startListening() {
        if (!this.isSupported()) {
            console.error('DeviceOrientation wird von diesem Gerät nicht unterstützt');
            return false;
        }

        if (this.isListening) {
            return true;
        }

        // Prüfen, ob absolute Orientierung verfügbar ist
        if (window.DeviceOrientationAbsoluteEvent) {
            window.addEventListener('deviceorientationabsolute', this.handleAbsoluteOrientation.bind(this));
            this.useAbsoluteOrientation = true;
            console.log('Absolute Orientierung wird verwendet');
        } else {
            // Fallback auf normale Orientierung
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
            console.log('Relative Orientierung wird verwendet');
        }

        this.isListening = true;
        return true;
    }

    // Kompass-Überwachung stoppen
    stopListening() {
        if (!this.isListening) {
            return false;
        }

        if (this.useAbsoluteOrientation) {
            window.removeEventListener('deviceorientationabsolute', this.handleAbsoluteOrientation.bind(this));
        } else {
            window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
        }

        this.isListening = false;
        return true;
    }

    // Absolute Orientierungsdaten verarbeiten
    handleAbsoluteOrientation(event) {
        // Absolute Orientierung direkt verarbeiten
        this.processOrientationData(event);
    }

    // Orientierungsdaten verarbeiten
    handleOrientation(event) {
        // Prüfen, ob absolute Orientierung verfügbar ist
        if (event.absolute) {
            this.useAbsoluteOrientation = true;
        }

        this.processOrientationData(event);
    }

    // Orientierungsdaten verarbeiten (gemeinsame Funktion)
    processOrientationData(event) {
        // Alpha: Kompassrichtung (0-360)
        // Beta: Neigung vorne/hinten (-180 bis 180)
        // Gamma: Neigung links/rechts (-90 bis 90)
        
        // Prüfen, ob Werte vorhanden sind
        if (event.alpha === null || event.beta === null || event.gamma === null) {
            console.warn('Unvollständige Orientierungsdaten empfangen');
            return;
        }

        // Kompassrichtung mit Kalibrierungsoffset anpassen
        let heading = 360 - (event.alpha + this.calibrationOffset);
        
        // Sicherstellen, dass der Wert im Bereich 0-360 liegt
        heading = (heading + 360) % 360;

        // Glättung anwenden, falls ein vorheriger Wert existiert
        if (this.lastHeading !== null) {
            // Spezielle Behandlung für den Übergang zwischen 0° und 360°
            if (Math.abs(heading - this.lastHeading) > 180) {
                // Wenn der Unterschied größer als 180° ist, müssen wir in die andere Richtung glätten
                if (heading > this.lastHeading) {
                    this.lastHeading += 360;
                } else {
                    heading += 360;
                }
            }
            
            // Glättung anwenden
            heading = this.lastHeading + this.smoothingFactor * (heading - this.lastHeading);
            
            // Zurück in den Bereich 0-360 bringen
            heading = (heading + 360) % 360;
        }
        
        // Aktuellen Wert für die nächste Glättung speichern
        this.lastHeading = heading;

        // Orientierungsdaten speichern
        this.orientation = {
            alpha: heading, // Geglättete und kalibrierte Kompassrichtung
            beta: event.beta,   // Neigung vorne/hinten
            gamma: event.gamma, // Neigung links/rechts
            absolute: event.absolute || this.useAbsoluteOrientation, // Ob die Werte absolut sind
            timestamp: Date.now()
        };

        // Callbacks aufrufen
        this.notifyCallbacks();
    }

    // Kompass kalibrieren
    calibrate(trueNorth) {
        if (!this.orientation) {
            console.error('Keine Orientierungsdaten für Kalibrierung verfügbar');
            return false;
        }

        // Kalibrierungsoffset berechnen
        // trueNorth ist die tatsächliche Nordrichtung (0-360)
        this.calibrationOffset = trueNorth - this.orientation.alpha;
        
        console.log(`Kompass kalibriert mit Offset: ${this.calibrationOffset.toFixed(2)}°`);
        return true;
    }

    // Glättungsfaktor setzen
    setSmoothingFactor(factor) {
        if (factor >= 0 && factor <= 1) {
            this.smoothingFactor = factor;
            return true;
        }
        return false;
    }

    // Callback für Orientierungsänderungen registrieren
    addOrientationCallback(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
    }

    // Callback entfernen
    removeOrientationCallback(callback) {
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
            callback(this.orientation);
        }
    }

    // Aktuelle Orientierung abrufen
    getLastOrientation() {
        return this.orientation;
    }

    // Kompassrichtung abrufen (0-360 Grad)
    getHeading() {
        if (this.orientation && this.orientation.alpha !== null) {
            return this.orientation.alpha;
        }
        return null;
    }

    // Neigung vorne/hinten abrufen (-180 bis 180 Grad)
    getBeta() {
        if (this.orientation && this.orientation.beta !== null) {
            return this.orientation.beta;
        }
        return null;
    }

    // Neigung links/rechts abrufen (-90 bis 90 Grad)
    getGamma() {
        if (this.orientation && this.orientation.gamma !== null) {
            return this.orientation.gamma;
        }
        return null;
    }

    // Prüfen, ob absolute Orientierung verwendet wird
    isUsingAbsoluteOrientation() {
        return this.useAbsoluteOrientation;
    }

    // Prüfen, ob Orientierungsdaten verfügbar sind
    hasOrientation() {
        return this.orientation !== null;
    }
}

// Globale Instanz erstellen
const compassManager = new CompassManager();
