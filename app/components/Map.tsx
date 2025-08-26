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
  
  const [mapLoading, setMapLoading] = useState(true);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  
  // Verifica se o Google Maps API está carregado (sem polling infinito)
  useEffect(() => {
    if (window.google?.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const onLoad = () => setGoogleMapsLoaded(true);
    const onError = () => console.error('Falha ao carregar Google Maps API');

    // Tenta usar a tag existente do index.html
    const existing = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js" ]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    // Fallback: injeta script caso não exista
    const script = document.createElement('script');
    const apiKey = (import.meta as any).env?.VITE_MAPS_KEY || '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry,marker`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, []);
  
  const { map, markers, directionsRenderers } = useMapSetup(mapRef, selectedRoutes, googleMapsLoaded);
  const { messages, currentTime, updateVehiclePositions } = useVehicleTracking();

  // Refs para evitar depender de objetos mutáveis em efeitos
  const markersRef = useRef(markers);
  const selectedRoutesRef = useRef(selectedRoutes);
  useEffect(() => { markersRef.current = markers; }, [markers]);
  useEffect(() => { selectedRoutesRef.current = selectedRoutes; }, [selectedRoutes]);
  // Refs para animação (evita re-execução por dependências)
  const sliderRef = useRef(sliderProgress);
  const playingRef = useRef(isPlaying);
  const loopingRef = useRef(isLooping);
  const animProgressRef = useRef(0);
  useEffect(() => { sliderRef.current = sliderProgress; }, [sliderProgress]);
  useEffect(() => { playingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { loopingRef.current = isLooping; }, [isLooping]);
  
  // Quando o mapa for carregado, desativa o estado de carregamento
  useEffect(() => {
    if (map) {
      console.log("Mapa inicializado com sucesso");
      setMapLoading(false);
    }
  }, [map]);

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
      const anyMarker = marker as any;
      const shouldShow = selectedRoutes.has(marker.routeId!);
      if (typeof anyMarker.setMap === 'function') {
        anyMarker.setMap(shouldShow ? map : null);
      } else {
        marker.map = shouldShow ? map! : null;
      }
    });
    directionsRenderers.forEach((renderer, index) => {
      renderer.setMap(selectedRoutes.has(routes[index].idRota) ? map : null);
    });
  }, [markers, directionsRenderers, map, selectedRoutes]);

  // Atualiza posições quando slider muda manualmente (não durante a animação)
  useEffect(() => {
    if (!playingRef.current && markersRef.current.length > 0) {
      updateVehiclePositions(sliderProgress, markersRef.current, selectedRoutesRef.current);
      animProgressRef.current = sliderProgress;
    }
  }, [sliderProgress, updateVehiclePositions]);

  // Update visibility when routes or markers change
  useEffect(() => {
    updateMarkerVisibility();
  }, [selectedRoutes, markers, updateMarkerVisibility]);

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
    sliderRef.current = progress;
    setSliderProgress(progress);
  };

  // Loop de animação por requestAnimationFrame: atualiza apenas refs e posições (sem setState no tick)
  useEffect(() => {
    if (!isPlaying) {
      lastTsRef.current = null;
      return;
    }

    let rafId: number;

    const tick = (ts: number) => {
      if (!playingRef.current) return; // early exit
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }
      const dt = ts - (lastTsRef.current ?? ts); // ms desde último frame
      lastTsRef.current = ts;

      const baseMsForFull = 60000; // 60s para 0->100
      const deltaProgress = (dt / baseMsForFull) * 100 * speed;

      // Atualiza a progressão da animação e clampa
      let next = animProgressRef.current + deltaProgress;
      if (next >= 100) {
        if (loopingRef.current) {
          next = next % 100;
        } else {
          next = 100;
        }
      }
      animProgressRef.current = next;

      // Move veículos diretamente com o progresso atual (sem setState)
      if (markersRef.current.length > 0) {
        updateVehiclePositions(next, markersRef.current, selectedRoutesRef.current);
      }

      // Continua enquanto playing
      if (playingRef.current && !(next === 100 && !loopingRef.current)) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, updateVehiclePositions]);

  // Sincroniza o slider com a animação em um intervalo leve (10x/s) quando tocando
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      // Avança o slider visível sem causar loop nos efeitos (é só espelho visual)
      const progress = animProgressRef.current;
      setSliderProgress(progress);
      // Auto-stop: ao atingir 100% sem loop, atualiza o estado do play/pause
      if (!loopingRef.current && progress >= 100) {
        setIsPlaying(false);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying]);

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

      <div className="flex-1 flex flex-col">
        <div className='h-screen' style={{position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%', backgroundColor: '#e0e0e0' }} />
          {mapLoading && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 10
            }}>
              <div style={{ color: 'white', textAlign: 'center' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg">Carregando mapa... {googleMapsLoaded ? '(API carregada)' : '(API não carregada)'}</p>
              </div>
            </div>
          )}
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