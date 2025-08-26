import { useEffect, useState } from 'react';
import type { VehicleMarker } from '../shared/types';
import { routes } from '../data/routes';

// Importações de imagens com URL direta para evitar problemas de build
const truckColor = new URL('../truckColor.png', import.meta.url).href;
const truckBlack = new URL('../truckBlack.png', import.meta.url).href;

export function useMapSetup(
  mapRef: React.RefObject<HTMLDivElement | null>,
  selectedRoutes: Set<string>,
  googleMapsLoaded: boolean = false
) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<VehicleMarker[]>([]);
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);

  useEffect(() => {
    if (!mapRef.current || !googleMapsLoaded) return;
    
    console.log("Inicializando mapa...");
    
    const defaultCenter = { lat: -15.6787019, lng: -56.0445861 }; // CGB coordinates

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 6,
        center: defaultCenter,
        mapId: 'vehicle-tracking-map',
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#cadded' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f2f5f7' }]
          },
        ]
      });

    setMap(mapInstance);

    const newMarkers: VehicleMarker[] = [];
    const newRenderers: google.maps.DirectionsRenderer[] = [];

    routes.forEach((route) => {
      try {
        // Usa um <img> com transform origin central para evitar deslocamento
        const img = document.createElement('img');
        img.width = 36;
        img.height = 36;
        img.style.transformOrigin = '50% 50%';
        img.style.userSelect = 'none';
        img.style.pointerEvents = 'none';
        img.style.transform = 'translateY(2px)';
        img.src = route.idRota.startsWith('CGB-')
          ? truckColor
          : truckBlack;

        // Usa AdvancedMarkerElement para permitir atualização direta de position/map
        console.log("Criando marcador para rota:", route.idRota);
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: route.origem,
          map: selectedRoutes.has(route.idRota) ? mapInstance : null,
          content: img,
        }) as unknown as VehicleMarker;
        (marker as any).routeId = route.idRota;
        (marker as any).route = route;
        (marker as any).iconEl = img;
        newMarkers.push(marker);

        const renderer = new google.maps.DirectionsRenderer({
          map: selectedRoutes.has(route.idRota) ? mapInstance : null,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#24adf3',
            strokeWeight: 6,
          }
        });
        newRenderers.push(renderer);

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: route.origem,
            destination: route.destino,
            waypoints: route.passaPor.map((point) => ({ location: point })),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (response, status) => {
            if (status === 'OK' && response) {
              renderer.setDirections(response);
              const steps: google.maps.LatLng[] = [];
              // Coleta todos os passos de todos os legs (origem -> waypoints -> destino)
              response.routes[0].legs.forEach((leg) => {
                leg.steps.forEach((step) => {
                  step.path.forEach((point) => steps.push(point));
                });
              });
              route.steps = steps;
            } else {
              console.error(`Erro ao calcular rota ${route.idRota}: ${status}`);
              // Fallback: usa segmentos diretos (origem -> paradas -> destino)
              const sequence = [route.origem, ...route.passaPor, route.destino];
              route.steps = sequence.map((p) => new google.maps.LatLng(p.lat, p.lng));
              // Desenha polyline simples para visualização
              const polyline = new google.maps.Polyline({
                path: sequence,
                strokeColor: '#24adf3',
                strokeWeight: 4,
                map: selectedRoutes.has(route.idRota) ? mapInstance : null,
              });
              // Mantém renderer desligado nesse caso
            }
          }
        );
      } catch (error) {
        console.error(`Erro ao processar rota ${route.idRota}:`, error);
      }
    });

    setMarkers(newMarkers);
    setDirectionsRenderers(newRenderers);

    return () => {
      newMarkers.forEach((marker) => {
        if (marker.map) {
          marker.map = null;
        }
      });
      newRenderers.forEach((renderer) => {
        if (renderer) {
          renderer.setMap(null);
        }
      });
    };
    
    } catch (error) {
      console.error("Erro ao inicializar o mapa:", error);
    }
  }, [mapRef, selectedRoutes, googleMapsLoaded]);

  return { map, markers, directionsRenderers };
}