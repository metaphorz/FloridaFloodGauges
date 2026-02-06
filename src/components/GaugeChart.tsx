import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { GaugeDataPoint } from '../types';

interface GaugeChartProps {
  data: GaugeDataPoint[];
  gaugeName: string;
}

// A custom tooltip to show both the relative change and the original elevation.
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="p-3 bg-gray-800/90 border border-gray-600 rounded-lg shadow-xl text-sm">
        <p className="label font-bold text-blue-300">{`${new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`}</p>
        <p className="mt-2 text-white">{`Level Change: ${dataPoint.normalizedLevel.toFixed(2)} ft`}</p>
        <p className="text-gray-400">{`(Elevation: ${dataPoint.originalLevel.toFixed(2)} ft)`}</p>
      </div>
    );
  }
  return null;
};


const GaugeChart: React.FC<GaugeChartProps> = ({ data, gaugeName }) => {

  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    const minLevel = Math.min(...data.map(d => d.level));
    return data.map(d => ({
      ...d,
      normalizedLevel: d.level - minLevel,
      originalLevel: d.level
    }));
  }, [data]);
  
  const yAxisDomain = useMemo(() => {
      if (!processedData || processedData.length === 0) return [0, 'auto'];
      const maxNormalizedLevel = Math.max(...processedData.map(d => d.normalizedLevel));
      // Add 20% padding to the top of the Y-axis for better visualization
      const topPadding = maxNormalizedLevel > 0.1 ? maxNormalizedLevel * 0.2 : 0.2;
      return [0, Number((maxNormalizedLevel + topPadding).toFixed(2))];
  }, [processedData]);


  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={processedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
        <XAxis 
          dataKey="date" 
          stroke="#A0AEC0" 
          tick={{ fontSize: 12 }} 
          tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        >
             <Label value="Date" offset={-15} position="insideBottom" fill="#A0AEC0" />
        </XAxis>
        <YAxis stroke="#A0AEC0" tick={{ fontSize: 12 }} domain={yAxisDomain}>
          <Label value="Water Level Change (ft)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#A0AEC0' }} />
        </YAxis>
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#90CDF4', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Legend wrapperStyle={{paddingTop: '20px'}} />
        <Line 
          type="monotone" 
          dataKey="normalizedLevel" 
          name={`${gaugeName} Level Change`}
          stroke="#38B2AC" 
          strokeWidth={2}
          activeDot={{ r: 8, fill: '#38B2AC' }} 
          dot={{ stroke: '#38B2AC', strokeWidth: 1, r: 4, fill: '#1A202C' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default GaugeChart;