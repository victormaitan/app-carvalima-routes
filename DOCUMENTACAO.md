# Documentação - Sistema de Simulação de Rotas de Veículos

## Visão Geral
Esta aplicação é um simulador de rastreamento de veículos em tempo real que permite visualizar o movimento de veículos em rotas pré-definidas usando Google Maps. O sistema oferece duas visualizações principais: um mapa interativo com simulação temporal e um editor de rotas.

## Estrutura do Projeto

### Arquivos Principais

#### `/src/App.tsx`
**Função:** Componente principal da aplicação
- Gerencia a navegação entre as duas visualizações principais (Mapa e Editor de Rotas)
- Controla o estado `currentView` que define qual componente será renderizado
- Fornece a estrutura de navegação superior com botões para alternar entre visualizações

#### `/src/main.tsx`
**Função:** Ponto de entrada da aplicação React

### Tipos e Interfaces (`/src/shared/types.ts`)

#### `LatLng`
Interface para representar coordenadas geográficas:
```typescript
{
  lat: number;  // Latitude
  lng: number;  // Longitude
}
```

#### `Route`
Interface para representar uma rota de veículo:
```typescript
{
  idRota: string;           // Identificador único da rota
  origem: LatLng;           // Coordenadas do ponto de origem
  destino: LatLng;          // Coordenadas do ponto de destino
  passaPor: LatLng[];       // Array de pontos intermediários (waypoints)
  horarioSaida: string;     // Horário de saída (formato HH:MM)
  horarioChegada: string;   // Horário de chegada (formato HH:MM)
  steps?: google.maps.LatLng[]; // Steps da rota calculados pelo Google Maps
  grupo?: string;           // Grupo ao qual a rota pertence (opcional)
}
```

#### `VehicleMarker`
Interface que estende o AdvancedMarkerElement do Google Maps:
```typescript
{
  routeId?: string;         // ID da rota associada ao marcador
  route?: Route;            // Objeto da rota completa
  position: google.maps.LatLngLiteral; // Posição atual do marcador
  map: google.maps.Map | null;         // Instância do mapa
}
```

## Hooks Personalizados

### `useMapSetup()` (`/src/hooks/useMapSetup.ts`)
**Função:** Configura e gerencia a instância do Google Maps e seus elementos

**Parâmetros:**
- `mapRef`: Referência para o elemento HTML do mapa
- `selectedRoutes`: Set com IDs das rotas selecionadas para exibição

**Retorna:**
- `map`: Instância do Google Maps
- `markers`: Array de marcadores de veículos
- `directionsRenderers`: Array de renderizadores de direções

**Funcionalidades:**
- Inicializa o mapa Google Maps com estilo personalizado centralizado em Cuiabá-MT
- Cria marcadores personalizados para cada rota com ícones diferentes baseados no ID
- Configura renderizadores de direções para desenhar as rotas no mapa
- Calcula os steps das rotas usando DirectionsService
- Gerencia a visibilidade dos elementos baseado nas rotas selecionadas
- Implementa cleanup quando o componente é desmontado

### `useVehicleTracking()` (`/src/hooks/useVehicleTracking.ts`)
**Função:** Gerencia o rastreamento temporal dos veículos e mensagens do sistema

**Retorna:**
- `messages`: Array de mensagens do sistema com timestamp
- `currentTime`: Horário atual da simulação (formato HH:MM)
- `updateVehiclePositions`: Função para atualizar posições dos veículos

**Funcionalidades Internas:**

#### `normalizeTime(timeStr: string, baseDate: Date): Date`
- Converte string de horário (HH:MM) para objeto Date usando uma data base
- Útil para cálculos temporais consistentes

#### `adjustTimeForMidnightCrossing(startTime: string, endTime: string, baseDate: Date)`
- Ajusta horários que atravessam meia-noite (ex: 23:00 - 01:00)
- Adiciona 24 horas ao horário de chegada quando necessário
- Retorna objetos Date normalizados para início e fim

#### `updateVehiclePositions(progress: number, markers: VehicleMarker[], selectedRoutes: Set<string>)`
- Atualiza posições dos veículos baseado no progresso temporal (0-100%)
- Simula 48 horas de operação (24h + 24h para rotas que atravessam meia-noite)
- Calcula posição atual de cada veículo baseado no horário:
  - **Antes do horário de saída:** Veículo permanece na origem
  - **Durante o trajeto:** Calcula posição interpolada nos steps da rota
  - **Após horário de chegada:** Veículo fica no destino
- Gerencia mensagens de chegada (evita duplicatas)
- Reseta estado quando a simulação é reiniciada (progress diminui)

### `useRoutes()` (`/src/hooks/useRoutes.ts`)
**Função:** Gerencia o estado e operações das rotas

