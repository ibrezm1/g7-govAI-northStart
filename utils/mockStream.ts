import { StreamChunk, EventType } from '../types';

// GLOBAL SPEED CONTROL
// Increase this to slow down the simulation (e.g., 1.0 = normal, 2.0 = 2x slower)
// Use 0.1 for instant debugging.
const DELAY_MULTIPLIER = 0.5;

// This function simulates an Async Generator that yields chunks like the real backend would
export async function* mockAdkStream(prompt: string): AsyncGenerator<StreamChunk> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms * DELAY_MULTIPLIER));
  const p = prompt.toLowerCase();

  // ---------------------------------------------------------
  // SCENARIO 3: Projected Population (Table + ON/QC/BC Highlights)
  // Keywords: "projected", "provinces"
  // ---------------------------------------------------------
  if (p.includes('projected') || p.includes('highlight')) {
    // 1. Initial Reasoning
    yield {
      type: 'event',
      data: {
        type: EventType.Reasoning,
        title: 'Querying Statistics',
        description: 'Retrieving population projection models (2024-2027) for all provinces.',
        status: 'pending'
      }
    };
    await delay(1200);

    // 2. BigQuery Call
    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'BigQuery Agent',
        description: 'Running: SELECT province, pop_2024, pop_2027_proj FROM `canada_census_projections_v2`',
        status: 'pending'
      }
    };
    await delay(2000); // Simulate query execution time
    
    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'BigQuery Agent',
        description: 'Query completed. Returned 13 rows.',
        status: 'completed'
      }
    };
    await delay(500);

    // 3. Map Update (Polygons for BC, ON, QC)
    yield {
      type: 'map',
      data: {
        center: { lat: 55.0, lng: -90.0, zoom: 3 }, 
        markers: [],
        polygons: [
          {
            // British Columbia
            coordinates: [
              [49.0, -123.0], [54.0, -133.0], [60.0, -139.0], 
              [60.0, -120.0], [49.0, -114.0], [49.0, -123.0]
            ],
            color: '#10b981', // Emerald (Green)
            label: 'British Columbia (High Growth)'
          },
          {
            // Ontario
            coordinates: [
              [42.0, -83.0], [45.0, -74.0], [52.0, -79.0], 
              [56.0, -88.0], [50.0, -95.0], [42.0, -83.0]
            ],
            color: '#3b82f6', // Blue
            label: 'Ontario (Highest Volume)'
          },
          {
            // Quebec
            coordinates: [
              [45.0, -74.0], [45.0, -71.0], [52.0, -57.0], 
              [62.0, -70.0], [52.0, -79.0], [45.0, -74.0]
            ],
            color: '#8b5cf6', // Violet
            label: 'Quebec (Steady Growth)'
          }
        ]
      }
    };

    yield {
      type: 'event',
      data: {
        type: EventType.MapUpdate,
        title: 'Regional Visualization',
        description: 'Highlighting major population centers: Ontario, Quebec, and British Columbia.',
        status: 'completed'
      }
    };
    await delay(800);

    // 4. Text Response (Table)
    const intro = "Here are the **population projections** for the next 3 years by province. The map highlights the three most populous provinces (Ontario, Quebec, and British Columbia) which account for 75% of the total growth.\n\n";
    for (const char of intro.split(' ')) {
        yield { type: 'content', data: char + ' ' };
        await delay(30);
    }

    // Markdown Table
    const table = `
| Province | Last (2021) | Projected (2027) | Growth Rate |
| :--- | :--- | :--- | :--- |
| **Ontario (ON)** | 14.22M | 15.10M | +6.2% |
| **Quebec (QC)** | 8.50M | 8.72M | +2.6% |
| **British Columbia (BC)** | 5.00M | 5.35M | +7.0% |
| Alberta (AB) | 4.26M | 4.60M | +8.0% |
| Manitoba (MB) | 1.34M | 1.41M | +5.2% |
| Saskatchewan (SK) | 1.13M | 1.18M | +4.4% |
| Nova Scotia (NS) | 0.97M | 1.01M | +4.1% |
| New Brunswick (NB) | 0.78M | 0.81M | +3.8% |
| Newfoundland (NL) | 0.51M | 0.52M | +2.0% |
| PEI (PE) | 0.15M | 0.16M | +6.7% |
| Territories | 0.12M | 0.13M | +8.3% |
`;
    yield { type: 'content', data: table };
    await delay(100);
    return;
  }

  // ---------------------------------------------------------
  // SCENARIO 2: Healthcare Locations (Markers)
  // Keywords: "healthcare", "locations", "facilities"
  // ---------------------------------------------------------
  else if (p.includes('show') || p.includes('nwt')) {
    
    // 1. Initial Reasoning
    yield {
      type: 'event',
      data: {
        type: EventType.Reasoning,
        title: 'Analyzing Geography',
        description: 'User requested facility locations. Converting region names to lat/lng bounds.',
        status: 'pending'
      }
    };
    await delay(1000);

    // 2. BigQuery Call
    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'BigQuery Agent',
        description: 'Running: SELECT name, lat, lng FROM `health_care_facilities_ca` WHERE region IN ("AB", "NWT")',
        status: 'pending'
      }
    };
    await delay(1800);

    yield {
        type: 'event',
        data: {
          type: EventType.ToolCall,
          title: 'BigQuery Agent',
          description: 'Query execution successful. Found 6 matching records.',
          status: 'completed'
        }
      };
    await delay(500);

    // 3. Map Update (Markers)
    // Note: We send this BEFORE the text so the user sees the map update immediately
    yield {
      type: 'map',
      data: {
        center: { lat: 64.0, lng: -119.0, zoom: 4 }, // Centered more on NWT
        polygons: [], // Clear polygons
        markers: [
          { position: [61.865, -121.354], title: 'Fort Simpson Health Centre' },
          { position: [60.003, -111.88], title: 'Fort Smith Health Centre' },
          { position: [60.816, -115.779], title: 'H.H. Williams Memorial Hospital' },
          { position: [68.353, -133.695], title: 'Inuvik Regional Hospital' },
          { position: [62.447, -114.404], title: 'Stanton Regional Hospital' },
          { position: [62.447, -114.405], title: 'Stanton Territorial Hospital' }
        ]
      }
    };

    yield {
      type: 'event',
      data: {
        type: EventType.MapUpdate,
        title: 'Rendering Markers',
        description: 'Plotted 6 key facilities in Northwest Territories.',
        status: 'completed'
      }
    };
    await delay(600);
    
    // 4. Text Response (Table)
    const intro = "Here are the key healthcare facilities located in the **Northwest Territories** found in the dataset:\n\n";
    for (const char of intro.split(' ')) {
        yield { type: 'content', data: char + ' ' };
        await delay(30);
    }

    // Markdown Table
    const table = `
| Facility Name | Latitude | Longitude |
| :--- | :--- | :--- |
| **Fort Simpson Health Centre** | 61.86505 | -121.354 |
| **Fort Smith Health Centre** | 60.00356 | -111.880 |
| **H.H. Williams Memorial** | 60.81655 | -115.779 |
| **Inuvik Regional Hospital** | 68.35299 | -133.695 |
| **Stanton Regional Hospital** | 62.44756 | -114.404 |
| **Stanton Territorial Hospital** | 62.44768 | -114.405 |
`;
    yield { type: 'content', data: table };
    await delay(100);

    return; // End of Demo 2
  }

  // ---------------------------------------------------------
  // SCENARIO 1: Population Impact (Polygons + Graph)
  // Keywords: "expansion", "impact"
  // ---------------------------------------------------------
  else if (p.includes('expansion') || p.includes('stress')) {

    // 1. Initial Reasoning
    yield {
      type: 'event',
      data: {
        type: EventType.Reasoning,
        title: 'Decomposing Query',
        description: 'Identifying required agents: Data Retrieval and Statistical Analysis.',
        status: 'pending'
      }
    };
    await delay(1200);

    // 2. BigQuery Agent Call
    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'BigQuery Agent',
        description: 'Checking schema for: "population_projections_v4" and "health_care_facilities_ca".',
        status: 'pending'
      }
    };
    await delay(1500);

    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'BigQuery Agent',
        description: 'Identified datasets: "population_projections_v4" and "health_care_facilities_ca".',
        status: 'completed'
      }
    };
    await delay(800);

    // 3. DataScience Agent Call
    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'DataScience Agent',
        description: 'Calculated 2-year growth vs total healthcare facilities. Computing facility density scores.',
        status: 'pending'
      }
    };
    await delay(2500); // Heavy calculation simulation

    yield {
      type: 'event',
      data: {
        type: EventType.ToolCall,
        title: 'DataScience Agent',
        description: 'Calculation complete. Identified anomalies in AB and NWT regions.',
        status: 'completed'
      }
    };
    await delay(500);

    // 4. Text Response Part 1
    const responsePart1 = "Based on the projection analysis comparing population growth against current infrastructure capacity, **Alberta** and the **Northwest Territories** will be the most stressed regions. ";
    for (const char of responsePart1.split(' ')) {
      yield { type: 'content', data: char + ' ' };
      await delay(30);
    }

    await delay(600);

    // 5. Graph Image (Markdown)
    // Constructed QuickChart URL for Density Scores
    const graphUrl = "https://quickchart.io/chart?c=%7Btype%3A%27bar%27%2Cdata%3A%7Blabels%3A%5B%27Alberta%27%2C%27NWT%27%5D%2Cdatasets%3A%5B%7Blabel%3A%27Facility%20Density%20Score%27%2Cdata%3A%5B0.78%2C0.07%5D%2CbackgroundColor%3A%5B%27%23ef4444%27%2C%27%23b91c1c%27%5D%7D%5D%7D%2Coptions%3A%7Blegend%3A%7Bdisplay%3Afalse%7D%2Ctitle%3A%7Bdisplay%3Atrue%2Ctext%3A%27Healthcare%20Facility%20Density%20(Projected)%27%2CfontColor%3A%27%23cbd5e1%27%7D%2Cscales%3A%7ByAxes%3A%5B%7Bticks%3A%7BbeginAtZero%3Atrue%2CfontColor%3A%27%2394a3b8%27%7D%2CgridLines%3A%7Bcolor%3A%27rgba(255%2C255%2C255%2C0.1)%27%7D%7D%5D%2CxAxes%3A%5B%7Bticks%3A%7BfontColor%3A%27%2394a3b8%27%7D%2CgridLines%3A%7Bdisplay%3Afalse%7D%7D%5D%7D%7D%7D&w=400&h=200&bkg=transparent";

    yield { 
      type: 'content', 
      data: `\n\n![Healthcare Density Graph](${graphUrl})\n\n` 
    };
    
    await delay(1000);

    // 6. Text Response Part 2
    const responsePart2 = "The analysis reveals critically low facility density scores: **0.78** for Alberta and **0.07** for the Northwest Territories. These figures indicate a significant gap between projected population inflow and available service locations.";
    for (const char of responsePart2.split(' ')) {
      yield { type: 'content', data: char + ' ' };
      await delay(30);
    }

    // 7. Map Update (Highlighting AB and NWT)
    yield {
      type: 'map',
      data: {
        center: { lat: 60.0, lng: -115.0, zoom: 3 }, // Zoom to show both AB and NWT
        markers: [], // Clear markers if any
        polygons: [
          {
            // Alberta (Approximate Polygon)
            coordinates: [
              [49.0, -114.0], // SW corner (AB/BC/USA)
              [60.0, -120.0], // NW corner (AB/BC/NWT)
              [60.0, -110.0], // NE corner (AB/NWT/SK)
              [49.0, -110.0]  // SE corner (AB/SK/USA)
            ],
            color: '#ef4444', // Red-500
            label: 'Alberta: 0.78 Density Score'
          },
          {
            // Northwest Territories (Approximate Polygon)
            coordinates: [
              [60.0, -120.0], // SW (border with BC)
              [68.0, -136.0], // NW (border with Yukon)
              [70.0, -130.0], // North (coast)
              [68.0, -102.0], // NE (border with Nunavut)
              [60.0, -102.0], // SE (border with MB/SK)
              [60.0, -110.0]  // South (border with AB)
            ],
            color: '#b91c1c', // Darker Red-700
            label: 'NWT: 0.07 Density Score'
          }
        ]
      }
    };
    
    yield {
      type: 'event',
      data: {
        type: EventType.MapUpdate,
        title: 'Visualizing Impact Zones',
        description: 'Highlighting Alberta and NWT based on calculated stress indices.',
        status: 'completed'
      }
    };
    return;
  }

  // ---------------------------------------------------------
  // GENERIC FALLBACK
  // ---------------------------------------------------------
  else {
    const genericResponse = "I'm currently in demo mode. Try asking about:\n\n1. **Population expansion impact**\n2. **Healthcare facility locations**\n3. **Projected population stats**";
    for (const char of genericResponse.split(' ')) {
      yield { type: 'content', data: char + ' ' };
      await delay(20);
    }
  }
}
