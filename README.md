# First-Person-View Environment App

A progressive web application that displays your surroundings in a first-person 3D view using GPS location data and OpenStreetMap building information.

![First-Person-View Environment App](https://github.com/DG1001/fpv-environment-app/raw/main/screenshots/app-preview.jpg)

## Features

- **GPS Location Tracking**: High-accuracy GPS positioning with manual updates
- **OpenStreetMap Integration**: Retrieves surrounding buildings, roads, and landmarks
- **3D Visualization**: Renders the environment in first-person view using Three.js
- **Compass Orientation**: Uses device orientation sensors to determine viewing direction
- **Progressive Web App**: Works offline and can be installed on home screens
- **Responsive Design**: Optimized for mobile devices

## Technology Stack

- **HTML5/CSS3/JavaScript**: Core web technologies
- **Geolocation API**: For GPS positioning
- **DeviceOrientation API**: For compass functionality
- **OpenStreetMap & OSM Buildings**: For map and building data
- **Three.js**: For 3D rendering
- **Service Workers**: For offline capabilities

## Installation

### Prerequisites

- Web server with HTTPS support (required for Geolocation and DeviceOrientation APIs)
- Modern mobile browser with GPS and orientation sensor support

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/DG1001/fpv-environment-app.git
   cd fpv-environment-app
   ```

2. Deploy to a web server:
   - Upload the contents of the `app` directory to your web server
   - Ensure the server is configured for HTTPS

3. For local testing:
   ```bash
   cd app
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your browser.

## Usage

1. Open the application in a mobile browser
2. Grant permissions for location and device orientation when prompted
3. Press the "Update Position" button to get your current location
4. Look around by physically rotating your device
5. The 3D view will show buildings and streets from your surroundings

## Project Structure

```
app/
├── css/
│   └── style.css
├── icons/
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── js/
│   ├── app.js
│   ├── compass.js
│   ├── deploy.js
│   ├── gps.js
│   ├── map.js
│   └── render.js
├── index.html
├── manifest.json
├── offline.html
└── service-worker.js
```

## Key Components

- **GPS Manager**: Handles location retrieval with high accuracy
- **Compass Manager**: Processes device orientation data with smoothing algorithms
- **Map Manager**: Fetches and processes OpenStreetMap data
- **Render Manager**: Creates the 3D visualization using Three.js
- **App Core**: Coordinates all components and manages the application state

## Configuration

You can customize the application by modifying the following files:

- `js/app.js`: Main application settings
- `js/gps.js`: GPS accuracy and update settings
- `js/render.js`: Visual appearance and rendering settings
- `manifest.json`: PWA settings and appearance

## Future Enhancements

- Continuous position updates (currently manual updates only)
- Enhanced building details and textures
- Navigation features
- Augmented reality integration
- User location sharing

## Browser Compatibility

The application requires:
- Geolocation API
- DeviceOrientation API
- WebGL support
- Service Worker support

Best experienced on recent versions of:
- Chrome for Android
- Safari on iOS 13+
- Firefox for Android

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [OSM Buildings](https://osmbuildings.org/) for building data
- [Three.js](https://threejs.org/) for 3D rendering capabilities

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

Project Link: [https://github.com/DG10001/fpv-environment-app](https://github.com/DG1001/fpv-environment-app)
