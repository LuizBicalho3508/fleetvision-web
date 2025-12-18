import { useEffect, useRef } from 'react';

export const useSocket = (onData) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Detecta se é HTTP ou HTTPS para usar WS ou WSS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/api/socket`;

    const connect = () => {
      console.log('Tentando conectar ao WebSocket Traccar...', url);
      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log('✅ WebSocket Conectado!');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onData) onData(data);
        } catch (e) {
          console.error('Erro ao processar mensagem do socket', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket desconectado. Tentando reconectar em 5s...');
        setTimeout(connect, 5000);
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []); // Executa apenas uma vez na montagem
};
