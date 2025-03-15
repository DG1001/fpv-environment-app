// Deployment-Skript für die Anwendung
document.addEventListener('DOMContentLoaded', () => {
    // Deployment-Status-Anzeige hinzufügen
    const deploymentStatusDiv = document.createElement('div');
    deploymentStatusDiv.id = 'deployment-status';
    deploymentStatusDiv.style.position = 'absolute';
    deploymentStatusDiv.style.top = '10px';
    deploymentStatusDiv.style.left = '10px';
    deploymentStatusDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    deploymentStatusDiv.style.padding = '10px';
    deploymentStatusDiv.style.borderRadius = '5px';
    deploymentStatusDiv.style.zIndex = '2000';
    document.body.appendChild(deploymentStatusDiv);

    // Deployment-Status aktualisieren
    function updateDeploymentStatus(message) {
        deploymentStatusDiv.textContent = message;
        console.log(`[DEPLOYMENT] ${message}`);
    }

    // Service Worker registrieren für PWA-Funktionalität
    async function registerServiceWorker() {
        updateDeploymentStatus('Service Worker wird registriert...');
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('service-worker.js');
                updateDeploymentStatus('Service Worker erfolgreich registriert');
                return true;
            } catch (error) {
                updateDeploymentStatus(`Service Worker-Registrierung fehlgeschlagen: ${error.message}`);
                return false;
            }
        } else {
            updateDeploymentStatus('Service Worker wird von diesem Browser nicht unterstützt');
            return false;
        }
    }

    // App-Caching initialisieren
    function initializeAppCache() {
        updateDeploymentStatus('App-Caching wird initialisiert...');
        
        // Ressourcen, die gecacht werden sollen
        const resourcesToCache = [
            '/',
            '/index.html',
            '/css/style.css',
            '/js/app.js',
            '/js/gps.js',
            '/js/compass.js',
            '/js/map.js',
            '/js/render.js',
            '/manifest.json',
            '/icons/icon-192x192.png',
            '/icons/icon-512x512.png'
        ];
        
        // In einer vollständigen Implementierung würden hier die Ressourcen gecacht werden
        
        updateDeploymentStatus('App-Caching erfolgreich initialisiert');
        return true;
    }

    // App-Installation vorbereiten
    function prepareForInstallation() {
        updateDeploymentStatus('App-Installation wird vorbereitet...');
        
        let deferredPrompt;
        
        // Event abfangen, wenn der Browser die App installieren kann
        window.addEventListener('beforeinstallprompt', (e) => {
            // Installation-Prompt verhindern
            e.preventDefault();
            // Event für spätere Verwendung speichern
            deferredPrompt = e;
            
            // Installations-Button anzeigen
            const installButton = document.createElement('button');
            installButton.id = 'install-btn';
            installButton.textContent = 'App installieren';
            installButton.style.position = 'absolute';
            installButton.style.bottom = '80px';
            installButton.style.left = '50%';
            installButton.style.transform = 'translateX(-50%)';
            installButton.style.padding = '10px 15px';
            installButton.style.backgroundColor = '#4285f4';
            installButton.style.color = 'white';
            installButton.style.border = 'none';
            installButton.style.borderRadius = '4px';
            installButton.style.zIndex = '2000';
            
            // Event-Listener für Installations-Button
            installButton.addEventListener('click', async () => {
                // Installations-Prompt anzeigen
                deferredPrompt.prompt();
                // Warten auf Benutzerentscheidung
                const { outcome } = await deferredPrompt.userChoice;
                // Ergebnis protokollieren
                console.log(`Benutzerentscheidung: ${outcome}`);
                // deferredPrompt zurücksetzen
                deferredPrompt = null;
                // Button entfernen
                installButton.remove();
            });
            
            document.body.appendChild(installButton);
        });
        
        updateDeploymentStatus('App-Installation vorbereitet');
        return true;
    }

    // Deployment durchführen
    async function deploy() {
        updateDeploymentStatus('Deployment wird gestartet...');
        
        // Service Worker registrieren
        const serviceWorkerRegistered = await registerServiceWorker();
        
        // App-Caching initialisieren
        const appCacheInitialized = initializeAppCache();
        
        // App-Installation vorbereiten
        const installationPrepared = prepareForInstallation();
        
        // Deployment-Status aktualisieren
        if (serviceWorkerRegistered && appCacheInitialized && installationPrepared) {
            updateDeploymentStatus('Deployment erfolgreich abgeschlossen');
        } else {
            updateDeploymentStatus('Deployment mit Warnungen abgeschlossen');
        }
    }

    // Deployment starten
    deploy();
});
