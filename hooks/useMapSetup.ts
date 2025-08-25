import { useEffect, useState } from 'react';
import { VehicleMarker } from '../shared/types';
import { routes } from '../data/routes';
import truckColor from '../truckColor.png';
import truckBlack from '../truckBlack.png';

export function useMapSetup(
  mapRef: React.RefObject<HTMLDivElement>,
  selectedRoutes: Set<string>
) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<VehicleMarker[]>([]);
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);

  useEffect(() => {
    if (!mapRef.current || !routes.length) return;

    const defaultCenter = { lat: -15.6787019, lng: -56.0445861 }; // CGB coordinates

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

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: route.origem,
        map: selectedRoutes.has(route.idRota) ? mapInstance : null,
        content: img,
        collisionBehavior: google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
      }) as VehicleMarker;
      marker.iconEl = img;

      marker.routeId = route.idRota;
      marker.route = route;
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
          }
        }
      );
    });

    setMarkers(newMarkers);
    setDirectionsRenderers(newRenderers);

    return () => {
      newMarkers.forEach((marker) => {
        marker.map = null;
      });
      newRenderers.forEach((renderer) => renderer.setMap(null));
    };
  }, [mapRef, selectedRoutes]);

  return { map, markers, directionsRenderers };
}