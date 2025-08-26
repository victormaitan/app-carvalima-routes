import type { LoaderFunctionArgs } from "react-router";

// Captura solicitações para /.well-known/appspecific/*
export const loader = async ({ params }: LoaderFunctionArgs) => {
  return Response.json({});
};

export default function WellKnown() {
  return null;
}