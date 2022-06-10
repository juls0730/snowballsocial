import { HttpClient } from '@angular/common/http';
import { Conversation } from './conversation.model';

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Message } from './message.model';
import { AuthService } from '../authentication/auth.service';
import { SocketService } from '../services/socket.service';

@Injectable({ providedIn: 'root' })

export class ConversationService {
    constructor(private http: HttpClient, private router: Router, private authService: AuthService, private socketService: SocketService) { }
    private conversations: Conversation[] = [];
    private messages: Message[] = [];
    private conversationUpdated = new Subject<{ conversations: Conversation[] }>();
    private messagesUpdated = new Subject<{ messages: Message[], totalMessages: number }>();
    private singleConversationUpdated = new Subject<{ conversation: Conversation }>();
    conversationSalt: string;

    getConversations() {
        this.http.get<{ message: string, conversations: any }>('https://' + environment.api_location + '/api/conversations')
            .pipe(
                map(conversationData => {
                    return {
                        conversations: conversationData.conversations.map(conversation => {
                            return {
                                id: conversation._id,
                                participants: conversation.participants.map(participant => {
                                    return {
                                        id: participant._id,
                                        username: participant.username,
                                    }
                                })
                            };
                        })
                    }
                })
            )
            .subscribe((transformedConversationData) => {
                this.conversations = transformedConversationData.conversations;
                // set conversation.name to the username of the other participant
                this.conversations.forEach(conversation => {
                    if (conversation.participants.length === 2) {
                        conversation.name = conversation.participants.filter(participant => participant.id !== this.authService.getUserId())[0].username;
                    } else {
                        conversation.name = ''
                        for (let i = 0; i < conversation.participants.length; i++) {
                            if (conversation.participants[i].id !== this.authService.getUserId()) {
                                conversation.name += conversation.participants[i].username + ' & ';
                            }
                        }
                        conversation.name = conversation.name.substring(0, conversation.name.length - 3);
                    }
                });
                this.conversationUpdated.next({
                    conversations: [...this.conversations],
                });
            });
    }

    decrypt(salt, encoded) {
        const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
        const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
        return encoded
            .match(/.{1,2}/g)
            .map((hex) => parseInt(hex, 16))
            .map(applySaltToChar)
            .map((charCode) => String.fromCharCode(charCode))
            .join("");
    };

    getConversation(conversationId: string, currentpage: number) {
        const queryParams = `?currentpage=${currentpage}`;
        return this.http.get<{ messages: any, conversation: any, totalMessages: number, salt: string }>('https://' + environment.api_location + '/api/conversation/' + conversationId + '/' + queryParams)
            .pipe(
                map(conversationData => {
                    return {
                        messages: conversationData.messages.map(message => {
                            return {
                                id: message._id,
                                creator: message.creator,
                                content: message.content
                            };
                        }),
                        conversation: {
                            id: conversationData.conversation._id,
                            name: conversationData.conversation.name,
                            participants: conversationData.conversation.participants.map(participant => {
                                return {
                                    id: participant._id,
                                    username: participant.username,
                                }
                            })
                        },
                        totalMessages: conversationData.totalMessages,
                        salt: conversationData.salt
                    }
                })
            )
            .subscribe(
                (transformedConversationData) => {
                    for (let i = 0; i < transformedConversationData.messages.length; i++) {
                        transformedConversationData.messages[i].content = this.decrypt(transformedConversationData.salt, transformedConversationData.messages[i].content);
                    }
                    if (transformedConversationData.conversation.participants.length === 2) {
                        transformedConversationData.conversation.name = transformedConversationData.conversation.participants.filter(participant => participant.id !== this.authService.getUserId())[0].username;
                    } else {
                        if (transformedConversationData.conversation.name == null) {
                            transformedConversationData.conversation.name = ''
                            transformedConversationData.conversation.participants.filter(participant => participant.id !== this.authService.getUserId()).forEach(participant => {
                                transformedConversationData.conversation.name += participant.username + ' & ';
                            })
                            transformedConversationData.conversation.name = transformedConversationData.conversation.name.substring(0, transformedConversationData.conversation.name.length - 3);
                        } else {
                            transformedConversationData.conversation.name = transformedConversationData.conversation.name;
                        }
                    }
                    this.singleConversationUpdated.next({
                        conversation: transformedConversationData.conversation,
                    });
                    this.messages = transformedConversationData.messages.reverse();
                    this.messagesUpdated.next({
                        messages: [...this.messages],
                        totalMessages: transformedConversationData.totalMessages
                    });
                    this.conversationSalt = transformedConversationData.salt;
                },
                (error) => {
                    this.router.navigate(['/']);
                }
            );
    }

    getConversationSalt() {
        if (this.conversationSalt) {
            return this.conversationSalt;
        } else {
            return null;
        }
    }

    addConversation(participants: string[]) {
        const conversationData = {
            partner: participants
        };
        this.http.post<{ message: string, conversation: any }>('https://' + environment.api_location + '/api/conversation', conversationData)
            .subscribe(
                (responseData) => {
                    this.conversations.push({
                        id: responseData.conversation._id,
                        name: responseData.conversation.name,
                        participants: responseData.conversation.participants.map(participant => {
                            return {
                                id: participant._id,
                                username: participant.username,
                            }
                        })
                    });
                    this.conversationUpdated.next({
                        conversations: [...this.conversations],
                    });
                })
    }

    addMessage(content: string, conversationId: string) {
        const postData = new FormData();
        postData.append('content', content);
        this.http.post<{ message: Message, totalMessages }>('https://' + environment.api_location + '/api/conversation/' + conversationId + '/message', postData)
            .subscribe((responseData) => {
                responseData.message.content = this.decrypt(this.conversationSalt, responseData.message.content);
                this.messages.push(responseData.message);
                this.messagesUpdated.next({
                    messages: [...this.messages],
                    totalMessages: responseData.totalMessages
                });
                this.socketService.newMessage(conversationId, content);
            });
    }

    addMessages(conversationId: string, currentpage: number) {
        const queryParams = `?currentpage=${currentpage}`;
        return this.http.get<{ messages: any, conversation: any, totalMessages: number }>('https://' + environment.api_location + '/api/conversation/' + conversationId + '/' + queryParams)
            .pipe(
                map(conversationData => {
                    return {
                        messages: conversationData.messages.map(message => {
                            return {
                                id: message._id,
                                creator: message.creator,
                                content: message.content
                            };
                        }),
                        totalMessages: conversationData.totalMessages
                    }
                })
            )
            .subscribe(
                (transformedConversationData) => {
                    transformedConversationData.messages.forEach(message => {
                        message.content = this.decrypt(this.conversationSalt, message.content);
                    });
                    this.messages = transformedConversationData.messages.reverse().concat(this.messages);
                    this.messagesUpdated.next({
                        // add the new messages to the top of existing messages
                        messages: [...this.messages],
                        totalMessages: transformedConversationData.totalMessages
                    });
                },
                (error) => {
                    this.router.navigate(['/']);
                }
            );
    }

    recievedMessage(message: Message, totalMessages: number) {
        this.messages.push(message);
        this.messagesUpdated.next({
            messages: [...this.messages],
            totalMessages: totalMessages
        });
    }

    getConversationUpdateListenetr() {
        return this.conversationUpdated.asObservable();
    }

    getSingleConversationUpdateListener() {
        return this.singleConversationUpdated.asObservable();
    }

    getMessagesUpdateListenetr() {
        return this.messagesUpdated.asObservable();
    }
}