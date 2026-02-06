export interface GaugeDataPoint {
  date: string;
  level: number;
}

export interface FloodGauge {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  historicalData?: GaugeDataPoint[];
}

// Defines the available detail levels for the AI-generated story.
export type StoryLevel = 'summary' | 'standard' | 'detailed';

// Types for parsing the live USGS API response
export interface USGSValue {
  value: string;
  qualifiers: string[];
  dateTime: string;
}

export interface USGSSeries {
  sourceInfo: {
    siteName: string;
    siteCode: { value: string }[];
    geoLocation: {
      geogLocation: {
        latitude: number;
        longitude: number;
      };
    };
  };
  variable: {
    variableName: string;
  };
  values: { value: USGSValue[] }[];
}

export interface USGSResponse {
  value: {
    timeSeries: USGSSeries[];
  };
}