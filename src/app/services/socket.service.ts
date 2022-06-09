import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from '../authentication/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  constructor(private socket: Socket, private authService: AuthService) { }

  OnNewMessage(id: string) {
    return this.socket
      .fromEvent('channel-' + id)
  }

  newMessage(id: string, content: string) {
    this.socket.emit('message', {
      conversationId: id,
      content: content,
      creator: this.authService.getToken()
    });
  }

  onTyping(id: string) {
    return this.socket
      .fromEvent('typing-' + id)
  }

  declareTyping(id: string) {
    this.socket.emit('typing', {
      conversationId: id,
      creator: this.authService.getToken()
    });
  }

  onStopTyping(id: string) {
    return this.socket
      .fromEvent('nottyping-' + id)
  }

  stopTyping(id: string) {
    this.socket.emit('nottyping', {
      conversationId: id,
      creator: this.authService.getToken()
    });
  }
}
