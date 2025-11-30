# 🗺️ AOI Map Application - Area of Interest Mapping Tool

A modern, interactive web application for defining and managing geographic Areas of Interest (AOI) with advanced mapping capabilities.

![React](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue) ![OpenLayers](https://img.shields.io/badge/OpenLayers-8.2.0-green) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3+-blue)

## ✨ Features

### 🗺️ Core Mapping
- **Interactive Map Interface** - Powered by OpenLayers with multiple base layers
- **Multiple Base Layers** - OSM, ESRI Satellite, WMS NRW Satellite
- **Real-time Drawing** - Draw polygons directly on the map
- **Precise Coordinate Handling** - Accurate lat/lon coordinate management

### 🎯 Area Management
- **Create Areas** - Draw custom polygons on the map
- **Edit Boundaries** - Adjust area edges with vertex editing
- **Delete Areas** - Remove areas with erase mode or sidebar controls
- **Toggle Visibility** - Show/hide areas on the map
- **View All Areas** - Auto-zoom to display all created areas

### 🔍 Search & Navigation
- **Geocoding Search** - Find locations using Nominatim API
- **Indian Cities Support** - Optimized for Indian geography with major metro cities
- **Smart Zoom Controls** - Zoom in/out, reset view, fit to areas

### 💾 Data Persistence
- **Local Storage** - Automatically saves areas between sessions
- **Project Scope Management** - Define complete project requirements
- **Export Ready** - Structured data for further processing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aoi-map-app
```
2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```
4. **Open your browser**
   http://localhost:3000

### Production Build
```bash
npm run build
npm run preview
```

## 🎮 How to Use

### Step 1: Define Area of Interest

**Search for Location**
- Enter city name (e.g., "Delhi", "Mumbai", "Bangalore")
- Click search or press Enter
- Map automatically zooms to location

**Draw Areas**
- Click "Draw Area on Map"
- Click on map to create polygon vertices
- Double-click to complete the polygon
- Areas are automatically saved

### Step 2: Manage Areas

- **Adjust Edges**: Click "Adjust Edges" then click on area to edit vertices
- **Erase Shapes**: Click "Erase Shapes" then click on areas to delete
- **View All**: Click "View All Areas" to see all created areas
- **Toggle Visibility**: Use eye icons in sidebar to show/hide areas

### Step 3: Define Project Scope

1. **Select Base Image** - Choose imagery layers
2. **Define Area of Interest** - Review and manage created areas
3. **Define Objects** - Prepare for object detection setup
4. **Finish Scope** - Complete project definition

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

### Mapping & GIS
- **OpenLayers 8** - Professional mapping library
- **Multiple Tile Sources**:
  - OpenStreetMap (OSM)
  - ESRI World Imagery (Satellite)
  - WMS NRW (German aerial imagery)

### UI & Styling
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Responsive Design** - Mobile-friendly interface

### APIs & Services
- **Nominatim API** - OpenStreetMap geocoding
- **Local Storage API** - Client-side data persistence

## 📁 Project Structure
```
aoi-map-app/
│
├── public/                    # Static assets
│   └── index.html            # HTML template
│
├── src/                      # Source files
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles & Tailwind imports
│
├── tests/                    # Test files
│   └── aoi-map.spec.ts      # Playwright E2E tests
│
├── node_modules/             # Dependencies (auto-generated)
│
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies & scripts
├── package-lock.json        # Dependency lock file
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for Node
├── vite.config.ts           # Vite build configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── playwright.config.ts     # Playwright test configuration
└── README.md                # Project documentation
```

### Key Components
- **MapContainer** - OpenLayers map integration
- **Sidebar** - Application controls and area management
- **AreaList** - Display and manage created areas
- **DrawingTools** - Polygon drawing and editing tools

## 🧪 Testing

### Playwright End-to-End Tests
```bash
Run all tests
npm testRun tests in headed mode (see browser)
npx playwright test --headedDebug tests (step through)
npx playwright test --debugView test report
npx playwright show-report
```

### Test Coverage
✅ Map loading and initialization  
✅ Area creation and management  
✅ Search functionality with geocoding  
✅ Edit and delete operations  
✅ localStorage persistence  
✅ Layer visibility toggles  
✅ Zoom controls  
✅ Drawing mode activation  

## 📦 Dependencies

### Core
- `react` - ^18.2.0
- `react-dom` - ^18.2.0
- `lucide-react` - ^0.263.1

### Development
- `@playwright/test` - ^1.40.0
- `@vitejs/plugin-react` - ^4.2.1
- `typescript` - ^5.2.2
- `tailwindcss` - ^3.3.6
- `vite` - ^5.0.8
