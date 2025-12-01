export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

export enum EventType {
  Reasoning = 'reasoning',
  ToolCall = 'tool_call',
  MapUpdate = 'map_update',
  Error = 'error'
}

export interface GeoLocation {
  lat: number;
  lng: number;
  zoom: number;
}

export interface GeoPolygon {
  coordinates: [number, number][]; // Simple array of lat/lng tuples for Leaflet Polygon
  color?: string;
  label?: string;
}

export interface GeoMarker {
  position: [number, number];
  title: string;
}

export interface MapData {
  center?: GeoLocation;
  polygons?: GeoPolygon[];
  markers?: GeoMarker[];
  geoJsonData?: any; // Stores raw GeoJSON object (FeatureCollection)
}

export interface AgentEvent {
  id: string;
  type: EventType;
  title: string;
  description?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  relatedEvents?: AgentEvent[];
}

// Format of the SSE/Stream chunk from the backend
export interface StreamChunk {
  type: 'content' | 'event' | 'map';
  data: any;
}