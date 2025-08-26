import type { Route } from "./+types/home";
import App from "../App";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Route Simulator" },
    { name: "description", content: "Simulador de rotas interativo" },
  ];
}

export default function Home() {
  return <App />;
}
