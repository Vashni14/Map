🗺️ AOI Map Application - Area of Interest Mapping Tool
A modern, interactive web application for defining and managing geographic Areas of Interest (AOI) with advanced mapping capabilities.

https://img.shields.io/badge/React-18.2.0-blue https://img.shields.io/badge/TypeScript-5.0+-blue https://img.shields.io/badge/OpenLayers-8.2.0-green https://img.shields.io/badge/TailwindCSS-3.3+-blue

✨ Features
🗺️ Core Mapping
Interactive Map Interface - Powered by OpenLayers with multiple base layers

Multiple Base Layers - OSM, ESRI Satellite, WMS NRW Satellite

Real-time Drawing - Draw polygons directly on the map

Precise Coordinate Handling - Accurate lat/lon coordinate management

🎯 Area Management
Create Areas - Draw custom polygons on the map

Edit Boundaries - Adjust area edges with vertex editing

Delete Areas - Remove areas with erase mode or sidebar controls

Toggle Visibility - Show/hide areas on the map

View All Areas - Auto-zoom to display all created areas

🔍 Search & Navigation
Geocoding Search - Find locations using Nominatim API

Indian Cities Support - Optimized for Indian geography with major metro cities

Smart Zoom Controls - Zoom in/out, reset view, fit to areas

💾 Data Persistence
Local Storage - Automatically saves areas between sessions

Project Scope Management - Define complete project requirements

Export Ready - Structured data for further processing

🚀 Quick Start
Prerequisites
Node.js 16+

npm or yarn

Installation
Clone the repository

bash
git clone <repository-url>
cd aoi-map-app
Install dependencies

bash
npm install
Start development server

bash
npm run dev
Open your browser

text
http://localhost:3000
Production Build
bash
npm run build
npm start
🎮 How to Use
Step 1: Define Area of Interest
Search for Location

Enter city name (e.g., "Delhi", "Mumbai", "Bangalore")

Click search or press Enter

Map automatically zooms to location

Draw Areas

Click "Draw Area on Map"

Click on map to create polygon vertices

Double-click to complete the polygon

Areas are automatically saved

Step 2: Manage Areas
Adjust Edges: Click "Adjust Edges" then click on area to edit vertices

Erase Shapes: Click "Erase Shapes" then click on areas to delete

View All: Click "View All Areas" to see all created areas

Toggle Visibility: Use eye icons in sidebar to show/hide areas

Step 3: Define Project Scope
Select Base Image - Choose imagery layers

Define Area of Interest - Review and manage created areas

Define Objects - Prepare for object detection setup

Finish Scope - Complete project definition

🛠️ Technology Stack
Frontend Framework
React 18 - Modern React with hooks

TypeScript - Type-safe development

Vite - Fast build tool and dev server

Mapping & GIS
OpenLayers 8 - Professional mapping library

Multiple Tile Sources:

OpenStreetMap (OSM)

ESRI World Imagery (Satellite)

WMS NRW (German aerial imagery)

UI & Styling
TailwindCSS - Utility-first CSS framework

Lucide React - Beautiful icons

Responsive Design - Mobile-friendly interface

APIs & Services
Nominatim API - OpenStreetMap geocoding

Local Storage API - Client-side data persistence

📁 Project Structure
text
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles
└── App.tsx            # Main application component
Key Components
MapContainer - OpenLayers map integration

Sidebar - Application controls and area management

AreaList - Display and manage created areas

DrawingTools - Polygon drawing and editing tools

🧪 Testing
Playwright End-to-End Tests
bash
# Run all tests
npm run test:e2e

# Run tests in headed mode
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
Test Coverage
✅ Map loading and initialization

✅ Area creation and management

✅ Search functionality with Indian cities

✅ Edit and delete operations

✅ Responsive design testing

✅ Error handling scenarios

⚙️ Configuration
Environment Variables
Create .env file for custom configuration:

env
VITE_MAP_DEFAULT_CENTER=28.6139,77.2090
VITE_MAP_DEFAULT_ZOOM=10
VITE_SEARCH_API_URL=https://nominatim.openstreetmap.org/search
Customizing Base Layers
Modify the layer configuration in App.tsx:

typescript
const baseLayers = {
  osm: 'OpenStreetMap',
  satellite: 'ESRI World Imagery', 
  wms: 'WMS NRW Satellite'
};
🎨 Customization
Adding New Base Layers
typescript
const newLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'your-tile-service-url/{z}/{x}/{y}'
  }),
  visible: false
});
Styling Areas
Modify the vector layer style function:

typescript
style: function(feature) {
  const isEditing = feature.get('areaId') === editingAreaId;
  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: isEditing ? 'rgba(59, 130, 246, 0.4)' : 'rgba(249, 115, 22, 0.3)'
    }),
    stroke: new ol.style.Stroke({
      color: isEditing ? '#3b82f6' : '#f97316',
      width: isEditing ? 4 : 3
    })
  });
}
🔧 API Reference
Geocoding API
typescript
// Search for locations
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
);
Local Storage Schema
typescript
interface StoredAreas {
  areas: Array<{
    id: number;
    name: string;
    coordinates: [number, number][]; // [lat, lon]
    visible: boolean;
    color: string;
  }>;
}
🐛 Troubleshooting
Common Issues
Map not loading

Check internet connection

Verify OpenLayers script loading

Check browser console for errors

Search not working

Verify Nominatim API accessibility

Check network requests in dev tools

Areas not saving

Check browser localStorage support

Verify no storage quotas exceeded

Debug Mode
Enable debug logging in browser console:

javascript
localStorage.setItem('debug', 'true');
📊 Performance
Optimizations
Efficient Re-renders - React memo and callback optimization

Map Performance - Vector layer clustering and simplification

Memory Management - Proper cleanup of OpenLayers interactions

Lazy Loading - Dynamic imports for larger components

Browser Support
Chrome 90+

Firefox 88+

Safari 14+

Edge 90+