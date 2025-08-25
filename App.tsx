import { useState } from 'react';
import Map from './components/Map';
import RoutesManager from './components/RoutesManager';

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'editor'>('map');
  return (
    <div className="min-h-screen bg-gray-800">
      <nav className="bg-blue-900 text-white p-">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Route Simulator</h1>
          <div className="space-x-4">
            <button
              onClick={() => setCurrentView('map')}
              className={`px-4 py-2 rounded ${
                currentView === 'map'
                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                  : 'bg-blue-500 hover:bg-blue-800'
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => setCurrentView('editor')}
              className={`px-4 py-2 rounded ${
                currentView === 'editor'
                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                  : 'bg-blue-500 hover:bg-blue-800'
              }`}
            >
              Editor de Rotas
            </button>
          </div>
        </div>
      </nav>
      
      <main className="mx-auto">
        {currentView === 'map' ? <Map /> : <RoutesManager />}
      </main>
    </div>
  );
}

export default App;