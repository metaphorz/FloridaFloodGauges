import React from 'react';
import { MapContainer, TileLayer, Marker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { FloodGauge } from '../types';

interface MapProps {
  gauges: FloodGauge[];
  onGaugeClick: (gauge: FloodGauge) => void;
}

// Define the custom icon using SVG in a DivIcon
const createCustomIcon = () => {
  return new L.DivIcon({
    html: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="6" cy="6" r="5" fill="#007BFF" stroke="white" stroke-width="1.5"/>
           </svg>`,
    className: 'bg-transparent border-0',
    iconSize: [12, 12],
    iconAnchor: [6, 6], // Point of the icon which will correspond to marker's location
  });
};

const customIcon = createCustomIcon();


const RecenterAutomatically = ({gauges} : {gauges: FloodGauge[]}) => {
    const map = useMap();
    React.useEffect(() => {
        if(gauges.length > 0) {
            const bounds = L.latLngBounds(gauges.map(g => [g.latitude, g.longitude]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [gauges, map]);
    return null;
}


const Map: React.FC<MapProps> = ({ gauges, onGaugeClick }) => {
  const floridaCenter: [number, number] = [27.994402, -81.760254];

  return (
    <MapContainer center={floridaCenter} zoom={7} scrollWheelZoom={true} className="h-full w-full z-10">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {gauges.map((gauge) => {
        const latestData = gauge.historicalData && gauge.historicalData.length > 0 
          ? gauge.historicalData[gauge.historicalData.length - 1] 
          : null;
        const currentLevel = latestData ? `${latestData.level.toFixed(2)} ft` : 'N/A';

        return (
          <Marker
            key={gauge.id}
            position={[gauge.latitude, gauge.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                onGaugeClick(gauge);
              },
            }}
          >
            <Tooltip sticky>
              <strong className="text-base">{gauge.name}</strong>
              <br />
              Current Elevation: {currentLevel}
            </Tooltip>
          </Marker>
        );
      })}
      <RecenterAutomatically gauges={gauges} />
    </MapContainer>
  );
};

export default Map;