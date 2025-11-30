🗺️ AOI Map Application - Area of Interest Mapping Tool
=======================================================

A modern, interactive web application for defining and managing geographic Areas of Interest (AOI) with advanced mapping capabilities.

[https://img.shields.io/badge/React-18.2.0-blue](https://img.shields.io/badge/React-18.2.0-blue) [https://img.shields.io/badge/TypeScript-5.0+-blue](https://img.shields.io/badge/TypeScript-5.0+-blue) [https://img.shields.io/badge/OpenLayers-8.2.0-green](https://img.shields.io/badge/OpenLayers-8.2.0-green) [https://img.shields.io/badge/TailwindCSS-3.3+-blue](https://img.shields.io/badge/TailwindCSS-3.3+-blue)

✨ Features
----------

### 🗺️ Core Mapping

*   **Interactive Map Interface** - Powered by OpenLayers with multiple base layers
    
*   **Multiple Base Layers** - OSM, ESRI Satellite, WMS NRW Satellite
    
*   **Real-time Drawing** - Draw polygons directly on the map
    
*   **Precise Coordinate Handling** - Accurate lat/lon coordinate management
    

### 🎯 Area Management

*   **Create Areas** - Draw custom polygons on the map
    
*   **Edit Boundaries** - Adjust area edges with vertex editing
    
*   **Delete Areas** - Remove areas with erase mode or sidebar controls
    
*   **Toggle Visibility** - Show/hide areas on the map
    
*   **View All Areas** - Auto-zoom to display all created areas
    

### 🔍 Search & Navigation

*   **Geocoding Search** - Find locations using Nominatim API
    
*   **Indian Cities Support** - Optimized for Indian geography with major metro cities
    
*   **Smart Zoom Controls** - Zoom in/out, reset view, fit to areas
    

### 💾 Data Persistence

*   **Local Storage** - Automatically saves areas between sessions
    
*   **Project Scope Management** - Define complete project requirements
    
*   **Export Ready** - Structured data for further processing
    

🚀 Quick Start
--------------

### Prerequisites

*   Node.js 16+
    
*   npm or yarn
    

### Installation

1.  **Clone the repository**
    

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   git clone   cd aoi-map-app   `

1.  **Install dependencies**
    

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install   `

1.  **Start development server**
    

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm run dev   `

1.  **Open your browser**
    

text

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   http://localhost:3000   `

### Production Build

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm run build  npm start   `

🎮 How to Use
-------------

### Step 1: Define Area of Interest

**Search for Location**

*   Enter city name (e.g., "Delhi", "Mumbai", "Bangalore")
    
*   Click search or press Enter
    
*   Map automatically zooms to location
    

**Draw Areas**

*   Click "Draw Area on Map"
    
*   Click on map to create polygon vertices
    
*   Double-click to complete the polygon
    
*   Areas are automatically saved
    

### Step 2: Manage Areas

*   **Adjust Edges**: Click "Adjust Edges" then click on area to edit vertices
    
*   **Erase Shapes**: Click "Erase Shapes" then click on areas to delete
    
*   **View All**: Click "View All Areas" to see all created areas
    
*   **Toggle Visibility**: Use eye icons in sidebar to show/hide areas
    

### Step 3: Define Project Scope

*   **Select Base Image** - Choose imagery layers
    
*   **Define Area of Interest** - Review and manage created areas
    
*   **Define Objects** - Prepare for object detection setup
    
*   **Finish Scope** - Complete project definition
    

🛠️ Technology Stack
--------------------

### Frontend Framework

*   **React 18** - Modern React with hooks
    
*   **TypeScript** - Type-safe development
    
*   **Vite** - Fast build tool and dev server
    

### Mapping & GIS

*   **OpenLayers 8** - Professional mapping library
    
*   **Multiple Tile Sources**:
    
    *   OpenStreetMap (OSM)
        
    *   ESRI World Imagery (Satellite)
        
    *   WMS NRW (German aerial imagery)
        

### UI & Styling

*   **TailwindCSS** - Utility-first CSS framework
    
*   **Lucide React** - Beautiful icons
    
*   **Responsive Design** - Mobile-friendly interface
    

### APIs & Services

*   **Nominatim API** - OpenStreetMap geocoding
    
*   **Local Storage API** - Client-side data persistence
    

📁 Project Structure
--------------------

text

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   src/  ├── components/          # React components  ├── hooks/              # Custom React hooks  ├── types/              # TypeScript type definitions  ├── utils/              # Utility functions  ├── styles/             # Global styles  └── App.tsx            # Main application component   `

### Key Components

*   **MapContainer** - OpenLayers map integration
    
*   **Sidebar** - Application controls and area management
    
*   **AreaList** - Display and manage created areas
    
*   **DrawingTools** - Polygon drawing and editing tools
    

🧪 Testing
----------

### Playwright End-to-End Tests

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Run all tests  npm run test:e2e  # Run tests in headed mode  npm run test:e2e:headed  # Debug tests  npm run test:e2e:debug  # View test report  npm run test:e2e:report   `

### Test Coverage

*   ✅ Map loading and initialization
    
*   ✅ Area creation and management
    
*   ✅ Search functionality with Indian cities
    
*   ✅ Edit and delete operations
    
*   ✅ Responsive design testing
    
*   ✅ Error handling scenarios
