import React, { useState, useEffect, useCallback } from 'react';
import { FloodGauge, StoryLevel } from './types';
import { getFloridaFloodGauges, getGaugeStory } from './services/geminiService';
import Map from './components/Map';
import GaugeChart from './components/GaugeChart';
import GaugeStory from './components/GaugeStory';

const App: React.FC = () => {
  const [gauges, setGauges] = useState<FloodGauge[]>([]);
  const [selectedGauge, setSelectedGauge] = useState<FloodGauge | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading Florida Map...');
  const [error, setError] = useState<string | null>(null);

  // State for the gauge story modal
  const [isStoryOpen, setIsStoryOpen] = useState<boolean>(false);
  const [isStoryLoading, setIsStoryLoading] = useState<boolean>(false);
  const [storyCache, setStoryCache] = useState<Record<string, Partial<Record<StoryLevel, string>>>>({});
  const [storyLevel, setStoryLevel] = useState<StoryLevel>('summary');


  const fetchInitialGauges = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      setLoadingMessage('Fetching live gauge data from USGS...');
      const gaugeData = await getFloridaFloodGauges();
      setGauges(gaugeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialGauges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGaugeClick = (gauge: FloodGauge) => {
    setSelectedGauge(gauge);
  };

  const closeChart = () => {
    setSelectedGauge(null);
    setIsStoryOpen(false); // Also close story if open
  };

  const handleOpenStory = async () => {
    if (!selectedGauge) return;

    // Check if the Gemini API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
        setError('The Story feature requires a free Google Gemini API key.\n\n1. Visit https://aistudio.google.com to get a free key\n2. Create a file called .env.local in the project root\n3. Add: VITE_GEMINI_API_KEY=your_key_here\n4. Restart the dev server');
        return;
    }

    setStoryLevel('summary'); // Always open on summary view first
    setIsStoryOpen(true);

    // If we don't have this gauge's stories cached, fetch them all concurrently.
    if (!storyCache[selectedGauge.id]) {
        setIsStoryLoading(true);
        setError(null);
        try {
            // Fetch all three levels at once for a responsive UI
            const [summary, standard, detailed] = await Promise.all([
                getGaugeStory(selectedGauge, 'summary'),
                getGaugeStory(selectedGauge, 'standard'),
                getGaugeStory(selectedGauge, 'detailed'),
            ]);

            setStoryCache(prevCache => ({
                ...prevCache,
                [selectedGauge!.id]: { summary, standard, detailed }
            }));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsStoryOpen(false); // Close modal on error
        } finally {
            setIsStoryLoading(false);
        }
    }
  };

  const handleCloseStory = () => {
    setIsStoryOpen(false);
  };

  const handleStoryLevelChange = (newLevel: StoryLevel) => {
    // Simply update the level; the data is already pre-fetched.
    setStoryLevel(newLevel);
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900 text-white">
      <header className="absolute top-0 left-0 z-[1000] w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
        <h1 className="text-2xl md:text-4xl font-bold text-center text-shadow">Florida Flood Gauge Monitor</h1>
        <p className="text-center text-sm md:text-base text-gray-300">Powered by USGS & OpenStreetMap</p>
        {!isLoading && !error && gauges.length > 0 && (
          <div className="text-center mt-2">
            <span className="bg-blue-500/50 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full">
              Displaying {gauges.length} active gauges
            </span>
          </div>
        )}
      </header>

      <Map gauges={gauges} onGaugeClick={handleGaugeClick} />

      {isLoading && (
        <div className="absolute inset-0 bg-black/70 z-[2000] flex flex-col items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold">{loadingMessage}</p>
        </div>
      )}

      {error && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-800/90 text-white p-6 rounded-lg shadow-2xl z-[2001] border border-red-600">
            <h3 className="font-bold text-lg mb-2">An Error Occurred</h3>
            <p className="whitespace-pre-wrap">{error}</p>
            <button
                onClick={fetchInitialGauges}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Retry
            </button>
        </div>
      )}

      {selectedGauge && selectedGauge.historicalData && (
        <div 
          className="absolute inset-0 bg-black/60 z-[1500] flex items-end"
          onClick={closeChart}
        >
          <div 
            className="w-full bg-gray-800 rounded-t-2xl shadow-2xl p-4 md:p-6 transition-transform transform translate-y-0"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the panel
          >
            <div className="flex justify-between items-center mb-4 gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-blue-300 flex-1 truncate">{selectedGauge.name}</h2>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={handleOpenStory}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                   Story
                  </button>
                  <button 
                    onClick={closeChart}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close chart"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
              </div>
            </div>
            <div className="h-64 md:h-80">
              <GaugeChart data={selectedGauge.historicalData} gaugeName={selectedGauge.name} />
            </div>
          </div>
        </div>
      )}

      {isStoryOpen && selectedGauge && (
          <GaugeStory 
            gaugeName={selectedGauge.name}
            stories={storyCache[selectedGauge.id]}
            isLoading={isStoryLoading}
            onClose={handleCloseStory}
            level={storyLevel}
            onLevelChange={handleStoryLevelChange}
          />
      )}
    </div>
  );
};

export default App;