import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { MapData, GeoPolygon, GeoMarker } from '../types';
import { DEFAULT_MAP_CENTER } from '../constants';

// Fix for default Leaflet marker icons in React/Webpack/Vite environments
// This must run before the map renders to prevent missing icon 404s
const fixLeafletIcon = () => {
  try {
    // Delete the default icon getter to force use of our manual options
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch (e) {
    console.warn("Leaflet icon fix failed", e);
  }
};

fixLeafletIcon();

interface MapPanelProps {
  mapData: MapData;
  theme: 'dark' | 'light';
}

// Inner component to access the Map instance via context
const MapController: React.FC<{ mapData: MapData }> = ({ mapData }) => {
  const map = useMap();

  // Force Leaflet to recalculate container size on mount and on resize
  useEffect(() => {
    // Initial invalidate
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Observer to handle dynamic container resizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    // In React-Leaflet the container might be wrapped, but map.getContainer() returns the DOM node
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [map]);

  // Fly to new center when mapData updates
  useEffect(() => {
    if (mapData.center) {
      map.flyTo(
        [mapData.center.lat, mapData.center.lng],
        mapData.center.zoom,
        { duration: 1.5, easeLinearity: 0.25 }
      );
    }
  }, [mapData.center, map]);

  return null;
};

const MapPanel: React.FC<MapPanelProps> = ({ mapData, theme }) => {
  const mapRef = useRef<L.Map>(null);

  // Convert custom polygon format to Leaflet format
  const renderPolygons = (polygons: GeoPolygon[] = []) => {
    return polygons.map((poly, idx) => (
      <Polygon
        key={`poly-${idx}`}
        positions={poly.coordinates}
        pathOptions={{
          color: poly.color || '#3b82f6',
          fillColor: poly.color || '#3b82f6',
          fillOpacity: 0.3,
          weight: 2
        }}
      >
        {poly.label && (
          <Popup>
            <div className="text-slate-800 font-semibold">{poly.label}</div>
          </Popup>
        )}
      </Polygon>
    ));
  };

  const renderMarkers = (markers: GeoMarker[] = []) => {
    return markers.map((marker, idx) => (
      <Marker key={`marker-${idx}`} position={marker.position}>
        <Popup>
          <div className="font-medium text-sm text-slate-900">{marker.title}</div>
        </Popup>
      </Marker>
    ));
  };

  // Select Tile URL based on theme
  const tileUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  // Style for the background GeoJSON (Provinces)
  // Subtle lines: Slate-700 in dark mode, Slate-400 in light mode
  const geoJsonStyle = {
    color: theme === 'dark' ? '#334155' : '#94a3b8',
    weight: 1,
    fillOpacity: 0,
    opacity: 0.8
  };

  return (
    <div className={`h-full w-full relative z-0 overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'}`}>
      <MapContainer
        center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
        zoom={DEFAULT_MAP_CENTER.zoom}
        scrollWheelZoom={true}
        className="h-full w-full outline-none"
        // Inline style is critical for Leaflet to detect height
        style={{ height: '100%', width: '100%', minHeight: '400px', isolation: 'isolate' }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        
        <MapController mapData={mapData} />
        
        {/* Background GeoJSON Layer (e.g. Canada Provinces) */}
        {mapData.geoJsonData && (
          <GeoJSON 
            key="canada-boundaries" 
            data={mapData.geoJsonData} 
            style={geoJsonStyle} 
          />
        )}
        
        {/* Active Agent Layers (Rendered on top) */}
        {renderPolygons(mapData.polygons)}
        {renderMarkers(mapData.markers)}
      </MapContainer>
      
      {/* Overlay info */}
      <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded text-xs text-slate-500 dark:text-slate-400 z-[400] border border-gray-200 dark:border-slate-700 pointer-events-none">
        ADK Map Visualization Layer
      </div>
    </div>
  );
};

export default MapPanel;