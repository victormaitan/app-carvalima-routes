import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import type { Route } from '../shared/types';

interface RouteEditorProps {
  route: Route;
  onSave: (updatedRoute: Route) => void;
  onClose: () => void;
}

export default function RouteEditor({ route, onSave, onClose }: RouteEditorProps) {
  const [editedRoute, setEditedRoute] = useState<Route>({ ...route });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedRoute);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Editar Rota {route.idRota}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Horário de Saída</label>
            <input
              type="time"
              value={editedRoute.horarioSaida}
              onChange={(e) => setEditedRoute({ ...editedRoute, horarioSaida: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Horário de Chegada</label>
            <input
              type="time"
              value={editedRoute.horarioChegada}
              onChange={(e) => setEditedRoute({ ...editedRoute, horarioChegada: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Latitude Origem</label>
            <input
              type="number"
              step="any"
              value={editedRoute.origem.lat}
              onChange={(e) => setEditedRoute({
                ...editedRoute,
                origem: { ...editedRoute.origem, lat: Number(e.target.value) }
              })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Longitude Origem</label>
            <input
              type="number"
              step="any"
              value={editedRoute.origem.lng}
              onChange={(e) => setEditedRoute({
                ...editedRoute,
                origem: { ...editedRoute.origem, lng: Number(e.target.value) }
              })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Latitude Destino</label>
            <input
              type="number"
              step="any"
              value={editedRoute.destino.lat}
              onChange={(e) => setEditedRoute({
                ...editedRoute,
                destino: { ...editedRoute.destino, lat: Number(e.target.value) }
              })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Longitude Destino</label>
            <input
              type="number"
              step="any"
              value={editedRoute.destino.lng}
              onChange={(e) => setEditedRoute({
                ...editedRoute,
                destino: { ...editedRoute.destino, lng: Number(e.target.value) }
              })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}