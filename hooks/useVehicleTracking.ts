import { useState, useRef, useCallback } from 'react';
import { VehicleMarker } from '../shared/types';

function normalizeTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes
  );
}

function adjustTimeForMidnightCrossing(startTime: string, endTime: string, baseDate: Date): {
  start: Date;
  end: Date;
} {
  let start = normalizeTime(startTime, baseDate);
  let end = normalizeTime(endTime, baseDate);

  // If end time is before start time, it means the route crosses midnight
  if (end < start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

function normalizeSequentialTimes(timeStrs: string[], baseDate: Date): Date[] {
  const out: Date[] = [];
  let last: Date | null = null;
  for (const t of timeStrs) {
    let d = normalizeTime(t, baseDate);
    if (last && d < last) {
      // cruzou a meia-noite, adiciona 24h
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
    out.push(d);
    last = d;
  }
  return out;
}

function nearestDistanceAlongPath(
  target: { lat: number; lng: number },
  points: { lat: number; lng: number }[],
  cumDist: number[]
): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return 0;
  // Aproximação: usa projeção em coordenadas lat/lng para achar o ponto mais próximo em cada segmento
  let best = { dist2: Number.POSITIVE_INFINITY, along: 0 };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const ax = a.lat, ay = a.lng;
    const bx = b.lat, by = b.lng;
    const tx = target.lat, ty = target.lng;
    const vx = bx - ax;
    const vy = by - ay;
    const wx = tx - ax;
    const wy = ty - ay;
    const vv = vx * vx + vy * vy || 1e-12;
    // parâmetro t clamped [0,1]
    let t = (wx * vx + wy * vy) / vv;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const px = ax + vx * t;
    const py = ay + vy * t;
    const dx = tx - px;
    const dy = ty - py;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < best.dist2) {
      // distância ao longo acumulada até o ponto projetado
      const segLen = Math.max(1e-6, (function(p1, p2){
        const R = 6371000;
        const toRad = (v: number) => (v * Math.PI) / 180;
        const dLat = toRad(p2.lat - p1.lat);
        const dLng = toRad(p2.lng - p1.lng);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(p1.lat))*Math.cos(toRad(p2.lat))*Math.sin(dLng/2)**2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      })(a,b));
      const along = (cumDist[i] ?? 0) + t * segLen;
      best = { dist2, along };
    }
  }
  return best.along;
}

