import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, Upload, Eye, EyeOff, Trash2, Plus, Home, ZoomIn, ZoomOut, Maximize2, Edit3, Eraser, Check, Layers } from 'lucide-react';

// Types
interface Area {
  id: number;
  name: string;
  coordinates: [number, number][];
  visible: boolean;
  color: string;
}

interface MapState {
  center: [number, number];
  zoom: number;
}

type DrawMode = 'polygon' | 'line' | 'point' | 'edit' | 'erase' | null;

export default function AOIMapApp() {
  const [step, setStep] = useState<'define' | 'search' | 'complete'>('define');
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapState, setMapState] = useState<MapState>({
    center: [50.9375, 6.9603], // Cologne
    zoom: 11
  });
  const [showWMSLayer, setShowWMSLayer] = useState(true);
  const [showBaseLayer, setShowBaseLayer] = useState(true);
  const [showSatelliteView, setShowSatelliteView] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [notification, setNotification] = useState('');
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [areasLoaded, setAreasLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawInteractionRef = useRef<any>(null);
  const modifyInteractionRef = useRef<any>(null);
  const selectInteractionRef = useRef<any>(null);
  
  // Refs for current state to avoid stale closures
  const drawModeRef = useRef<DrawMode>(null);
  const editingAreaIdRef = useRef<number | null>(null);
  
  const [sidebarExpanded, setSidebarExpanded] = useState({
    baseImage: false,
    areaOfInterest: true,
    objects: false
  });

  // Sync refs with state
  useEffect(() => {
    drawModeRef.current = drawMode;
    editingAreaIdRef.current = editingAreaId;
  }, [drawMode, editingAreaId]);

  // Load areas from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aoi-areas');
    if (saved) {
      try {
        const parsedAreas = JSON.parse(saved);
        setAreas(parsedAreas);
        setAreasLoaded(true);
      } catch (e) {
        console.error('Failed to load areas:', e);
        setAreasLoaded(true);
      }
    } else {
      setAreasLoaded(true);
    }
  }, []);

  // Save areas to localStorage
  useEffect(() => {
    if (areasLoaded) {
      localStorage.setItem('aoi-areas', JSON.stringify(areas));
    }
  }, [areas, areasLoaded]);

  // Initialize OpenLayers map
  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    const loadMap = async () => {
      // Check if already loading
      if (document.querySelector('script[src*="ol@v8"]')) {
        const checkOL = setInterval(() => {
          if ((window as any).ol && isMounted) {
            clearInterval(checkOL);
            initMap();
          }
        }, 100);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/ol@v8.2.0/ol.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/ol@v8.2.0/dist/ol.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if ((window as any).ol && isMounted) {
          setTimeout(() => initMap(), 100);
        }
      };

      script.onerror = () => {
        console.error('Failed to load OpenLayers');
        showNotification('Failed to load map library');
      };
    };

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current?.map) return;
      
      const ol = (window as any).ol;
      
      // Create base layers
      const osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: !showSatelliteView
      });

      const satelliteLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19
        }),
        visible: showSatelliteView
      });

      const wmsLayer = new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: 'https://www.wms.nrw.de/geobasis/wms_nw_dop',
          params: {
            'LAYERS': 'nw_dop_rgb',
            'TILED': true
          },
          serverType: 'geoserver',
          crossOrigin: 'anonymous'
        }),
        visible: showWMSLayer,
        opacity: 0.7
      });

      // Create vector layer for permanent areas
      const vectorSource = new ol.source.Vector();
      const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: function(feature) {
          const areaId = feature.get('areaId');
          const isEditing = areaId === editingAreaId;
          
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
      });

      // Create vector layer for temporary drawing
      const drawSource = new ol.source.Vector();
      const drawLayer = new ol.layer.Vector({
        source: drawSource,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(249, 115, 22, 0.2)'
          }),
          stroke: new ol.style.Stroke({
            color: '#f97316',
            width: 2,
            lineDash: [10, 5]
          }),
          image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
              color: '#f97316'
            }),
            stroke: new ol.style.Stroke({
              color: '#ffffff',
              width: 2
            })
          })
        })
      });

      // Create map
      const map = new ol.Map({
        target: mapRef.current,
        layers: [osmLayer, satelliteLayer, wmsLayer, vectorLayer, drawLayer],
        view: new ol.View({
          center: ol.proj.fromLonLat([mapState.center[1], mapState.center[0]]),
          zoom: mapState.zoom
        }),
        controls: []
      });

      mapInstanceRef.current = { 
        map, 
        vectorSource, 
        drawSource,
        osmLayer, 
        wmsLayer, 
        satelliteLayer,
        vectorLayer,
        ol
      };

      // Set map loaded immediately after map creation
      setMapLoaded(true);
      showNotification('Map loaded successfully!');

      // Load existing areas
      areas.forEach(area => {
        if (area.visible) {
          addAreaToMap(area);
        }
      });

      // Setup click handler for erase mode using refs
      map.on('click', (evt: any) => {
        if (!mapInstanceRef.current) return;
        
        const feature = map.forEachFeatureAtPixel(evt.pixel, (feature: any) => feature);
        
        if (feature && feature.get('areaId')) {
          const areaId = feature.get('areaId');
          
          // Use the ref values instead of state values
          if (drawModeRef.current === 'erase') {
            deleteArea(areaId);
            return;
          } else if (drawModeRef.current === 'edit' && !editingAreaIdRef.current) {
            startEditingArea(areaId);
          }
        }
      });

      // Add pointer move handler for better UX
      map.on('pointermove', (evt: any) => {
        if (!mapInstanceRef.current) return;
        
        const pixel = map.getEventPixel(evt.originalEvent);
        const hit = map.hasFeatureAtPixel(pixel);
        
        // Change cursor based on mode
        if (drawModeRef.current === 'erase' && hit) {
          map.getTargetElement().style.cursor = 'crosshair';
        } else if (drawModeRef.current === 'edit' && hit) {
          map.getTargetElement().style.cursor = 'pointer';
        } else {
          map.getTargetElement().style.cursor = '';
        }
      });
    };

    loadMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.setTarget(null);
      }
      removeDrawInteraction();
      removeModifyInteraction();
      removeSelectInteraction();
    };
  }, []);

  // Update map when editing area changes
  useEffect(() => {
    if (mapInstanceRef.current?.vectorLayer && mapLoaded) {
      // Force style refresh
      mapInstanceRef.current.vectorLayer.changed();
    }
  }, [editingAreaId, mapLoaded]);

  // Add area to map
  const addAreaToMap = (area: Area) => {
    if (!mapInstanceRef.current?.vectorSource || !mapLoaded) return;

    const { vectorSource, ol } = mapInstanceRef.current;

    // Remove previous feature for this area
    vectorSource.getFeatures()
      .filter((f: any) => f.get("areaId") === area.id)
      .forEach((f: any) => vectorSource.removeFeature(f));

    // Convert lat/lon → map projection
    let coords = area.coordinates.map(([lat, lon]) =>
      ol.proj.fromLonLat([lon, lat])
    );

    // Ensure ring is closed exactly once
    if (coords.length > 0) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords = [...coords, first];
      }
    }

    const polygon = new ol.geom.Polygon([coords]);
    const feature = new ol.Feature(polygon);
    feature.set("areaId", area.id);

    vectorSource.addFeature(feature);
  };

  // Remove draw interaction
  const removeDrawInteraction = () => {
    if (drawInteractionRef.current && mapInstanceRef.current?.map) {
      mapInstanceRef.current.map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    if (mapInstanceRef.current?.drawSource) {
      mapInstanceRef.current.drawSource.clear();
    }
    setDrawingPoints([]);
  };

  // Remove modify interaction
  const removeModifyInteraction = () => {
    if (modifyInteractionRef.current && mapInstanceRef.current?.map) {
      mapInstanceRef.current.map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }
  };

  // Remove select interaction
  const removeSelectInteraction = () => {
    if (selectInteractionRef.current && mapInstanceRef.current?.map) {
      mapInstanceRef.current.map.removeInteraction(selectInteractionRef.current);
      selectInteractionRef.current = null;
    }
  };

  // Update layer visibility
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      mapInstanceRef.current.osmLayer?.setVisible(!showSatelliteView);
      mapInstanceRef.current.satelliteLayer?.setVisible(showSatelliteView);
      mapInstanceRef.current.wmsLayer?.setVisible(showWMSLayer);
    }
  }, [showSatelliteView, showWMSLayer, mapLoaded]);

  // Handle drawing mode changes
  useEffect(() => {
    if (!mapInstanceRef.current?.map || !mapLoaded) return;

    removeDrawInteraction();
    removeModifyInteraction();
    removeSelectInteraction();

    if (drawMode === 'polygon') {
      startPolygonDrawing();
    } else if (drawMode === 'edit') {
      showNotification('Click on an area to edit its edges');
    } else if (drawMode === 'erase') {
      showNotification('Click on areas to erase them');
    } else {
      setEditingAreaId(null);
    }
  }, [drawMode, mapLoaded]);

  // Start polygon drawing with OpenLayers Draw interaction
  const startPolygonDrawing = () => {
    if (!mapInstanceRef.current?.map || !mapInstanceRef.current.ol) return;

    const { map, ol, drawSource } = mapInstanceRef.current;

    // Clear any existing drawings
    drawSource.clear();

    // Create draw interaction
    const draw = new ol.interaction.Draw({
      source: drawSource,
      type: 'Polygon',
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(249, 115, 22, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#f97316',
          width: 2,
          lineDash: [10, 5]
        }),
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({
            color: '#f97316'
          }),
          stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      })
    });

    // Handle draw end - create the area
    draw.on('drawend', (event: any) => {
      const geometry = event.feature.getGeometry();
      const coordinates = geometry.getCoordinates()[0]; // Get polygon coordinates
      
      // Convert to lat/lon
      const latLonCoords = coordinates.map((coord: any) => {
        const lonLat = ol.proj.toLonLat(coord);
        return [lonLat[1], lonLat[0]] as [number, number]; // [lat, lon]
      });

      // Remove the last point (closing point added by OpenLayers)
      const finalCoords = latLonCoords.slice(0, -1);

      if (finalCoords.length >= 3) {
        createArea(finalCoords);
      } else {
        showNotification('Please draw a valid polygon with at least 3 points.');
      }

      // Clear the drawing source and remove interaction
      drawSource.clear();
      map.removeInteraction(draw);
      drawInteractionRef.current = null;
      setDrawMode(null);
    });

    // Handle draw abort
    draw.on('drawabort', () => {
      drawSource.clear();
      setDrawMode(null);
      showNotification('Drawing cancelled');
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;

    showNotification('Click to start drawing, drag to create polygon, double-click to finish');
  };

  // Start editing an area
  const startEditingArea = (areaId: number) => {
    if (!mapInstanceRef.current?.map || !mapInstanceRef.current.ol) {
      return;
    }

    const { map, vectorSource, ol } = mapInstanceRef.current;
    
    // Clear any existing interactions
    removeDrawInteraction();
    removeModifyInteraction();
    removeSelectInteraction();
    
    // Find the feature to edit
    const feature = vectorSource.getFeatures().find((f: any) => f.get('areaId') === areaId);
    if (!feature) {
      showNotification('Area not found on map');
      return;
    }
    
    setEditingAreaId(areaId);

    // Create select interaction
    const select = new ol.interaction.Select({
      features: new ol.Collection([feature]),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(59, 130, 246, 0.4)'
        }),
        stroke: new ol.style.Stroke({
          color: '#3b82f6',
          width: 4
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#3b82f6'
          }),
          stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      })
    });

    // Create modify interaction
    const modify = new ol.interaction.Modify({
      features: select.getFeatures(),
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#3b82f6'
          }),
          stroke: new ol.style.Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      })
    });

    modify.on('modifyend', (event: any) => {
      const features = event.features.getArray();
      
      features.forEach((feature: any) => {
        const areaId = feature.get('areaId');
        const geometry = feature.getGeometry();
        
        if (!geometry) {
          return;
        }
        
        const coordinates = geometry.getCoordinates()[0];
        
        // Convert to lat/lon
        const latLonCoords = coordinates.map((coord: any) => {
          const lonLat = ol.proj.toLonLat(coord);
          return [lonLat[1], lonLat[0]] as [number, number];
        });

        const finalCoords = latLonCoords.slice(0, -1);
        
        // Update area coordinates
        setAreas(prev => prev.map(area => 
          area.id === areaId ? { ...area, coordinates: finalCoords } : area
        ));
      });
      
      showNotification('Area updated successfully');
    });

    // Add interactions to map
    map.addInteraction(select);
    map.addInteraction(modify);
    
    selectInteractionRef.current = select;
    modifyInteractionRef.current = modify;

    // Zoom to the feature being edited
    const geometry = feature.getGeometry();
    if (geometry) {
      map.getView().fit(geometry.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 15
      });
    }

    showNotification('Editing area - drag vertices to adjust shape');
  };

  // Stop editing
  const stopEditing = () => {
    removeModifyInteraction();
    removeSelectInteraction();
    setDrawMode(null);
    setEditingAreaId(null);
    showNotification('Editing stopped');
  };

  // View all areas - fit map to show all areas
  const viewAllAreas = () => {
    if (!mapInstanceRef.current?.map || areas.length === 0) {
      showNotification('No areas to view');
      return;
    }

    const { map, vectorSource, ol } = mapInstanceRef.current;
    
    // Get all features from vector source
    const features = vectorSource.getFeatures();
    
    if (features.length === 0) {
      showNotification('No areas visible on map');
      return;
    }
    
    // Create extent from all features
    const extent = ol.extent.createEmpty();
    
    features.forEach((feature: any) => {
      const geometry = feature.getGeometry();
      if (geometry) {
        ol.extent.extend(extent, geometry.getExtent());
      }
    });

    // Check if we have a valid extent
    if (ol.extent.isEmpty(extent)) {
      showNotification('Could not calculate view for areas');
      return;
    }
    
    // Fit the view to the extent
    map.getView().fit(extent, {
      padding: [50, 50, 50, 50],
      duration: 1000,
      maxZoom: 15
    });
    
    showNotification(`Viewing ${features.length} area${features.length !== 1 ? 's' : ''}`);
  };

  // Create area from drawn coordinates
  const createArea = (coordinates: [number, number][]) => {
    const newArea: Area = {
      id: Date.now(),
      name: `Area ${areas.length + 1}`,
      coordinates: coordinates,
      visible: true,
      color: '#f97316'
    };

    setAreas(prev => [...prev, newArea]);
    
    // Add to map after a brief delay to ensure state is updated
    setTimeout(() => {
      addAreaToMap(newArea);
    }, 100);
    
    showNotification(`${newArea.name} created successfully!`);

    // Ensure the state updates are complete before potentially moving to complete step
    setTimeout(() => {
      // Move to complete step if first area
      if (areas.length === 0) {
        setStep('complete');
      }
    }, 100);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        if (mapInstanceRef.current?.map && mapLoaded) {
          const { map, ol } = mapInstanceRef.current;
          map.getView().animate({
            center: ol.proj.fromLonLat([lon, lat]),
            zoom: 13,
            duration: 1000
          });
        }
        
        setStep('search');
        showNotification(`Found: ${data[0].display_name}`);
      } else {
        showNotification('Location not found. Please try another search.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      showNotification('Search failed. Please try again.');
    }
  };

  // Start drawing
  const startDrawing = () => {
    setDrawMode('polygon');
  };

  // Start erase mode
  const startEraseMode = () => {
    // Clear any other interactions first
    removeDrawInteraction();
    removeModifyInteraction();
    removeSelectInteraction();
    
    // Set both state and ref
    setDrawMode('erase');
    drawModeRef.current = 'erase';
    
    showNotification('Erase mode active - click on areas to delete them');
    
    // Change map cursor to indicate erase mode
    if (mapInstanceRef.current?.map && mapLoaded) {
      mapInstanceRef.current.map.getTargetElement().style.cursor = 'crosshair';
    }
  };

  // Start edit mode
  const startEditMode = () => {
    // Clear any other interactions first
    removeDrawInteraction();
    removeModifyInteraction();
    removeSelectInteraction();
    
    setDrawMode('edit');
    showNotification('Click on an area to edit its edges');
    
    // Change cursor to indicate edit mode
    if (mapInstanceRef.current?.map && mapLoaded) {
      mapInstanceRef.current.map.getTargetElement().style.cursor = 'pointer';
    }
  };

  // Cancel drawing/editing/erase
  const cancelDrawing = () => {
    removeDrawInteraction();
    removeModifyInteraction();
    removeSelectInteraction();
    
    // Reset both state and refs
    setDrawMode(null);
    setEditingAreaId(null);
    drawModeRef.current = null;
    editingAreaIdRef.current = null;
    
    // Reset cursor
    if (mapInstanceRef.current?.map && mapLoaded) {
      mapInstanceRef.current.map.getTargetElement().style.cursor = '';
    }
    
    showNotification('Operation cancelled');
  };

  // Confirm areas and move to complete step
  const confirmAreas = () => {
    if (areas.length > 0) {
      setStep('complete');
      setDrawMode(null);
      removeModifyInteraction();
      removeSelectInteraction();
      showNotification('Areas confirmed! Moving to project scope definition.');
    } else {
      showNotification('Please create at least one area first.');
    }
  };

  // Toggle area visibility
  const toggleAreaVisibility = (id: number) => {
    const updatedAreas = areas.map(area => 
      area.id === id ? { ...area, visible: !area.visible } : area
    );
    setAreas(updatedAreas);
    
    // Update map
    if (mapInstanceRef.current?.vectorSource && mapLoaded) {
      const features = mapInstanceRef.current.vectorSource.getFeatures();
      features.forEach((feature: any) => {
        if (feature.get('areaId') === id) {
          const area = updatedAreas.find(a => a.id === id);
          if (area && !area.visible) {
            mapInstanceRef.current.vectorSource.removeFeature(feature);
          } else if (area && area.visible) {
            addAreaToMap(area);
          }
        }
      });
    }
  };

  // Delete area with proper state handling
  const deleteArea = (id: number) => {
    // Use functional update to get the current areas state
    setAreas(prevAreas => {
      const newAreas = prevAreas.filter(a => a.id !== id);
      
      // Remove from OpenLayers map - do this INSIDE the state update
      if (mapInstanceRef.current?.vectorSource) {
        const vectorSource = mapInstanceRef.current.vectorSource;
        
        // Get all features and filter by areaId
        const allFeatures = vectorSource.getFeatures();
        
        let removedCount = 0;
        allFeatures.forEach((feature: any) => {
          const featureAreaId = feature.get('areaId');
          if (featureAreaId === id) {
            vectorSource.removeFeature(feature);
            removedCount++;
          }
        });
        
        if (removedCount > 0) {
          // Force the map to refresh
          vectorSource.changed();
        }
      }
      
      return newAreas;
    });

    showNotification(`Area deleted successfully!`);
    
    // Cleanup if editing this area
    if (editingAreaId === id) {
      removeModifyInteraction();
      removeSelectInteraction();
      setDrawMode(null);
      setEditingAreaId(null);
    }
  };

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Zoom controls
  const zoomIn = () => {
    if (mapInstanceRef.current?.map && mapLoaded) {
      const view = mapInstanceRef.current.map.getView();
      view.animate({ zoom: view.getZoom() + 1, duration: 250 });
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current?.map && mapLoaded) {
      const view = mapInstanceRef.current.map.getView();
      view.animate({ zoom: view.getZoom() - 1, duration: 250 });
    }
  };

  const resetView = () => {
    if (mapInstanceRef.current?.map && mapLoaded) {
      const { map, ol } = mapInstanceRef.current;
      map.getView().animate({
        center: ol.proj.fromLonLat([6.9603, 50.9375]),
        zoom: 11,
        duration: 1000
      });
    }
  };

  // Apply outline as base image
  const applyOutlineAsBaseImage = () => {
    if (areas.length > 0) {
      showNotification('Outline applied as base image');
      // Here you would typically set this as the base layer
    } else {
      showNotification('Please create areas first');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200">
          <button
            onClick={() => {
              if (step === 'complete') setStep('search');
              else if (step === 'search') setStep('define');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-orange-600 flex-1">
            {step === 'define' && 'Define Area of Interest'}
            {step === 'search' && 'Define Area of Interest'}
            {step === 'complete' && 'Define Project Scope'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'define' && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Define the area(s) where you will apply your object count & detection model
                </p>
                <h3 className="font-medium text-gray-900 mb-3">Options:</h3>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for a city, town... or draw area on map"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">Uploading a shape file</span>
              </button>
            </div>
          )}

          {step === 'search' && (
            <div className="space-y-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                Search or use vector tool to create your region.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Area
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Example: Cologne City Proper"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Drawing Controls */}
              {drawMode === 'polygon' && (
                <div className="space-y-2">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800 font-medium">
                      Drawing Active - Drag to create polygon
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Click to start, drag to draw, double-click to finish
                    </p>
                  </div>
                  <button
                    onClick={cancelDrawing}
                    className="w-full py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                  >
                    Cancel Drawing
                  </button>
                </div>
              )}

              {drawMode === 'edit' && (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">
                      Editing Mode Active
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {editingAreaId ? 'Drag vertices to adjust shape' : 'Click on an area to edit its edges'}
                    </p>
                  </div>
                  {editingAreaId && (
                    <button
                      onClick={stopEditing}
                      className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Finish Editing
                    </button>
                  )}
                </div>
              )}

              {drawMode === 'erase' && (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">
                      Erase Mode Active
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Click on areas to erase them
                    </p>
                  </div>
                  <button
                    onClick={cancelDrawing}
                    className="w-full py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancel Erase
                  </button>
                </div>
              )}

              {!drawMode && (
                <div className="space-y-3">
                  <button
                    onClick={startDrawing}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                  >
                    Draw Area on Map
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startEditMode}
                      disabled={areas.length === 0}
                      className="py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Adjust Edges
                    </button>
                    
                    <button
                      onClick={startEraseMode}
                      disabled={areas.length === 0}
                      className="py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Eraser className="w-4 h-4" />
                      Erase Shapes
                    </button>
                  </div>

                  {areas.length > 0 && (
                    <button
                      onClick={viewAllAreas}
                      className="w-full py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      View All Areas
                    </button>
                  )}
                </div>
              )}

              {areas.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={applyOutlineAsBaseImage}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors text-sm"
                  >
                    Apply outline as base image
                  </button>
                  
                  <button
                    onClick={confirmAreas}
                    className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Confirm Areas
                  </button>
                </div>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                You can always edit the shape of the area later
              </p>

              {areas.length > 0 && !drawMode && (
                <button
                  onClick={confirmAreas}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Confirm Area of Interest
                </button>
              )}
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              {/* Select Base Image */}
              <div className="border border-gray-200 rounded-lg">
                <button 
                  onClick={() => setSidebarExpanded({...sidebarExpanded, baseImage: !sidebarExpanded.baseImage})}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{sidebarExpanded.baseImage ? '▼' : '▶'}</span>
                    <span className="font-medium text-gray-900">Select Base Image</span>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
                {sidebarExpanded.baseImage && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-gray-600">Choose your base imagery layer</p>
                    <button 
                      onClick={applyOutlineAsBaseImage}
                      className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                    >
                      Use Current Outline
                    </button>
                  </div>
                )}
              </div>

              {/* Define Area of Interest */}
              <div className="border border-gray-200 rounded-lg">
                <button 
                  onClick={() => setSidebarExpanded({...sidebarExpanded, areaOfInterest: !sidebarExpanded.areaOfInterest})}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{sidebarExpanded.areaOfInterest ? '▼' : '▶'}</span>
                    <span className="font-medium text-gray-900">Define Area of Interest</span>
                  </div>
                  <Plus 
                    onClick={(e) => {
                      e.stopPropagation();
                      setStep('search');
                    }}
                    className="w-5 h-5 text-gray-400 hover:text-orange-500 cursor-pointer"
                  />
                </button>
                
                {sidebarExpanded.areaOfInterest && (
                  <div className="px-4 pb-4 space-y-2">
                    {areas.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No areas defined yet</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 mb-2">
                          Multiple areas can be selected even if they are not touching
                        </p>
                        {areas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-sm"
                                style={{ backgroundColor: area.color }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{area.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (drawMode === 'edit' && editingAreaId === area.id) {
                                    stopEditing();
                                  } else {
                                    // Ensure we're in edit mode first
                                    if (drawMode !== 'edit') {
                                      setDrawMode('edit');
                                      drawModeRef.current = 'edit';
                                    }
                                    // Small delay to ensure state is updated
                                    setTimeout(() => {
                                      startEditingArea(area.id);
                                    }, 100);
                                  }
                                }}
                                className={`p-1.5 rounded transition-colors ${
                                  drawMode === 'edit' && editingAreaId === area.id 
                                    ? 'bg-blue-100 border border-blue-300' 
                                    : 'hover:bg-blue-100'
                                }`}
                                title={drawMode === 'edit' && editingAreaId === area.id ? 'Stop Editing' : 'Edit edges'}
                              >
                                <Edit3 className={`w-4 h-4 ${
                                  drawMode === 'edit' && editingAreaId === area.id ? 'text-blue-700' : 'text-blue-600'
                                }`} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAreaVisibility(area.id);
                                }}
                                className="p-1.5 hover:bg-orange-100 rounded transition-colors"
                                title={area.visible ? 'Hide' : 'Show'}
                              >
                                {area.visible ? (
                                  <Eye className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteArea(area.id);
                                }}
                                className="p-1.5 hover:bg-orange-100 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Define Objects */}
              <div className="border border-gray-200 rounded-lg">
                <button 
                  onClick={() => setSidebarExpanded({...sidebarExpanded, objects: !sidebarExpanded.objects})}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{sidebarExpanded.objects ? '▼' : '▶'}</span>
                    <span className="font-medium text-gray-900">Define Objects</span>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
                {sidebarExpanded.objects && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-gray-600">Define objects to detect</p>
                  </div>
                )}
              </div>

              <button 
                disabled={areas.length === 0}
                className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors text-sm mt-6"
              >
                Scope Definition Finished
              </button>
            </div>
          )}
        </div>

        {/* Layer Controls */}
        <div className="p-4 border-t border-gray-200 space-y-3 bg-gray-50">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showWMSLayer}
                onChange={(e) => setShowWMSLayer(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">WMS Satellite Layer (NRW)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showSatelliteView}
                onChange={(e) => setShowSatelliteView(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Satellite Imagery (ESRI)</span>
            </label>
          </div>
          {areas.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {areas.length} area{areas.length !== 1 ? 's' : ''} defined • {areas.filter(a => a.visible).length} visible
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />

        {/* Loading State */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Erase Mode Visual Indicator */}
        {drawMode === 'erase' && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl z-[1001] animate-pulse">
            <div className="flex items-center gap-2">
              <Eraser className="w-5 h-5" />
              <span className="font-semibold">ERASE MODE ACTIVE</span>
              <Eraser className="w-5 h-5" />
            </div>
            <p className="text-sm mt-1">Click on areas to delete them</p>
          </div>
        )}

        {/* Edit Mode Visual Indicator */}
        {drawMode === 'edit' && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl z-[1001] animate-pulse">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              <span className="font-semibold">EDIT MODE ACTIVE</span>
              <Edit3 className="w-5 h-5" />
            </div>
            <p className="text-sm mt-1">
              {editingAreaId ? 'Drag vertices to adjust shape' : 'Click on an area to edit its edges'}
            </p>
          </div>
        )}

        {/* Map Controls - Right Side */}
        <div className="absolute right-6 top-6 flex flex-col gap-3 z-[1000]">
          {/* Zoom In */}
          <button
            onClick={zoomIn}
            className="w-12 h-12 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center group"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
          </button>
          
          {/* Zoom Out */}
          <button
            onClick={zoomOut}
            className="w-12 h-12 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center group"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
          </button>

          {/* View All Areas */}
          {areas.length > 0 && (
            <button
              onClick={viewAllAreas}
              className="w-12 h-12 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center group"
              title="View All Areas"
            >
              <Layers className="w-5 h-5 text-gray-700 group-hover:text-purple-500" />
            </button>
          )}

          {/* Draw Polygon Tool */}
          {(step === 'search' || step === 'complete') && (
            <button
              onClick={startDrawing}
              disabled={drawMode === 'polygon'}
              className={`w-12 h-12 rounded-lg shadow-lg transition-all flex items-center justify-center group ${
                drawMode === 'polygon' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              title="Draw Polygon"
            >
              <svg className={`w-6 h-6 ${drawMode === 'polygon' ? 'text-white' : 'text-gray-700 group-hover:text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
          )}

          {/* Edit Tool */}
          {(step === 'search' || step === 'complete') && areas.length > 0 && (
            <button
              onClick={startEditMode}
              className={`w-12 h-12 rounded-lg shadow-lg transition-all flex items-center justify-center group ${
                drawMode === 'edit' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              title="Adjust Edges"
            >
              <Edit3 className={`w-5 h-5 ${drawMode === 'edit' ? 'text-white' : 'text-gray-700 group-hover:text-blue-500'}`} />
            </button>
          )}

          {/* Erase Tool */}
          {(step === 'search' || step === 'complete') && areas.length > 0 && (
            <button
              onClick={startEraseMode}
              className={`w-12 h-12 rounded-lg shadow-lg transition-all flex items-center justify-center group ${
                drawMode === 'erase' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              title="Erase Shapes"
            >
              <Eraser className={`w-5 h-5 ${drawMode === 'erase' ? 'text-white' : 'text-gray-700 group-hover:text-red-500'}`} />
            </button>
          )}
          
          {/* Full Screen */}
          <button 
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="w-12 h-12 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center group"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
          </button>

          {/* Reset View */}
          <button 
            onClick={resetView}
            className="w-12 h-12 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center group"
            title="Reset to Cologne"
          >
            <Home className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-[1001] animate-fade-in">
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )}

        {/* Drawing Guide */}
        {drawMode === 'polygon' && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-xl z-[1000] max-w-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Drawing Polygon Mode Active</p>
                <p className="text-xs opacity-90">
                  • Click to start drawing<br/>
                  • Drag to create the polygon shape<br/>
                  • Double-click to finish
                </p>
              </div>
            </div>
          </div>
        )}

        {drawMode === 'edit' && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-xl z-[1000] max-w-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Edit Mode Active</p>
                <p className="text-xs opacity-90">
                  {editingAreaId 
                    ? '• Drag vertices to adjust edges\n• Click "Finish Editing" when done'
                    : '• Click on an area to select it\n• Drag vertices to adjust edges'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {drawMode === 'erase' && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl z-[1000] max-w-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Eraser className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Erase Mode Active</p>
                <p className="text-xs opacity-90">
                  • Click on areas to erase them<br/>
                  • Areas will be permanently deleted<br/>
                  • Click "Cancel Erase" to exit
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Areas Created Badge */}
        {areas.length > 0 && step === 'complete' && !drawMode && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-5 py-2 rounded-full shadow-lg z-[999] flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">{areas.length} Area{areas.length !== 1 ? 's' : ''} Created</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
