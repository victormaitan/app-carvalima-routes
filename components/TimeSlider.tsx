import React, { useEffect, useRef } from 'react';

interface TimeSliderProps {
  progress: number; // 0..100 controlado
  onTimeChange: (progress: number) => void;
  currentTime: string;
}

export default function TimeSlider({ progress, onTimeChange, currentTime }: TimeSliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleMouseDown = () => {
      isDraggingRef.current = true;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    slider.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    // Atualiza o gradiente quando o progresso muda programaticamente (animação)
    updateSliderBackground(progress);
  }, [progress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onTimeChange(value);
    updateSliderBackground(value);
  };

  const updateSliderBackground = (value: number) => {
    if (sliderRef.current) {
      sliderRef.current.style.background = `linear-gradient(to right, #24adf3 0%, #1d4ed8 ${value}%, #374151 ${value}%, #374151 100%)`;
    }
  };

  return (
    <div className="h-full bg-gray-800 p-3 sm:p-6 flex items-center">
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          className="w-full sm:flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-colors"
          onChange={handleChange}
          style={{
            background: 'linear-gradient(to right, #24adf3 0%, #1d4ed8 0%, #374151 0%, #374151 100%)'
          }}
        />
        <div className="text-base sm:text-lg font-mono min-w-[64px] sm:min-w-[80px] text-center sm:text-right">
          {currentTime}
        </div>
      </div>
    </div>
  );
}