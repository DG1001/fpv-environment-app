// Hauptanwendungslogik mit verbesserter GPS-Funktionalität
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const latElement = document.getElementById('lat');
    const lonElement = document.getElementById('lon');
    const headingElement = document.getElementById('heading');
    const updateButton = document.getElementById('update-btn');

    // Anwendungszustand
    let appState = {
        initialized: false,
        positionAvailable: false,
        orientationAvailable: false
    };

    // Status-Anzeige hinzufügen
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.style.position = 'absolute';
    statusDiv.style.top = '10px';
    statusDiv.style.left = '10px';
    statusDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    statusDiv.style.padding = '10px';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '1000';
    document.body.appendChild(statusDiv);

    // Genauigkeits-Anzeige hinzufügen
    const accuracyDiv = document.createElement('div');
    accuracyDiv.id = 'accuracy';
    accuracyDiv.style.position = 'absolute';
    accuracyDiv.style.top = '10px';
    accuracyDiv.style.right = '10px';
    accuracyDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    accuracyDiv.style.padding = '10px';
    accuracyDiv.style.borderRadius = '5px';
    accuracyDiv.style.zIndex = '1000';
    document.body.appendChild(accuracyDiv);

    // Status aktualisieren
    function updateStatus(message) {
        statusDiv.textContent = message;
    }

    // Genauigkeit aktualisieren
    function updateAccuracy(accuracy) {
        if (accuracy !== null && accuracy !== undefined) {
            const isGoodAccuracy = accuracy < 50;
            accuracyDiv.textContent = `Genauigkeit: ${accuracy.toFixed(1)}m`;
            accuracyDiv.style.backgroundColor = isGoodAccuracy ? 'rgba(144, 238, 144, 0.8)' : 'rgba(255, 165, 0, 0.8)';
        } else {
            accuracyDiv.textContent = 'Genauigkeit: Unbekannt';
            accuracyDiv.style.backgroundColor = 'rgba(255, 165, 0, 0.8)';
        }
    }

    // Initialisierung der App
    async function initializeApp() {
        try {
            updateStatus('App wird initialisiert...');

            // Prüfen, ob Geolocation unterstützt wird
            if (!gpsManager.checkSupport()) {
                updateStatus('Fehler: Geolocation wird von diesem Browser nicht unterstützt');
                return;
            }

            // Prüfen, ob DeviceOrientation unterstützt wird
            if (!compassManager.isSupported()) {
                updateStatus('Warnung: DeviceOrientation wird von diesem Browser nicht unterstützt');
            } else {
                // Kompass-Berechtigung prüfen (für iOS)
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    const permissionGranted = await compassManager.requestPermission();
                    appState.orientationAvailable = permissionGranted;
                } else {
                    appState.orientationAvailable = true;
                }

                if (appState.orientationAvailable) {
                    compassManager.startListening();
                    compassManager.addOrientationCallback(updateOrientationDisplay);
                }
            }

            // Event-Listener für Update-Button
            updateButton.addEventListener('click', updatePosition);

            // Letzte bekannte Position anzeigen, falls vorhanden
            const lastPosition = gpsManager.getLastPosition();
            if (lastPosition) {
                updatePositionDisplay(lastPosition);
                updateAccuracy(lastPosition.accuracy);
                const lastUpdateTime = gpsManager.getLastUpdateTime();
                const timeAgo = lastUpdateTime ? getTimeAgo(lastUpdateTime) : 'unbekannt';
                updateStatus(`Letzte bekannte Position geladen (vor ${timeAgo})`);
                appState.positionAvailable = true;
            } else {
                updateStatus('Bereit. Drücken Sie "Position aktualisieren", um Ihre Position zu ermitteln.');
            }

            // Callback für Positionsänderungen registrieren
            gpsManager.addPositionCallback(updatePositionDisplay);

            appState.initialized = true;
            console.log('App erfolgreich initialisiert');
        } catch (error) {
            updateStatus(`Fehler bei der Initialisierung: ${error.message}`);
            console.error('Fehler bei der App-Initialisierung:', error);
        }
    }

    // Position aktualisieren
    async function updatePosition() {
        // Prüfen, ob bereits eine Aktualisierung läuft
        if (gpsManager.isUpdatingPosition()) {
            updateStatus('Position wird bereits aktualisiert...');
            return;
        }

        updateStatus('Position wird mit hoher Genauigkeit abgerufen...');
        updateButton.disabled = true;
        
        try {
            const position = await gpsManager.getCurrentPosition();
            updatePositionDisplay(position);
            updateAccuracy(position.accuracy);
            appState.positionAvailable = true;
            
            const isGoodAccuracy = gpsManager.hasGoodAccuracy();
            if (isGoodAccuracy) {
                updateStatus('Position erfolgreich aktualisiert');
            } else {
                updateStatus(`Position aktualisiert, aber Genauigkeit (${position.accuracy.toFixed(1)}m) ist über dem Zielwert von 50m`);
            }
            
            // Karte aktualisieren, falls initialisiert
            if (mapManager && appState.positionAvailable) {
                if (!mapManager.initialized) {
                    mapManager.initialize(position);
                } else {
                    mapManager.updatePosition(position);
                }
            }

            // Gebäudedaten abrufen und in 3D-Ansicht darstellen
            if (mapManager && renderManager && appState.positionAvailable) {
                const buildingsData = await mapManager.getAreaData(position);
                if (buildingsData) {
                    // Hier müssten die Gebäudedaten für Three.js aufbereitet werden
                    const processedData = processBuildings(buildingsData, position);
                    renderManager.addBuildings(processedData);
                }
            }
        } catch (error) {
            updateStatus(`Fehler: ${error.message}`);
            console.error('Fehler beim Abrufen der Position:', error);
        } finally {
            updateButton.disabled = false;
        }
    }

    // Positionsanzeige aktualisieren
    function updatePositionDisplay(position) {
        if (position && latElement && lonElement) {
            latElement.textContent = position.latitude.toFixed(6);
            lonElement.textContent = position.longitude.toFixed(6);
        }
    }

    // Orientierungsanzeige aktualisieren
    function updateOrientationDisplay(orientation) {
        if (orientation && headingElement) {
            const heading = orientation.alpha;
            headingElement.textContent = heading.toFixed(1);

            // Karte und 3D-Ansicht rotieren
            if (mapManager && mapManager.initialized) {
                mapManager.updateRotation(heading);
            }

            if (renderManager && renderManager.initialized) {
                renderManager.updateCameraRotation(heading);
            }
        }
    }

    // Gebäudedaten für Three.js aufbereiten
    function processBuildings(buildingsData, userPosition) {
        // Dies ist eine Platzhalter-Implementierung
        // In einer vollständigen Implementierung würden hier die OSM-Daten
        // in ein Format konvertiert, das Three.js versteht
        
        const processedBuildings = [];
        
        // Beispiel für ein einfaches Gebäude
        processedBuildings.push({
            x: 0, // Relative Position zum Benutzer
            y: 10, // Höhe
            z: -20, // Relative Position zum Benutzer
            width: 10,
            height: 10,
            depth: 10
        });
        
        return processedBuildings;
    }

    // Hilfsfunktion: Zeit seit letzter Aktualisierung formatieren
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval > 1) return interval + ' Jahren';
        if (interval === 1) return interval + ' Jahr';
        
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) return interval + ' Monaten';
        if (interval === 1) return interval + ' Monat';
        
        interval = Math.floor(seconds / 86400);
        if (interval > 1) return interval + ' Tagen';
        if (interval === 1) return interval + ' Tag';
        
        interval = Math.floor(seconds / 3600);
        if (interval > 1) return interval + ' Stunden';
        if (interval === 1) return interval + ' Stunde';
        
        interval = Math.floor(seconds / 60);
        if (interval > 1) return interval + ' Minuten';
        if (interval === 1) return interval + ' Minute';
        
        if (seconds < 10) return 'wenigen Sekunden';
        return Math.floor(seconds) + ' Sekunden';
    }

    // App initialisieren
    initializeApp();

    // Für Debugging
    window.appDebug = {
        gpsManager,
        compassManager,
        mapManager,
        renderManager,
        appState
    };
});
