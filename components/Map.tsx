import React, { useRef, useState, useEffect, useCallback } from 'react';
import { routes } from '../data/routes'; // barrel ajustado para src/data/routes/index.ts
import MessagePanel from './MessagePanel';
import TimeSlider from './TimeSlider';
import RouteSelector from './RouteSelector';
import { useMapSetup } from '../hooks/useMapSetup';
import { useVehicleTracking } from '../hooks/useVehicleTracking';
import { Share2 } from 'lucide-react';

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedRoutes, setSelectedRoutes] = useState(() => new Set(routes.map(r => r.idRota)));
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5x, 1x, 2x, 4x
  const [isLooping, setIsLooping] = useState(false);
  const lastTsRef = useRef<number | null>(null);
  
  const { map, markers, directionsRenderers } = useMapSetup(mapRef, selectedRoutes);
  const { messages, currentTime, updateVehiclePositions } = useVehicleTracking();

  // Fallback de horário para evitar iniciar em "00:00" antes da 1ª atualização do hook
  const displayTime = React.useMemo(() => {
    // Se o hook já calculou um horário válido, usa-o
    if (currentTime && currentTime !== '00:00') return currentTime;

    // Caso contrário, calcula com base nas rotas selecionadas e no progresso atual
    const baseDate = new Date(1970, 0, 1);
    const normalizeTime = (timeStr: string, base: Date) => {
      const [h, m] = timeStr.split(':').map(Number);
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    };
    const adjustTimeForMidnightCrossing = (startTime: string, endTime: string, base: Date) => {
      let start = normalizeTime(startTime, base);
      let end = normalizeTime(endTime, base);
      if (end < start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      return { start, end };
    };

    let representative: Date | null = null;
    let maxDuration = -1;
    const fraction = Math.max(0, Math.min(1, sliderProgress / 100));

    for (const r of routes) {
      if (!selectedRoutes.has(r.idRota)) continue;
      const { start, end } = adjustTimeForMidnightCrossing(r.horarioSaida, r.horarioChegada, baseDate);
      const dur = Math.max(0, end.getTime() - start.getTime());
      const t = new Date(start.getTime() + dur * fraction);
      if (dur > maxDuration) {
        maxDuration = dur;
        representative = t;
      }
    }

    const formatted = representative
      ? representative.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      : '00:00';
    return formatted;
  }, [currentTime, selectedRoutes, sliderProgress]);

  const updateMarkerVisibility = useCallback(() => {
    markers.forEach((marker) => {
      marker.map = selectedRoutes.has(marker.routeId!) ? map : null;
    });
    directionsRenderers.forEach((renderer, index) => {
      renderer.setMap(selectedRoutes.has(routes[index].idRota) ? map : null);
    });
  }, [markers, directionsRenderers, map, selectedRoutes]);

  // Initial position update and whenever sliderProgress changes
  useEffect(() => {
    if (markers.length > 0) {
      updateMarkerVisibility();
      updateVehiclePositions(sliderProgress, markers, selectedRoutes);
    }
  }, [markers, selectedRoutes, updateMarkerVisibility, sliderProgress, updateVehiclePositions]);

  // Update visibility when routes change
  useEffect(() => {
    updateMarkerVisibility();
  }, [selectedRoutes, updateMarkerVisibility]);

  const handleRouteToggle = (routeId: string) => {
    setSelectedRoutes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const handleTimeChange = (progress: number) => {
    // Apenas atualiza o estado; o efeito abaixo cuidará de atualizar as posições
    setSliderProgress(progress);
  };

  // Loop de animação por requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      lastTsRef.current = null;
      return;
    }

    let rafId: number;

    const tick = (ts: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }
      const dt = ts - lastTsRef.current; // ms desde último frame
      lastTsRef.current = ts;

      // Avança de 100% em 60s na velocidade 1x (ajustável)
      const baseMsForFull = 60000; // 60s para 0->100
      const deltaProgress = (dt / baseMsForFull) * 100 * speed;
      setSliderProgress(prev => {
        let next = prev + deltaProgress;
        if (next >= 100) {
          if (isLooping) {
            // volta para o início mantendo o excesso de progresso
            next = next % 100;
          } else {
            next = 100;
            setIsPlaying(false);
          }
        }
        return next;
      });

      if (isPlaying) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, markers, selectedRoutes, updateVehiclePositions]);

  const handleShare = () => {
    const routesParam = Array.from(selectedRoutes).join(',');
    const url = `${window.location.origin}${window.location.pathname}?routes=${routesParam}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col md:flex-row">
      <div className="w-full md:w-96 flex flex-col border-gray-700 border-b md:border-b-0 md:border-r max-h-[50vh] md:max-h-none overflow-hidden">
        <div className="flex-none h-[260px] sm:h-[340px] md:h-[400px] border-b border-gray-700">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold">Rotas Ativas</h2>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Compartilhar rotas selecionadas"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <RouteSelector
            routes={routes}
            selectedRoutes={selectedRoutes}
            onRouteToggle={handleRouteToggle}
          />
        </div>
        
        <div className="flex-1 min-h-0">
          <MessagePanel messages={messages} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative min-h-0">
          <div ref={mapRef} className="absolute inset-0" />
        </div>
        
        <div className="flex-none h-20 sm:h-24 border-t border-gray-700">
          <div className="h-full bg-gray-800 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (sliderProgress >= 100) setSliderProgress(0);
                setIsPlaying((p) => !p);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              {isPlaying ? 'Pausar' : 'Iniciar'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Velocidade</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-gray-700 rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
              <label className="flex items-center gap-2 ml-4 select-none">
                <input
                  type="checkbox"
                  checked={isLooping}
                  onChange={(e) => setIsLooping(e.target.checked)}
                  className="accent-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300">Loop</span>
              </label>
            </div>
            <div className="flex-1">
              <TimeSlider progress={sliderProgress} onTimeChange={handleTimeChange} currentTime={displayTime} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}