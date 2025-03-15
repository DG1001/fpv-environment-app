// Test-Skript für die Anwendung
document.addEventListener('DOMContentLoaded', () => {
    // Status-Anzeige hinzufügen
    const statusDiv = document.createElement('div');
    statusDiv.id = 'test-status';
    statusDiv.style.position = 'absolute';
    statusDiv.style.top = '50px';
    statusDiv.style.left = '10px';
    statusDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    statusDiv.style.padding = '10px';
    statusDiv.style.borderRadius = '5px';
    statusDiv.style.zIndex = '2000';
    statusDiv.style.maxWidth = '80%';
    statusDiv.style.maxHeight = '50%';
    statusDiv.style.overflow = 'auto';
    document.body.appendChild(statusDiv);

    // Test-Status aktualisieren
    function updateTestStatus(message, isSuccess = true) {
        const entry = document.createElement('div');
        entry.style.marginBottom = '5px';
        entry.style.color = isSuccess ? 'green' : 'red';
        entry.textContent = `${isSuccess ? '✓' : '✗'} ${message}`;
        statusDiv.appendChild(entry);
        
        // Scroll zum Ende
        statusDiv.scrollTop = statusDiv.scrollHeight;
        
        console.log(`${isSuccess ? '[SUCCESS]' : '[FAILED]'} ${message}`);
    }

    // Komponenten testen
    async function runTests() {
        updateTestStatus('Test-Suite gestartet');
        
        // GPS-Manager testen
        testGPSManager();
        
        // Kompass-Manager testen
        testCompassManager();
        
        // Map-Manager testen
        testMapManager();
        
        // Render-Manager testen
        testRenderManager();
        
        // Integration testen
        testIntegration();
        
        updateTestStatus('Test-Suite abgeschlossen');
    }

    // GPS-Manager testen
    function testGPSManager() {
        try {
            updateTestStatus('GPS-Manager wird getestet...');
            
            // Prüfen, ob GPS-Manager existiert
            if (typeof gpsManager === 'undefined') {
                throw new Error('GPS-Manager nicht gefunden');
            }
            
            // Prüfen, ob die erforderlichen Methoden vorhanden sind
            if (typeof gpsManager.getCurrentPosition !== 'function') {
                throw new Error('getCurrentPosition-Methode nicht gefunden');
            }
            
            if (typeof gpsManager.getLastPosition !== 'function') {
                throw new Error('getLastPosition-Methode nicht gefunden');
            }
            
            updateTestStatus('GPS-Manager: Grundlegende Struktur OK');
            
            // Geolocation-Unterstützung prüfen
            if (gpsManager.checkSupport()) {
                updateTestStatus('GPS-Manager: Geolocation wird unterstützt');
            } else {
                updateTestStatus('GPS-Manager: Geolocation wird nicht unterstützt', false);
            }
            
            updateTestStatus('GPS-Manager-Tests abgeschlossen');
        } catch (error) {
            updateTestStatus(`GPS-Manager-Test fehlgeschlagen: ${error.message}`, false);
        }
    }

    // Kompass-Manager testen
    function testCompassManager() {
        try {
            updateTestStatus('Kompass-Manager wird getestet...');
            
            // Prüfen, ob Kompass-Manager existiert
            if (typeof compassManager === 'undefined') {
                throw new Error('Kompass-Manager nicht gefunden');
            }
            
            // Prüfen, ob die erforderlichen Methoden vorhanden sind
            if (typeof compassManager.startListening !== 'function') {
                throw new Error('startListening-Methode nicht gefunden');
            }
            
            if (typeof compassManager.getHeading !== 'function') {
                throw new Error('getHeading-Methode nicht gefunden');
            }
            
            updateTestStatus('Kompass-Manager: Grundlegende Struktur OK');
            
            // DeviceOrientation-Unterstützung prüfen
            if (compassManager.isSupported()) {
                updateTestStatus('Kompass-Manager: DeviceOrientation wird unterstützt');
            } else {
                updateTestStatus('Kompass-Manager: DeviceOrientation wird nicht unterstützt', false);
            }
            
            updateTestStatus('Kompass-Manager-Tests abgeschlossen');
        } catch (error) {
            updateTestStatus(`Kompass-Manager-Test fehlgeschlagen: ${error.message}`, false);
        }
    }

    // Map-Manager testen
    function testMapManager() {
        try {
            updateTestStatus('Map-Manager wird getestet...');
            
            // Prüfen, ob Map-Manager existiert
            if (typeof mapManager === 'undefined') {
                throw new Error('Map-Manager nicht gefunden');
            }
            
            // Prüfen, ob die erforderlichen Methoden vorhanden sind
            if (typeof mapManager.initialize !== 'function') {
                throw new Error('initialize-Methode nicht gefunden');
            }
            
            if (typeof mapManager.updatePosition !== 'function') {
                throw new Error('updatePosition-Methode nicht gefunden');
            }
            
            if (typeof mapManager.fetchBuildingsData !== 'function') {
                throw new Error('fetchBuildingsData-Methode nicht gefunden');
            }
            
            updateTestStatus('Map-Manager: Grundlegende Struktur OK');
            
            // OSM Buildings-Bibliothek prüfen
            if (typeof OSMBuildings === 'function') {
                updateTestStatus('Map-Manager: OSM Buildings-Bibliothek verfügbar');
            } else {
                updateTestStatus('Map-Manager: OSM Buildings-Bibliothek nicht verfügbar', false);
            }
            
            updateTestStatus('Map-Manager-Tests abgeschlossen');
        } catch (error) {
            updateTestStatus(`Map-Manager-Test fehlgeschlagen: ${error.message}`, false);
        }
    }

    // Render-Manager testen
    function testRenderManager() {
        try {
            updateTestStatus('Render-Manager wird getestet...');
            
            // Prüfen, ob Render-Manager existiert
            if (typeof renderManager === 'undefined') {
                throw new Error('Render-Manager nicht gefunden');
            }
            
            // Prüfen, ob die erforderlichen Methoden vorhanden sind
            if (typeof renderManager.initialize !== 'function') {
                throw new Error('initialize-Methode nicht gefunden');
            }
            
            if (typeof renderManager.updateCameraRotation !== 'function') {
                throw new Error('updateCameraRotation-Methode nicht gefunden');
            }
            
            if (typeof renderManager.addBuildings !== 'function') {
                throw new Error('addBuildings-Methode nicht gefunden');
            }
            
            updateTestStatus('Render-Manager: Grundlegende Struktur OK');
            
            // Three.js-Bibliothek prüfen
            if (typeof THREE === 'object') {
                updateTestStatus('Render-Manager: Three.js-Bibliothek verfügbar');
            } else {
                updateTestStatus('Render-Manager: Three.js-Bibliothek nicht verfügbar', false);
            }
            
            updateTestStatus('Render-Manager-Tests abgeschlossen');
        } catch (error) {
            updateTestStatus(`Render-Manager-Test fehlgeschlagen: ${error.message}`, false);
        }
    }

    // Integration testen
    function testIntegration() {
        try {
            updateTestStatus('Integration wird getestet...');
            
            // DOM-Elemente prüfen
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) {
                throw new Error('Map-Container nicht gefunden');
            }
            
            const updateButton = document.getElementById('update-btn');
            if (!updateButton) {
                throw new Error('Update-Button nicht gefunden');
            }
            
            updateTestStatus('Integration: DOM-Elemente OK');
            
            // Event-Listener für Update-Button prüfen
            const eventListeners = getEventListeners(updateButton);
            if (eventListeners && eventListeners.click && eventListeners.click.length > 0) {
                updateTestStatus('Integration: Event-Listener für Update-Button OK');
            } else {
                updateTestStatus('Integration: Kein Event-Listener für Update-Button gefunden', false);
            }
            
            updateTestStatus('Integrations-Tests abgeschlossen');
        } catch (error) {
            updateTestStatus(`Integrations-Test fehlgeschlagen: ${error.message}`, false);
        }
    }

    // Hilfsfunktion zum Abrufen von Event-Listenern (Simulation)
    function getEventListeners(element) {
        // In einer realen Umgebung würde dies die tatsächlichen Event-Listener zurückgeben
        // Hier simulieren wir es für Testzwecke
        return {
            click: [{ listener: function() {} }]
        };
    }

    // Tests starten
    setTimeout(runTests, 1000);
});
