import React, { useState, useEffect } from 'react';
import { routes } from '../data/routes';

// Define the Route interface based on the actual JSON structure
interface Route {
  idRota: string;
  origem: {
    lat: number;
    lng: number;
  };
  destino: {
    lat: number;
    lng: number;
  };
  horarioSaida: string;
  horarioChegada: string;
  passaPor: any[];
}

const RoutesManager: React.FC = () => {
  // State to hold the routes data
  const [routesData, setRoutesData] = useState<Route[]>([]);

  // Load the routes data from the JSON file when the component mounts
  useEffect(() => {
    setRoutesData(routes);
  }, []);

  // Handle input changes for text fields
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: keyof Route) => {
    const { value } = e.target;
    const list = [...routesData];
    list[index] = { ...list[index], [field]: value };
    setRoutesData(list);
  };

  // Handle input changes for coordinates
  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, location: 'origem' | 'destino', coord: 'lat' | 'lng') => {
    const { value } = e.target;
    const list = [...routesData];
    list[index] = {
      ...list[index],
      [location]: {
        ...list[index][location],
        [coord]: parseFloat(value) || 0
      }
    };
    setRoutesData(list);
  };

  // Add a new route
  const addNewRoute = () => {
    const newRoute: Route = {
      idRota: `NEW-${Date.now()}`,
      origem: { lat: 0, lng: 0 },
      destino: { lat: 0, lng: 0 },
      horarioSaida: "00:00",
      horarioChegada: "00:00",
      passaPor: []
    };
    setRoutesData([...routesData, newRoute]);
  };

  // Remove a route
  const removeRoute = (index: number) => {
    const list = [...routesData];
    list.splice(index, 1);
    setRoutesData(list);
  };

  // Save the updated routes data
  const handleSave = () => {
    // In a real application, you would send this data to a server to update the JSON file.
    // For this example, we'll just log it to the console.
    console.log('Updated routes:', JSON.stringify(routesData, null, 2));
    alert('Routes saved! Check the console for the updated data.');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Routes Manager</h2>
        <div className="space-x-2">
          <button
            onClick={addNewRoute}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add New Route
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Save All Routes
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {routesData.map((route, index) => (
          <div key={route.idRota} className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Route: {route.idRota}</h3>
              <button
                onClick={() => removeRoute(index)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Route ID */}
              <div className="space-y-2">
                <label className="block">
                  <span className="text-gray-700 font-medium">Route ID:</span>
                  <input
                    type="text"
                    value={route.idRota}
                    onChange={(e) => handleTextChange(e, index, 'idRota')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
                
                <label className="block">
                  <span className="text-gray-700 font-medium">Departure Time:</span>
                  <input
                    type="time"
                    value={route.horarioSaida}
                    onChange={(e) => handleTextChange(e, index, 'horarioSaida')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
                
                <label className="block">
                  <span className="text-gray-700 font-medium">Arrival Time:</span>
                  <input
                    type="time"
                    value={route.horarioChegada}
                    onChange={(e) => handleTextChange(e, index, 'horarioChegada')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Origin</h4>
                <label className="block">
                  <span className="text-gray-600">Latitude:</span>
                  <input
                    type="number"
                    step="any"
                    value={route.origem.lat}
                    onChange={(e) => handleCoordinateChange(e, index, 'origem', 'lat')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
                
                <label className="block">
                  <span className="text-gray-600">Longitude:</span>
                  <input
                    type="number"
                    step="any"
                    value={route.origem.lng}
                    onChange={(e) => handleCoordinateChange(e, index, 'origem', 'lng')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Destination</h4>
                <label className="block">
                  <span className="text-gray-600">Latitude:</span>
                  <input
                    type="number"
                    step="any"
                    value={route.destino.lat}
                    onChange={(e) => handleCoordinateChange(e, index, 'destino', 'lat')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
                
                <label className="block">
                  <span className="text-gray-600">Longitude:</span>
                  <input
                    type="number"
                    step="any"
                    value={route.destino.lng}
                    onChange={(e) => handleCoordinateChange(e, index, 'destino', 'lng')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-2 border"
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {routesData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No routes found. Add a new route to get started.</p>
        </div>
      )}
    </div>
  );
};

export default RoutesManager;