export function useVehicleTracking() {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState('00:00');
  const lastProgressRef = useRef<number>(0);
  const arrivedVehicles = useRef(new Set<string>());
  // Logs de paradas intermediárias por rota (controle de duplicidade)
  const stopLogsRef = useRef(new Map<string, { arrivals: Set<string>; departures: Set<string> }>());
  // Último timestamp simulado por rota (para detectar cruzamento de bordas)
  const routeLastTimeRef = useRef(new Map<string, number>());
  // Controle de log de saída da origem por rota
  const originDeparturesRef = useRef(new Set<string>());

  const addMessage = useCallback((message: string) => {
    setMessages((prev) => [...prev, `[${currentTime}] ${message}`]);
  }, [currentTime]);

  const updateVehiclePositions = useCallback((
    progress: number,
    markers: VehicleMarker[],
    selectedRoutes: Set<string>
  ) => {
    const baseDate = new Date(1970, 0, 1);

    // Reset de chegada apenas se o progresso voltar (reinício da simulação)
    if (progress < lastProgressRef.current) {
      arrivedVehicles.current.clear();
      stopLogsRef.current.clear();
      routeLastTimeRef.current.clear();
      originDeparturesRef.current.clear();
    }
    lastProgressRef.current = progress;

    // Progresso normalizado 0..1 para mapear a duração real da rota
    const progressFraction = Math.max(0, Math.min(1, progress / 100));

    // Calcula janela global de tempo entre a menor saída e a maior chegada das rotas selecionadas
    const bounds: { start: Date; end: Date }[] = [];
    markers.forEach((marker) => {
      if (!marker?.route || !marker.routeId || !selectedRoutes.has(marker.routeId)) return;
      const r = marker.route;
      const { start, end } = adjustTimeForMidnightCrossing(r.horarioSaida, r.horarioChegada, baseDate);
      bounds.push({ start, end });
    });
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;
    for (const b of bounds) {
      minStart = Math.min(minStart, b.start.getTime());
      maxEnd = Math.max(maxEnd, b.end.getTime());
    }
    const globalDuration = Math.max(0, maxEnd - minStart);
    const globalNow = new Date(minStart + progressFraction * globalDuration);

    // Usa o horário global como representativo para exibição
    let representativeTime: Date | null = globalNow;

    markers.forEach((marker) => {
      if (!marker?.route || !marker.routeId || !selectedRoutes.has(marker.routeId)) {
        return;
      }

      const route = marker.route;
      if (!route.steps?.length) {
        return;
      }

      const { start: routeStart, end: routeEnd } = adjustTimeForMidnightCrossing(
        route.horarioSaida,
        route.horarioChegada,
        baseDate
      );

      const durationMs = Math.max(0, routeEnd.getTime() - routeStart.getTime());

      // Calcula o tempo atual da rota ancorado no relógio global
      let routeCurrentTime = globalNow;
      // Antes de sair: fixa na origem; durante: usa global; após chegar: fixa no destino
      if (globalNow < routeStart) {
        routeCurrentTime = routeStart; // ainda não saiu
      } else if (globalNow > routeEnd) {
        routeCurrentTime = routeEnd; // já chegou
      }

      if (durationMs === 0 || progressFraction >= 1) {
        // Veículo chegou ao destino
        marker.position = route.destino;
        if (!arrivedVehicles.current.has(route.idRota)) {
          // Só loga chegada quando a rota cruzar seu próprio horário de chegada
          const timesSeq = normalizeSequentialTimes([
            route.horarioSaida,
            ...((Array.isArray((route as any).passaPor) ? route.passaPor : []) as any[]).flatMap((s) => [s.horarioChegada, s.horarioSaida]),
            route.horarioChegada
          ], baseDate);
          const destMs = timesSeq[timesSeq.length - 1]!.getTime();
          const lastMs = routeLastTimeRef.current.get(route.idRota) ?? null;
          const nowMs = globalNow.getTime();
          const crossedArrival = lastMs == null ? nowMs >= destMs : lastMs < destMs && nowMs >= destMs;
          if (crossedArrival) {
            addMessage(`Veículo ${route.idRota} chegou ao destino`);
            arrivedVehicles.current.add(route.idRota);
          }
        }
      } else if (progressFraction <= 0) {
        // Veículo na origem
        marker.position = route.origem;
      } else {
        // Veículo em rota - interpolação por distância ao longo do caminho (evita saltos longos)
        // Constrói o caminho incluindo origem e destino para evitar saltos iniciais/finais
        const rawPoints = [route.origem, ...route.steps.map((s) => s.toJSON()), route.destino];
        // Remove duplicados consecutivos
        const points: { lat: number; lng: number }[] = [];
        for (const p of rawPoints) {
          const last = points[points.length - 1];
          if (!last || last.lat !== p.lat || last.lng !== p.lng) {
            points.push(p);
          }
        }

        if (points.length < 2) {
          marker.position = points[0] ?? route.origem;
        } else {
          // Haversine para distância em metros
          const haversine = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
            const R = 6371000; // raio da Terra em metros
            const toRad = (v: number) => (v * Math.PI) / 180;
            const dLat = toRad(p2.lat - p1.lat);
            const dLng = toRad(p2.lng - p1.lng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          // Distância acumulada dos steps
          const cumDist: number[] = [0];
          for (let i = 1; i < points.length; i++) {
            const d = haversine(points[i - 1], points[i]);
            cumDist[i] = cumDist[i - 1] + d;
          }
          const totalDist = cumDist[cumDist.length - 1] ?? 0;

          if (totalDist <= 0) {
            // Todos os pontos iguais
            marker.position = points[0];
          } else {
            // Calcula posição baseada no cronograma de horários (origem -> paradas -> destino)
            const stops = Array.isArray((route as any).passaPor) ? route.passaPor : [];
            const locations = [route.origem, ...stops.map((s: any) => ({ lat: s.lat, lng: s.lng })), route.destino];
            let distAtLoc = locations.map((loc) => nearestDistanceAlongPath(loc, points, cumDist));
            // Garante monotonicidade para evitar retrocessos devido à projeção
            for (let i = 1; i < distAtLoc.length; i++) {
              distAtLoc[i] = Math.max(0, Math.max(distAtLoc[i], distAtLoc[i - 1]));
            }

            const timeStrs = [
              route.horarioSaida,
              ...stops.flatMap((s: any) => [s.horarioChegada, s.horarioSaida]),
              route.horarioChegada,
            ];
            const timesAbs = normalizeSequentialTimes(timeStrs, baseDate);
            const tNow = routeCurrentTime;

            // Inicializa estrutura de logs da rota
            if (!stopLogsRef.current.has(route.idRota)) {
              stopLogsRef.current.set(route.idRota, { arrivals: new Set<string>(), departures: new Set<string>() });
            }
            const logs = stopLogsRef.current.get(route.idRota)!;

            let fixedPos: { lat: number; lng: number } | null = null;
            let targetDist: number | null = null;

            // Log de saída da origem (dispara ao cruzar o horário de saída)
            const depOriginMs = timesAbs[0].getTime();
            const lastRouteMs = routeLastTimeRef.current.get(route.idRota) ?? null;
            const nowMsGlobal = globalNow.getTime();
            if (!originDeparturesRef.current.has(route.idRota)) {
              const crossedDeparture = lastRouteMs == null
                ? nowMsGlobal > depOriginMs
                : lastRouteMs < depOriginMs && nowMsGlobal >= depOriginMs;
              if (crossedDeparture) {
                addMessage(`Veículo ${route.idRota} saiu da origem`);
                originDeparturesRef.current.add(route.idRota);
              }
            }

            // Log de chegada ao destino por rota (independente do progresso global)
            if (!arrivedVehicles.current.has(route.idRota)) {
              const destMs = timesAbs[timesAbs.length - 1].getTime();
              const crossedArrival = lastRouteMs == null
                ? nowMsGlobal >= destMs
                : lastRouteMs < destMs && nowMsGlobal >= destMs;
              if (crossedArrival) {
                addMessage(`Veículo ${route.idRota} chegou ao destino`);
                arrivedVehicles.current.add(route.idRota);
              }
            }

            if (tNow <= timesAbs[0]) {
              fixedPos = locations[0];
            } else if (tNow >= timesAbs[timesAbs.length - 1]) {
              fixedPos = locations[locations.length - 1];
            } else {
              // Verifica se está no intervalo de parada (dwell) de alguma cidade
              const sCount = stops.length;
              let inDwell = false;

              // Último tempo simulado desta rota (para detectar cruzamentos de borda)
              const lastTimeMs = routeLastTimeRef.current.get(route.idRota) ?? null;
              const nowMs = globalNow.getTime();

              for (let j = 0; j < sCount; j++) {
                const tArr = timesAbs[2 * j + 1];
                const tDep = timesAbs[2 * j + 2];
                const arrMs = tArr.getTime();
                const depMs = tDep.getTime();

                // Dispara logs apenas quando cruzar a borda (evita spam por frame)
                if (lastTimeMs != null && lastTimeMs < arrMs && nowMs >= arrMs && !logs.arrivals.has(stops[j].id)) {
                  addMessage(`Veículo ${route.idRota} chegou em ${stops[j].id}`);
                  logs.arrivals.add(stops[j].id);
                }
                if (lastTimeMs != null && lastTimeMs < depMs && nowMs >= depMs && !logs.departures.has(stops[j].id)) {
                  addMessage(`Veículo ${route.idRota} saiu de ${stops[j].id}`);
                  logs.departures.add(stops[j].id);
                }

                if (tNow >= tArr && tNow < tDep) {
                  fixedPos = locations[j + 1]; // posição na cidade de parada
                  inDwell = true;
                  break;
                }
              }

              // Atualiza o último tempo desta rota após processar
              routeLastTimeRef.current.set(route.idRota, nowMs);

              // Caso não esteja parado, está em deslocamento entre dois pontos
              if (!inDwell) {
                for (let k = 0; k <= stops.length; k++) {
                  const tStart = timesAbs[2 * k];
                  const tEnd = timesAbs[2 * k + 1];
                  if (tNow >= tStart && tNow <= tEnd) {
                    const segDur = Math.max(1, tEnd.getTime() - tStart.getTime());
                    const frac = Math.max(0, Math.min(1, (tNow.getTime() - tStart.getTime()) / segDur));
                    const dStart = distAtLoc[k];
                    const dEnd = distAtLoc[k + 1];
                    targetDist = dStart + frac * Math.max(0, dEnd - dStart);
                    break;
                  }
                }
              }
            }

            if (fixedPos) {
              marker.position = fixedPos as any;
            } else if (targetDist != null) {
              // Encontra o segmento onde a distância alvo cai
              let seg = 0;
              while (seg < cumDist.length - 1 && cumDist[seg + 1] < targetDist) seg++;

              const segStart = points[seg];
              const segEnd = points[Math.min(seg + 1, points.length - 1)];
              const segLen = Math.max(1e-6, haversine(segStart, segEnd));
              const segStartDist = cumDist[seg];
              const t = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLen));

              const lat = segStart.lat + (segEnd.lat - segStart.lat) * t;
              const lng = segStart.lng + (segEnd.lng - segStart.lng) * t;
              marker.position = { lat, lng } as any;
            }
          }
        }
      }
    });

    // Atualiza o horário exibido usando a rota de maior duração
    if (representativeTime) {
      const formattedTime = representativeTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(formattedTime);
    }
  }, [addMessage]);

  return {
    messages,
    currentTime,
    updateVehiclePositions
  };
}