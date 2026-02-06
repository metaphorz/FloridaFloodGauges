
import { FloodGauge, GaugeDataPoint, StoryLevel, USGSResponse } from '../types';
import { GoogleGenAI } from "@google/genai";

/**
 * Fetches live flood gauge data for Florida from the official USGS Water Services API.
 * This function requests the last 7 days of "gage height" data for all active
 * monitoring sites in Florida.
 */
export const getFloridaFloodGauges = async (): Promise<FloodGauge[]> => {
  // USGS parameter code for "Gage height, feet"
  const GAGE_HEIGHT_PARAM_CODE = '00065';
  // We request the last 7 days of data.
  const PERIOD = 'P7D'; 
  const USGS_API_URL = `https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=FL&parameterCd=${GAGE_HEIGHT_PARAM_CODE}&siteStatus=active&period=${PERIOD}`;

  try {
    const response = await fetch(USGS_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to load live USGS data. Status: ${response.status} ${response.statusText}`);
    }
    
    const data: USGSResponse = await response.json();
    
    // Transform the complex USGS API response into our simple FloodGauge format
    const gauges: FloodGauge[] = data.value.timeSeries
      // FIX: Explicitly setting the return type for the map function to `FloodGauge | null` corrects the type inference, making the subsequent type predicate in the `.filter` call valid.
      .map((series): FloodGauge | null => {
        // Ensure there's data to process
        if (!series.values[0] || series.values[0].value.length === 0) {
          return null;
        }

        const historicalData: GaugeDataPoint[] = series.values[0].value
          .map(v => ({
            date: v.dateTime,
            level: parseFloat(v.value),
          }))
          // Sort data chronologically as the API doesn't guarantee order
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return {
          id: series.sourceInfo.siteCode[0].value,
          name: series.sourceInfo.siteName,
          latitude: series.sourceInfo.geoLocation.geogLocation.latitude,
          longitude: series.sourceInfo.geoLocation.geogLocation.longitude,
          historicalData: historicalData,
        };
      })
      // Filter out any null entries that resulted from gauges with no data
      .filter((gauge): gauge is FloodGauge => gauge !== null);
      
    return gauges;

  } catch (error) {
    console.error("Error fetching live gauge data from USGS:", error);
    throw new Error('Could not load live flood gauge data from the USGS. Please check the console for details.');
  }
};


/**
 * Generates a contextual story for a given flood gauge using the Gemini API.
 * @param gauge The flood gauge to generate the story for.
 * @param level The desired level of detail for the story.
 * @returns A string containing the generated story.
 */
export const getGaugeStory = async (gauge: FloodGauge, level: StoryLevel): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    let lengthInstruction = '';
    switch (level) {
        case 'summary':
            lengthInstruction = 'Keep the explanation extremely concise, just one or two sentences summarizing the main reason for the water level change.';
            break;
        case 'standard':
            lengthInstruction = 'Provide a single, well-structured paragraph explaining the water level behavior.';
            break;
        case 'detailed':
            lengthInstruction = 'Keep the explanation to 2-3 paragraphs. Start with the most important factor influencing the water level change.';
            break;
    }

    const prompt = `
    You are a hydrologist and science communicator. Your task is to explain the water level fluctuations for the "${gauge.name}" gauge in Florida.
    
    Important: The 'level' data represents the water surface ELEVATION in feet above sea level, NOT the actual water depth. Please make this clear in your explanation.

    Historical Data (last 7 days, surface elevation):
    ${gauge.historicalData?.map(d => `${new Date(d.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})}: ${d.level} ft`).join('\n')}
    
    Provide a concise and easy-to-understand explanation for why the water level might behave this way.
    Focus on the *fluctuation* (the change in level), as this is the most meaningful information.
    
    Consider factors like:
    - The water body type (river, coastal lagoon, lake, swamp).
    - Influence of ocean tides if it's a coastal system.
    - Impact of recent rainfall or lack thereof.
    - Scale of the fluctuation (e.g., a 0.5 ft change is significant for a shallow lagoon but minor for a large river).
    
    If the base elevation is high (e.g., over 50 feet), briefly explain that this is due to the region's topography and does not represent water depth.
    
    **Crucially, start your explanation directly. Do not use any introductory phrases, greetings, or self-identifications like "Hello," "As a hydrologist," or "Here is an explanation...".**
    
    ${lengthInstruction}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating gauge story:", error);
        throw new Error('Could not generate the story for this gauge. The AI model may be temporarily unavailable.');
    }
};
