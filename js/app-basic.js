// Verbesserte App-Implementierung mit Fokus auf GPS-Funktionalität
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const latElement = document.getElementById('lat');
    const lonElement = document.getElementById('lon');
    const headingElement = document.getElementById('heading');
    const updateButton = document.getElementById('update-btn');
    const mapContainer = document.getElementById('map-container');

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
            if (!window.DeviceOrientationEvent) {
                updateStatus('Warnung: DeviceOrientation wird von diesem Browser nicht unterstützt');
            }

            // Event-Listener für Update-Button
            updateButton.addEventListener('click', updatePosition);

            // DeviceOrientation-Event-Listener hinzufügen
            window.addEventListener('deviceorientation', handleOrientation);

            // Letzte bekannte Position anzeigen, falls vorhanden
            const lastPosition = gpsManager.getLastPosition();
            if (lastPosition) {
                updatePositionDisplay(lastPosition);
                updateAccuracy(lastPosition.accuracy);
                const lastUpdateTime = gpsManager.getLastUpdateTime();
                const timeAgo = lastUpdateTime ? getTimeAgo(lastUpdateTime) : 'unbekannt';
                updateStatus(`Letzte bekannte Position geladen (vor ${timeAgo})`);
            } else {
                updateStatus('Bereit. Drücken Sie "Position aktualisieren", um Ihre Position zu ermitteln.');
            }

            // Callback für Positionsänderungen registrieren
            gpsManager.addPositionCallback(updatePositionDisplay);

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
            
            const isGoodAccuracy = gpsManager.hasGoodAccuracy();
            if (isGoodAccuracy) {
                updateStatus('Position erfolgreich aktualisiert');
            } else {
                updateStatus(`Position aktualisiert, aber Genauigkeit (${position.accuracy.toFixed(1)}m) ist über dem Zielwert von 50m`);
            }
            
            // Hier würde später die Kartenaktualisierung erfolgen
            displayDummyMap(position.latitude, position.longitude, position.accuracy);
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

    // Orientierung verarbeiten
    function handleOrientation(event) {
        if (event.alpha !== null) {
            const heading = event.alpha;
            headingElement.textContent = heading.toFixed(1);
            
            // Hier würde später die Kompassaktualisierung erfolgen
        }
    }

    // Dummy-Karte anzeigen (für Tests)
    function displayDummyMap(latitude, longitude, accuracy) {
        // Bestehenden Inhalt löschen
        mapContainer.innerHTML = '';
        
        // Dummy-Karte erstellen
        const dummyMap = document.createElement('div');
        dummyMap.style.width = '100%';
        dummyMap.style.height = '100%';
        dummyMap.style.backgroundColor = '#e0e0e0';
        dummyMap.style.display = 'flex';
        dummyMap.style.justifyContent = 'center';
        dummyMap.style.alignItems = 'center';
        dummyMap.style.flexDirection = 'column';
        dummyMap.style.color = '#333';
        dummyMap.style.fontFamily = 'Arial, sans-serif';
        
        const mapTitle = document.createElement('h2');
        mapTitle.textContent = 'Standort-Informationen';
        
        const mapInfo = document.createElement('p');
        mapInfo.textContent = `Koordinaten: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        const accuracyInfo = document.createElement('p');
        accuracyInfo.textContent = `Genauigkeit: ${accuracy.toFixed(1)} Meter`;
        
        const mapNote = document.createElement('p');
        mapNote.textContent = 'In der vollständigen App würde hier die 3D-Ansicht erscheinen';
        
        dummyMap.appendChild(mapTitle);
        dummyMap.appendChild(mapInfo);
        dummyMap.appendChild(accuracyInfo);
        dummyMap.appendChild(mapNote);
        
        mapContainer.appendChild(dummyMap);
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
});