**Retorna:**
- `routes`: Array de rotas atuais
- `updateRoute`: Função para atualizar uma rota específica
- `resetRoutes`: Função para resetar para as rotas padrão

**Funcionalidades:**
- Carrega rotas padrão do arquivo de dados
- Permite atualizações parciais de rotas específicas
- Fornece função de reset para voltar ao estado original

## Componentes

### `Map` (`/src/components/Map.tsx`)
**Função:** Componente principal da visualização do mapa

**Funcionalidades:**
- Integra os hooks useMapSetup e useVehicleTracking
- Gerencia seleção de rotas visíveis
- Controla o slider temporal para simulação
- Fornece função de compartilhamento via URL
- Layout responsivo com painel lateral e controles

**Estrutura:**
- **Painel Esquerdo (384px):** Seletor de rotas e painel de mensagens
- **Área Principal:** Mapa do Google Maps
- **Barra Inferior:** Controle deslizante temporal

### `RoutesManager` (`/src/components/RoutesManager.tsx`)
**Função:** Interface de edição e gerenciamento de rotas

**Funcionalidades:**
- Lista todas as rotas carregadas do JSON
- Permite edição de campos individuais de cada rota:
  - ID da rota
  - Horários de saída e chegada
  - Coordenadas de origem e destino
- Adiciona novas rotas com template padrão
- Remove rotas existentes
- Salva alterações (atualmente apenas log no console)

### `TimeSlider` (`/src/components/TimeSlider.tsx`)
**Função:** Controle deslizante para navegação temporal

**Parâmetros:**
- `onTimeChange`: Callback para mudanças de progresso
- `currentTime`: Horário atual para exibição

**Funcionalidades:**
- Slider customizado com indicador visual de progresso
- Atualização em tempo real do background baseado na posição
- Exibição do horário atual formatado
- Detecção de interação do usuário (arrastar)

### `RouteSelector` (`/src/components/RouteSelector.tsx`)
**Função:** Interface para seleção de rotas visíveis no mapa

**Funcionalidades:**
- Lista checkboxes para cada rota disponível
- Permite seleção/deseleção de rotas individuais
- Integração com o estado de rotas selecionadas do Map

### `MessagePanel` (`/src/components/MessagePanel.tsx`)
**Função:** Painel de exibição de mensagens do sistema

**Funcionalidades:**
- Exibe mensagens de eventos da simulação (chegadas de veículos)
- Auto-scroll para mensagens mais recentes
- Formatação com timestamps

## Dados

### `/src/data/routes/`
**Estrutura de dados das rotas:**
- `routes.json`: Arquivo JSON com definições de rotas
- `routes.ts`: Processamento e exportação dos dados
- `index.ts`: Barrel export para facilitar importações

## Fluxo de Funcionamento

### 1. Inicialização
1. App.tsx renderiza Map.tsx por padrão
2. Map.tsx inicializa useMapSetup e useVehicleTracking
3. useMapSetup cria mapa, marcadores e rotas do Google Maps
4. Todas as rotas são selecionadas por padrão

### 2. Simulação Temporal
1. Usuário move o slider TimeSlider
2. TimeSlider chama onTimeChange com novo progresso (0-100%)
3. updateVehiclePositions calcula horário atual baseado no progresso
4. Para cada veículo, calcula posição baseada no horário:
   - Antes de sair: origem
   - Em trânsito: posição interpolada nos steps
   - Chegou: destino
5. Mensagens são adicionadas quando veículos chegam

### 3. Gerenciamento de Rotas
1. Usuário pode alternar para RouteEditor via navegação
2. RoutesManager permite editar dados das rotas
3. Mudanças são salvas localmente (sem persistência atual)

### 4. Seleção de Rotas
1. RouteSelector permite escolher quais rotas exibir
2. Mudanças atualizam selectedRoutes no Map
3. useMapSetup reage às mudanças ocultando/exibindo elementos do mapa

## Características Técnicas

### Performance
- Uso de useCallback para otimizar re-renders
- Refs para evitar re-cálculos desnecessários
- Cleanup de recursos do Google Maps

### Responsividade
- Layout flexível com CSS Grid e Flexbox
- Painel lateral fixo com área principal adaptável

### Integração Google Maps
- Uso da API mais recente (AdvancedMarkerElement)
- Estilos customizados do mapa
- DirectionsService para cálculo de rotas reais

### Estado e Dados
- Estado local com hooks useState
- Comunicação entre componentes via props e callbacks
- Dados estáticos carregados de JSON

## Possíveis Melhorias

1. **Persistência:** Salvar alterações de rotas em backend
2. **Tempo Real:** WebSocket para dados ao vivo
3. **Filtros Avançados:** Por horário, grupo, status
4. **Histórico:** Replay de rotas passadas
5. **Métricas:** Análise de performance das rotas
6. **Mobile:** Otimização para dispositivos móveis