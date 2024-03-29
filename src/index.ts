import { readFileSync, fstat } from 'fs';
import http from 'http';
import fs from 'fs';
import * as process from 'process';
import * as WebSocket from 'ws';
import {
  Action,
  FileExtensionToContentTypeMap,
  State,
  StaticFileExtension,
  User,
  Event,
} from './types';

const PORT = process.env.PORT || 5000;

const FILE_EXTENSION_TO_CONTENT_TYPE: FileExtensionToContentTypeMap = {
  css: 'text/css',
  html: 'text/html',
  ico: 'image/x-icon',
  js: 'text/javascript',
};

const server = http.createServer((request, response) => {
  try {
    const url = request.url && request.url !== '/' ? request.url  : 'index.html';

    const urlParts = url.split('.');
    const fileExtension = urlParts[urlParts.length - 1]  as StaticFileExtension;
    const contentType = FILE_EXTENSION_TO_CONTENT_TYPE[fileExtension];
    response.writeHead(200, { 'Content-Type': contentType });


    const file = fs.readFileSync(`${process.cwd()}/public/${url}`);

    response.end(file);
  } catch (err) {
    console.log(err);
    response.end(err.toString())
  }
});

const state: State = {
  participants: [],
  trainers: [],
  issues: [],
};



const sendEvent = (socket: WebSocket, event: Event): void => {
  try {
    socket.send(JSON.stringify(event));
  }

  catch (e) {
    console.error(e);
  }
};

const webSocketsServer = new WebSocket.Server({server});

webSocketsServer.on('connection', (socket: WebSocket) => {
  const connectedUser: User = {
    id: `user-id-${Date.now()}`,
    data: {
      name: '',
      group: '',
    },
    socket,
  };


  socket.on('message', message => {
    console.log(['socket message'], message);
    const { action, payload } = JSON.parse(message.toString());
    
    switch (action as Action) {
      case 'PARTICIPANT_LOGIN': {
        connectedUser.data = payload;
        state.participants = [...state.participants, connectedUser];
        sendEvent(connectedUser.socket, { action: 'PARTICIPANT_LOGGED' });
        break;
      }
      case 'TRAINER_LOGIN': {
        connectedUser.data = payload;
        state.participants = [...state.participants, connectedUser];
        sendEvent(connectedUser.socket, {action: 'TRAINER_LOGGED', payload: state.issues});
        break;
      }
      case 'TRAINER_NEEDED': {
        state.issues = [...state.issues, {
          id: `issue-id-${Date.now()}`,
          problem: payload.problem,
          status: 'PENDING',
          userId: connectedUser.id,
          userName: connectedUser.data.name,
          userGroup: connectedUser.data.group,
        }];

        sendEvent(connectedUser.socket, {action: 'ISSUE_RECEIVED'});

        state.trainers.forEach(({socket}) => {
          sendEvent(socket, {
            action: 'ISSUES',
            payload: state.issues
          });
        });
        break;
      }
      default: {
        console.error('unknown action');
      }
    }
  });
  socket.on('close', () => {
    console.log('socket closed');
  });
});

server.listen(PORT, () => {
  console.log('ruszył');
});
