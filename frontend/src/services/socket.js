import { io } from 'socket.io-client';

const URL = 'http://localhost:5000'; // Adjust in production

let socket;

export const initiateSocketConnection = (token) => {
  socket = io(URL, {
    auth: {
      token
    }
  });
  console.log('Connecting socket...');
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const getSocket = () => socket;
