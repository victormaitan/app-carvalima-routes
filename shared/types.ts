export interface LatLng {
  lat: number;
  lng: number;
}

export interface Stop extends LatLng {
  id: string;
  horarioChegada: string; // HH:mm
  horarioSaida: string;   // HH:mm
}

export interface Route {
  idRota: string;
  origem: LatLng;
  destino: LatLng;
  passaPor: Stop[]; // pontos intermediários com horários
  horarioSaida: string;   // HH:mm (origem)
  horarioChegada: string; // HH:mm (destino)
  steps?: google.maps.LatLng[];
  grupo?: string;
}

export interface VehicleMarker extends google.maps.marker.AdvancedMarkerElement {
  routeId?: string;
  route?: Route;
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  iconEl?: HTMLImageElement; // referência ao elemento de imagem para rotação/ancoragem
}