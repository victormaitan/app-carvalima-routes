import React, { useState, useMemo } from 'react';
import { Route } from '../shared/types';
import { CheckSquare, Search, X } from 'lucide-react';

interface RouteSelectorProps {
  routes: Route[];
  selectedRoutes: Set<string>;
  onRouteToggle: (routeId: string) => void;
}

export default function RouteSelector({ routes, selectedRoutes, onRouteToggle }: RouteSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => 
      route.idRota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.grupo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [routes, searchTerm]);

  const handleSelectAll = () => {
    routes.forEach(route => {
      if (!selectedRoutes.has(route.idRota)) {
        onRouteToggle(route.idRota);
      }
    });
  };

  const handleUnselectAll = () => {
    routes.forEach(route => {
      if (selectedRoutes.has(route.idRota)) {
        onRouteToggle(route.idRota);
      }
    });
  };

  const handleSelectCGBStart = () => {
    routes.forEach(route => {
      if (route.idRota.startsWith('CGB-') && !selectedRoutes.has(route.idRota)) {
        onRouteToggle(route.idRota);
      }
    });
  };

  const handleSelectCGBEnd = () => {
    routes.forEach(route => {
      if (route.idRota.endsWith('-CGB') && !selectedRoutes.has(route.idRota)) {
        onRouteToggle(route.idRota);
      }
    });
  };

  return (
    <div className="p-3 sm:p-4 bg-gray-800 h-full overflow-hidden flex flex-col">
      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar rota..."
          className="w-full bg-gray-700 text-white px-3 sm:px-4 py-2 pr-9 sm:pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSelectAll}
            className="px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
          >
            Selecionar Todos
          </button>
          <button
            onClick={handleUnselectAll}
            className="px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
          >
            Desmarcar Todos
          </button>
          <button
            onClick={handleSelectCGBStart}
            className="px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
          >
            Saída de CGB
          </button>
          <button
            onClick={handleSelectCGBEnd}
            className="px-2.5 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
          >
            Chegada em CGB
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredRoutes.map((route) => (
            <label
              key={route.idRota}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedRoutes.has(route.idRota)}
                onChange={() => onRouteToggle(route.idRota)}
                className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
              />
              <span className="text-xs sm:text-sm">{route.idRota} <span className="text-gray-400">{route.grupo}</span></span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}