import routesData from './routes.json';
import type { Route } from '../shared/types';

// Converte explicitamente o tipo para garantir compatibilidade
export const routes: Route[] = routesData as unknown as Route[];