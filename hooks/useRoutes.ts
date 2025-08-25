import { useState } from 'react';
import { Route } from '../shared/types';
import { routes as defaultRoutes } from '../data/routes';

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>(defaultRoutes);

  const updateRoute = (routeId: string, updates: Partial<Route>) => {
    setRoutes(currentRoutes => 
      currentRoutes.map(route => 
        route.idRota === routeId ? { ...route, ...updates } : route
      )
    );
  };

  const resetRoutes = () => {
    setRoutes(defaultRoutes);
  };

  return {
    routes,
    updateRoute,
    resetRoutes
  };
}