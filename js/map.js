// Verbesserte OpenStreetMap-Integration mit OSM Buildings
class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.position = null;
        this.initialized = false;
        this.buildingsData = null;
        this.lastFetchedPosition = null;
        this.fetchRadius = 500; // Radius in Metern für Gebäudedaten
    }

    // Karte initialisieren
    initialize(position) {
        if (!position || !position.latitude || !position.longitude) {
            console.error('Ungültige Position für die Karteninitialisierung');
            return false;
        }

        this.position = position;

        try {
            // OSM Buildings initialisieren
            this.map = new OSMBuildings({
                container: this.containerId,
                position: {
                    latitude: position.latitude,
                    longitude: position.longitude
                },
                zoom: 17,
                minZoom: 15,
                maxZoom: 20,
                tilt: 0,
                rotation: 0,
                attribution: '© Data <a href="https://openstreetmap.org/copyright/">OpenStreetMap</a> © Map <a href="https://osmbuildings.org/copyright/">OSM Buildings</a>'
            });

            // Kartenkacheln hinzufügen
            this.map.addMapTiles('https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png');
            
            // 3D-Gebäudedaten hinzufügen
            this.map.addGeoJSONTiles('https://{s}.data.osmbuildings.org/0.2/59fcc2e8/tile/{z}/{x}/{y}.json');

            this.initialized = true;
            
            // Gebäudedaten abrufen
            this.fetchBuildingsData(position);
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Karteninitialisierung:', error);
            return false;
        }
    }

    // Position aktualisieren
    updatePosition(position) {
        if (!this.initialized) {
            return this.initialize(position);
        }

        if (!position || !position.latitude || !position.longitude) {
            console.error('Ungültige Position für die Kartenaktualisierung');
            return false;
        }

        this.position = position;

        try {
            this.map.setPosition({
                latitude: position.latitude,
                longitude: position.longitude
            });
            
            // Prüfen, ob neue Gebäudedaten abgerufen werden müssen
            if (this.shouldFetchNewData(position)) {
                this.fetchBuildingsData(position);
            }
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Kartenaktualisierung:', error);
            return false;
        }
    }

    // Kompassrichtung aktualisieren
    updateRotation(heading) {
        if (!this.initialized) {
            console.error('Karte wurde noch nicht initialisiert');
            return false;
        }

        if (heading === null || heading === undefined) {
            console.error('Ungültige Kompassrichtung');
            return false;
        }

        try {
            this.map.setRotation(heading);
            return true;
        } catch (error) {
            console.error('Fehler bei der Rotationsaktualisierung:', error);
            return false;
        }
    }

    // Prüfen, ob neue Daten abgerufen werden müssen
    shouldFetchNewData(newPosition) {
        if (!this.lastFetchedPosition) {
            return true;
        }
        
        // Distanz zwischen letzter Abfrage-Position und aktueller Position berechnen
        const distance = this.calculateDistance(
            this.lastFetchedPosition.latitude,
            this.lastFetchedPosition.longitude,
            newPosition.latitude,
            newPosition.longitude
        );
        
        // Neue Daten abrufen, wenn sich die Position um mehr als die Hälfte des Radius geändert hat
        return distance > (this.fetchRadius / 2);
    }

    // Distanz zwischen zwei Koordinaten berechnen (Haversine-Formel)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Erdradius in Metern
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distanz in Metern
        return distance;
    }

    // Grad in Radiant umrechnen
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Gebäudedaten für einen bestimmten Bereich abrufen
    async fetchBuildingsData(position) {
        if (!position || !position.latitude || !position.longitude) {
            console.error('Ungültige Position für die Datenabrufung');
            return null;
        }

        const lat = position.latitude;
        const lon = position.longitude;
        
        // Bereich berechnen (grobe Annäherung)
        const latDelta = this.fetchRadius / 111000; // ca. 111 km pro Grad Breite
        const lonDelta = this.fetchRadius / (111000 * Math.cos(lat * Math.PI / 180)); // Anpassung für Längengrad
        
        const bounds = {
            north: lat + latDelta,
            south: lat - latDelta,
            east: lon + lonDelta,
            west: lon - lonDelta
        };
        
        try {
            // Overpass API für detaillierte Gebäudedaten verwenden
            const query = `
                [out:json];
                (
                  way["building"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
                  relation["building"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
                );
                out body;
                >;
                out skel qt;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.buildingsData = data;
            this.lastFetchedPosition = position;
            
            console.log(`Gebäudedaten abgerufen: ${data.elements.length} Elemente`);
            
            return data;
        } catch (error) {
            console.error('Fehler beim Abrufen der Gebäudedaten:', error);
            return null;
        }
    }

    // Gebäudedaten für Three.js aufbereiten
    processBuildings() {
        if (!this.buildingsData || !this.position) {
            return [];
        }
        
        const buildings = [];
        const elements = this.buildingsData.elements;
        
        // Knoten (Nodes) in eine Map für schnellen Zugriff speichern
        const nodes = new Map();
        elements.forEach(element => {
            if (element.type === 'node') {
                nodes.set(element.id, {
                    lat: element.lat,
                    lon: element.lon
                });
            }
        });
        
        // Wege (Ways) verarbeiten, die Gebäude sind
        elements.forEach(element => {
            if (element.type === 'way' && element.tags && element.tags.building) {
                const points = [];
                
                // Alle Knoten des Wegs sammeln
                if (element.nodes) {
                    element.nodes.forEach(nodeId => {
                        const node = nodes.get(nodeId);
                        if (node) {
                            points.push({
                                lat: node.lat,
                                lon: node.lon
                            });
                        }
                    });
                }
                
                if (points.length > 2) { // Mindestens 3 Punkte für ein Polygon
                    // Gebäudehöhe bestimmen (falls verfügbar)
                    let height = 10; // Standardhöhe in Metern
                    if (element.tags.height) {
                        height = parseFloat(element.tags.height);
                    } else if (element.tags['building:levels']) {
                        // Ungefähre Höhe basierend auf Stockwerken (3m pro Stockwerk)
                        height = parseFloat(element.tags['building:levels']) * 3;
                    }
                    
                    // Gebäude zur Liste hinzufügen
                    buildings.push({
                        id: element.id,
                        type: 'building',
                        points: points,
                        height: height,
                        tags: element.tags
                    });
                }
            }
        });
        
        return buildings;
    }

    // Gebäudedaten in lokalen Koordinaten umrechnen
    convertToLocalCoordinates(buildings) {
        if (!buildings || !this.position) {
            return [];
        }
        
        const result = [];
        const centerLat = this.position.latitude;
        const centerLon = this.position.longitude;
        
        buildings.forEach(building => {
            const localPoints = [];
            
            // Alle Punkte in lokale Koordinaten umrechnen
            building.points.forEach(point => {
                // Umrechnung von Lat/Lon in Meter relativ zum Zentrum
                const x = this.calculateDistance(centerLat, centerLon, centerLat, point.lon);
                const z = -this.calculateDistance(centerLat, centerLon, point.lat, centerLon);
                
                // Vorzeichen basierend auf Richtung
                const xSign = point.lon > centerLon ? 1 : -1;
                const zSign = point.lat > centerLat ? -1 : 1;
                
                localPoints.push({
                    x: x * xSign,
                    z: z * zSign
                });
            });
            
            result.push({
                id: building.id,
                type: building.type,
                points: localPoints,
                height: building.height,
                tags: building.tags
            });
        });
        
        return result;
    }

    // Aktuelle Gebäudedaten abrufen
    getBuildingsData() {
        const buildings = this.processBuildings();
        return this.convertToLocalCoordinates(buildings);
    }

    // Karte zerstören (Ressourcen freigeben)
    destroy() {
        if (this.map) {
            // OSM Buildings hat keine explizite destroy-Methode
            // Container leeren
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '';
            }
            this.map = null;
            this.initialized = false;
            this.buildingsData = null;
            this.lastFetchedPosition = null;
        }
    }
}

// Globale Instanz erstellen
const mapManager = new MapManager('map-container');
