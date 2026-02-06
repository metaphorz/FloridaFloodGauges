import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { StoryLevel } from '../types';

interface GaugeStoryProps {
  gaugeName: string;
  stories: Partial<Record<StoryLevel, string>> | undefined;
  isLoading: boolean;
  onClose: () => void;
  level: StoryLevel;
  onLevelChange: (level: StoryLevel) => void;
}

const GaugeStory: React.FC<GaugeStoryProps> = ({ gaugeName, stories, isLoading, onClose, level, onLevelChange }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // State for position and size
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 672, height: 500 }); // Default: max-w-2xl, and a reasonable height
  
  // State for interaction
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Refs to store initial values on mouse down
  const dragStartRef = useRef<{ startX: number; startY: number; modalX: number; modalY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; modalW: number; modalH: number } | null>(null);

  // Center the modal on initial load
  useEffect(() => {
    const initialWidth = 672; // Corresponds to max-w-2xl
    const initialHeight = 500;
    setSize({ width: initialWidth, height: initialHeight });
    setPosition({
      x: (window.innerWidth - initialWidth) / 2,
      y: (window.innerHeight - initialHeight) / 2,
    });
  }, []);

  const handleDragMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      modalX: position.x,
      modalY: position.y,
    };
  };

  const handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent drag from firing
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      modalW: size.width,
      modalH: size.height,
    };
  };
  
  // Effect for handling mouse move and mouse up on the whole document
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;
        setPosition({
          x: dragStartRef.current.modalX + dx,
          y: dragStartRef.current.modalY + dy,
        });
      }

      if (isResizing && resizeStartRef.current) {
        const dw = e.clientX - resizeStartRef.current.startX;
        const dh = e.clientY - resizeStartRef.current.startY;
        const newWidth = Math.max(350, resizeStartRef.current.modalW + dw); // Min width
        const newHeight = Math.max(250, resizeStartRef.current.modalH + dh); // Min height
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.body.style.userSelect = '';
    };
    
    if(isDragging || isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
        document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, position.x, position.y, size.width, size.height]);

  const levels: { id: StoryLevel, name: string }[] = [
    { id: 'summary', name: 'Summary' },
    { id: 'standard', name: 'Standard' },
    { id: 'detailed', name: 'Detailed' },
  ];

  return (
    <div
      ref={modalRef}
      className="absolute bg-gray-800 text-white rounded-lg shadow-2xl flex flex-col z-[2100]"
      style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex justify-between items-center border-b border-gray-700 p-4 cursor-move flex-shrink-0"
        onMouseDown={handleDragMouseDown}
      >
          <h2 className="text-2xl font-bold text-blue-300 truncate">The Story of {gaugeName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close story">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
      </div>
      
      <div className="overflow-y-auto p-4 pr-3 flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg className="animate-spin h-8 w-8 text-blue-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-300">Generating the story with Gemini...</p>
          </div>
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {stories?.[level] ?? ''}
          </p>
        )}
      </div>
      <div className="border-t border-gray-700 p-4 flex-shrink-0 space-y-4">
          <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Detail Level</label>
              <div className="flex w-full rounded-lg bg-gray-900 p-1">
                  {levels.map(({ id, name }) => (
                  <button
                      key={id}
                      onClick={() => onLevelChange(id)}
                      className={`w-full rounded-md py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                      level === id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                      aria-pressed={level === id}
                  >
                      {name}
                  </button>
                  ))}
              </div>
          </div>
          <button 
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
              Close
          </button>
      </div>
       <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
      >
           <svg width="100%" height="100%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
              <path d="M12 0 L12 12 L0 12" stroke="currentColor" strokeWidth="2"/>
          </svg>
      </div>
    </div>
  );
};

export default GaugeStory;