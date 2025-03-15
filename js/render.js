// Verbesserte Three.js-Rendering für First-Person-View mit OpenStreetMap-Gebäudedaten
class RenderManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.buildings = [];
        this.initialized = false;
        this.animationFrameId = null;
        this.raycaster = null;
        this.groundMesh = null;
        this.skybox = null;
        this.directionalLight = null;
        this.ambientLight = null;
    }

    // Renderer initialisieren
    initialize() {
        try {
            // Container abrufen
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                console.error(`Container mit ID "${this.containerId}" nicht gefunden`);
                return false;
            }

            // Szene erstellen
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87ceeb); // Himmelblau

            // Kamera erstellen
            this.camera = new THREE.PerspectiveCamera(
                75, // Sichtfeld
                window.innerWidth / window.innerHeight, // Seitenverhältnis
                0.1, // Near-Clipping-Plane
                1000 // Far-Clipping-Plane
            );
            this.camera.position.set(0, 1.7, 0); // Augenhöhe eines durchschnittlichen Menschen
            this.camera.lookAt(0, 1.7, -1); // Nach vorne schauen

            // Renderer erstellen
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.container.appendChild(this.renderer.domElement);

            // Uhr für Animation
            this.clock = new THREE.Clock();

            // Controls erstellen
            this.setupControls();

            // Licht hinzufügen
            this.setupLighting();

            // Boden hinzufügen
            this.setupGround();

            // Skybox hinzufügen
            this.setupSkybox();

            // Raycaster für Kollisionserkennung
            this.raycaster = new THREE.Raycaster();

            // Event-Listener für Fenstergrößenänderung
            window.addEventListener('resize', this.handleResize.bind(this));

            this.initialized = true;
            
            // Animation starten
            this.animate();
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Renderer-Initialisierung:', error);
            return false;
        }
    }

    // Controls einrichten
    setupControls() {
        this.controls = new THREE.FirstPersonControls(this.camera, this.renderer.domElement);
        this.controls.movementSpeed = 5;
        this.controls.lookSpeed = 0.1;
        this.controls.lookVertical = true;
        this.controls.constrainVertical = true;
        this.controls.verticalMin = Math.PI / 6; // 30 Grad nach unten
        this.controls.verticalMax = Math.PI / 2; // 90 Grad nach oben
        this.controls.activeLook = true;
    }

    // Beleuchtung einrichten
    setupLighting() {
        // Ambientes Licht für grundlegende Beleuchtung
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Gerichtetes Licht für Sonnenlicht-Effekt
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 200, 100);
        this.directionalLight.castShadow = true;
        
        // Schatten-Einstellungen
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 10;
        this.directionalLight.shadow.camera.far = 400;
        this.directionalLight.shadow.camera.left = -200;
        this.directionalLight.shadow.camera.right = 200;
        this.directionalLight.shadow.camera.top = 200;
        this.directionalLight.shadow.camera.bottom = -200;
        
        this.scene.add(this.directionalLight);
    }

    // Boden einrichten
    setupGround() {
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7cfc00, // Grün
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2; // Horizontal ausrichten
        this.groundMesh.position.y = 0; // Auf Bodenhöhe
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);
    }

    // Skybox einrichten
    setupSkybox() {
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyboxMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide }), // rechts
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide }), // links
            new THREE.MeshBasicMaterial({ color: 0x4ca3dd, side: THREE.BackSide }), // oben
            new THREE.MeshBasicMaterial({ color: 0x7cfc00, side: THREE.BackSide }), // unten
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide }), // vorne
            new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide })  // hinten
        ];
        this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
        this.scene.add(this.skybox);
    }

    // Fenstergrößenänderung behandeln
    handleResize() {
        if (!this.initialized) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        if (this.controls) {
            this.controls.handleResize();
        }
    }

    // Animation Loop
    animate() {
        if (!this.initialized) return;
        
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        // Controls aktualisieren
        if (this.controls) {
            this.controls.update(this.clock.getDelta());
        }
        
        // Szene rendern
        this.renderer.render(this.scene, this.camera);
    }

    // Kameraposition aktualisieren
    updateCameraPosition(position) {
        if (!this.initialized || !position) return false;
        
        // Hier würde eine Umrechnung von GPS-Koordinaten in 3D-Weltkoordinaten erfolgen
        // Für eine einfache Demo setzen wir die Position direkt
        this.camera.position.set(position.x, position.y, position.z);
        return true;
    }

    // Kamerarotation aktualisieren (basierend auf Kompassdaten)
    updateCameraRotation(heading) {
        if (!this.initialized || heading === null || heading === undefined) return false;
        
        // Umrechnung von Kompassgrad in Radiant
        // Kompass: 0° = Norden, 90° = Osten, 180° = Süden, 270° = Westen
        // Three.js: 0 rad = Osten, PI/2 rad = Norden, PI rad = Westen, 3PI/2 rad = Süden
        const rotationY = THREE.MathUtils.degToRad(90 - heading);
        
        // Kamera drehen
        this.camera.rotation.y = rotationY;
        
        // Controls aktualisieren, falls vorhanden
        if (this.controls) {
            this.controls.lon = heading;
            this.controls.update(0);
        }
        
        return true;
    }

    // Gebäude zur Szene hinzufügen
    addBuildings(buildingsData) {
        if (!this.initialized || !buildingsData) return false;
        
        try {
            // Bestehende Gebäude entfernen
            this.clearBuildings();
            
            // Neue Gebäude hinzufügen
            for (const building of buildingsData) {
                this.addBuilding(building);
            }
            
            return true;
        } catch (error) {
            console.error('Fehler beim Hinzufügen von Gebäuden:', error);
            return false;
        }
    }

    // Einzelnes Gebäude hinzufügen
    addBuilding(building) {
        if (!building || !building.points || building.points.length < 3) {
            return null;
        }
        
        try {
            // Gebäudeform aus Punkten erstellen
            const shape = new THREE.Shape();
            
            // Erster Punkt als Startpunkt
            shape.moveTo(building.points[0].x, building.points[0].z);
            
            // Restliche Punkte hinzufügen
            for (let i = 1; i < building.points.length; i++) {
                shape.lineTo(building.points[i].x, building.points[i].z);
            }
            
            // Form schließen
            shape.closePath();
            
            // Extrusionseinstellungen
            const extrudeSettings = {
                steps: 1,
                depth: building.height || 10,
                bevelEnabled: false
            };
            
            // Geometrie erstellen
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            
            // Material erstellen
            let material;
            
            // Verschiedene Materialien basierend auf Gebäudetyp
            if (building.tags && building.tags.building) {
                switch (building.tags.building) {
                    case 'residential':
                    case 'house':
                    case 'detached':
                    case 'apartments':
                        material = new THREE.MeshStandardMaterial({
                            color: 0xE8DAEF, // Hellviolett für Wohngebäude
                            roughness: 0.7,
                            metalness: 0.2
                        });
                        break;
                    case 'commercial':
                    case 'office':
                    case 'retail':
                        material = new THREE.MeshStandardMaterial({
                            color: 0xD6EAF8, // Hellblau für Gewerbegebäude
                            roughness: 0.6,
                            metalness: 0.3
                        });
                        break;
                    case 'industrial':
                    case 'warehouse':
                    case 'factory':
                        material = new THREE.MeshStandardMaterial({
                            color: 0xFADBD8, // Hellrot für Industriegebäude
                            roughness: 0.8,
                            metalness: 0.4
                        });
                        break;
                    case 'school':
                    case 'university':
                    case 'college':
                    case 'kindergarten':
                        material = new THREE.MeshStandardMaterial({
                            color: 0xFCF3CF, // Hellgelb für Bildungseinrichtungen
                            roughness: 0.7,
                            metalness: 0.2
                        });
                        break;
                    default:
                        material = new THREE.MeshStandardMaterial({
                            color: 0xD5DBDB, // Grau für sonstige Gebäude
                            roughness: 0.7,
                            metalness: 0.2
                        });
                }
            } else {
                material = new THREE.MeshStandardMaterial({
                    color: 0xD5DBDB, // Grau für sonstige Gebäude
                    roughness: 0.7,
                    metalness: 0.2
                });
            }
            
            // Mesh erstellen
            const mesh = new THREE.Mesh(geometry, material);
            
            // Mesh positionieren (Y-Achse ist Höhe in Three.js)
            mesh.position.y = 0;
            
            // Mesh rotieren (um X-Achse, da wir in Three.js Y als Höhe verwenden)
            mesh.rotation.x = Math.PI / 2;
            
            // Schatten werfen und empfangen
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Zur Szene hinzufügen
            this.scene.add(mesh);
            
            // Zur Gebäudeliste hinzufügen
            this.buildings.push(mesh);
            
            return mesh;
        } catch (error) {
            console.error('Fehler beim Hinzufügen eines Gebäudes:', error);
            return null;
        }
    }

    // Straßen zur Szene hinzufügen
    addRoads(roadsData) {
        if (!this.initialized || !roadsData) return false;
        
        try {
            // Bestehende Straßen entfernen
            this.clearRoads();
            
            // Neue Straßen hinzufügen
            for (const road of roadsData) {
                this.addRoad(road);
            }
            
            return true;
        } catch (error) {
            console.error('Fehler beim Hinzufügen von Straßen:', error);
            return false;
        }
    }

    // Einzelne Straße hinzufügen
    addRoad(road) {
        if (!road || !road.points || road.points.length < 2) {
            return null;
        }
        
        try {
            // Pfad für die Straße erstellen
            const path = new THREE.Path();
            
            // Erster Punkt als Startpunkt
            path.moveTo(road.points[0].x, road.points[0].z);
            
            // Restliche Punkte hinzufügen
            for (let i = 1; i < road.points.length; i++) {
                path.lineTo(road.points[i].x, road.points[i].z);
            }
            
            // Straßenbreite bestimmen
            const width = road.width || 5;
            
            // Geometrie erstellen
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const indices = [];
            
            // Punkte für die Straße generieren
            for (let i = 0; i < road.points.length - 1; i++) {
                const p1 = road.points[i];
                const p2 = road.points[i + 1];
                
                // Richtungsvektor
                const dx = p2.x - p1.x;
                const dz = p2.z - p1.z;
                
                // Normalisieren
                const length = Math.sqrt(dx * dx + dz * dz);
                const ndx = dx / length;
                const ndz = dz / length;
                
                // Senkrechter Vektor
                const nx = -ndz;
                const nz = ndx;
                
                // Vier Ecken des Straßensegments
                const v1x = p1.x + nx * width / 2;
                const v1z = p1.z + nz * width / 2;
                
                const v2x = p1.x - nx * width / 2;
                const v2z = p1.z - nz * width / 2;
                
                const v3x = p2.x + nx * width / 2;
                const v3z = p2.z + nz * width / 2;
                
                const v4x = p2.x - nx * width / 2;
                const v4z = p2.z - nz * width / 2;
                
                // Indizes für die Vertices
                const baseIndex = positions.length / 3;
                
                // Vertices hinzufügen
                positions.push(v1x, 0.1, v1z);
                positions.push(v2x, 0.1, v2z);
                positions.push(v3x, 0.1, v3z);
                positions.push(v4x, 0.1, v4z);
                
                // Indizes für Dreiecke hinzufügen
                indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
            }
            
            // Geometrie mit Vertices und Indizes füllen
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            
            // Material erstellen
            const material = new THREE.MeshStandardMaterial({
                color: 0x333333, // Dunkelgrau für Straßen
                roughness: 0.9,
                metalness: 0.1
            });
            
            // Mesh erstellen
            const mesh = new THREE.Mesh(geometry, material);
            
            // Schatten empfangen
            mesh.receiveShadow = true;
            
            // Zur Szene hinzufügen
            this.scene.add(mesh);
            
            // Zur Straßenliste hinzufügen
            if (!this.roads) this.roads = [];
            this.roads.push(mesh);
            
            return mesh;
        } catch (error) {
            console.error('Fehler beim Hinzufügen einer Straße:', error);
            return null;
        }
    }

    // Alle Gebäude aus der Szene entfernen
    clearBuildings() {
        if (!this.initialized) return false;
        
        for (const building of this.buildings) {
            this.scene.remove(building);
            building.geometry.dispose();
            building.material.dispose();
        }
        
        this.buildings = [];
        return true;
    }

    // Alle Straßen aus der Szene entfernen
    clearRoads() {
        if (!this.initialized || !this.roads) return false;
        
        for (const road of this.roads) {
            this.scene.remove(road);
            road.geometry.dispose();
            road.material.dispose();
        }
        
        this.roads = [];
        return true;
    }

    // Renderer zerstören (Ressourcen freigeben)
    destroy() {
        if (!this.initialized) return;
        
        // Animation stoppen
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Event-Listener entfernen
        window.removeEventListener('resize', this.handleResize.bind(this));
        
        // Gebäude entfernen
        this.clearBuildings();
        
        // Straßen entfernen
        if (this.roads) {
            this.clearRoads();
        }
        
        // Boden entfernen
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
            this.groundMesh.material.dispose();
            this.groundMesh = null;
        }
        
        // Skybox entfernen
        if (this.skybox) {
            this.scene.remove(this.skybox);
            this.skybox.geometry.dispose();
            
            if (Array.isArray(this.skybox.material)) {
                this.skybox.material.forEach(material => material.dispose());
            } else {
                this.skybox.material.dispose();
            }
            
            this.skybox = null;
        }
        
        // Lichter entfernen
        if (this.directionalLight) {
            this.scene.remove(this.directionalLight);
            this.directionalLight = null;
        }
        
        if (this.ambientLight) {
            this.scene.remove(this.ambientLight);
            this.ambientLight = null;
        }
        
        // Renderer entfernen
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Referenzen löschen
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = null;
        this.raycaster = null;
        this.initialized = false;
    }
}

// Globale Instanz erstellen
const renderManager = new RenderManager('map-container');
