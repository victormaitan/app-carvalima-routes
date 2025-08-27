import { useRef, useEffect } from "react";
import { Truck } from "lucide-react";

interface MessagePanelProps {
  messages: string[];
  className?: string;
}

function extrairCodigo(texto: string) {
  const padrao = /\b([A-Za-z]{3}-[A-Za-z]{3})\b/;
  const resultado = texto.match(padrao);
  return resultado ? resultado[1] : null;
}

export default function MessagePanel({
  messages,
  className = "",
}: MessagePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Fixed Header */}
      <div className="flex-none p-3 sm:p-4 border-b border-gray-700">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          Informações de Tráfego
        </h2>
      </div>

      {/* Scrollable Message Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 p-3 sm:p-4">
          <div className="space-y-2">
            {[...messages].map((raw, i) => {
              const sep = raw.indexOf('|');
              const key = sep > 0 ? raw.slice(0, sep) : `${i}`;
              const msg = sep > 0 ? raw.slice(sep + 1) : raw;
              const isOut = msg.includes("saiu");
              const isDest = msg.includes("destino");
              const code = extrairCodigo(msg)?.split('-')[1];
              return (
                <div
                  key={key}
                  className={`p-2 rounded-lg text-xs sm:text-sm animate-fade-in relative ${
                    isOut ? 'bg-red-600' : isDest ? 'bg-green-600' : 'bg-blue-700'
                  }`}
                >
                  {msg}
                  {code === 'CGB' ? (
                    <span
                      className={`text-white border-b-2 border-l-2 px-0.5 py-0.5 text-[10px] sm:text-xs rounded mx-0.5 font-semibold absolute z-10 -right-1 -top-2 ${
                        isOut ? 'bg-red-500' : isDest ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      title=""
                    >
                      {" "}
                      Retorno
                    </span>
                  ) : null}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
