import { GeoLocation } from './types';

export const DEFAULT_MAP_CENTER: GeoLocation = {
  lat: 56.1304,
  lng: -106.3468,
  zoom: 4
};

export const API_ENDPOINT = 'http://localhost:8000/run_sse';

// Mock data for the demo mode
export const DEMO_PROMPT = "Get the projected population for each province and highlight top 3";
export const DEMO_PROMPT_2 = "Based on the population expansion in future 3 years which provinces would be under stress";
export const DEMO_PROMPT_3 = "Show me the healthcare facilities in NWT";
