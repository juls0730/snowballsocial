import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { ConversationService } from '../conversation.service';
import { AuthService } from 'src/app/authentication/auth.service';
import { Subscription } from 'rxjs';
import { Message } from '../message.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FormControl, FormGroup, Validators, NgModel } from "@angular/forms";
import { SocketService } from 'src/app/services/socket.service';
import { Conversation } from '../conversation.model';
declare var $: any

@Component({
    selector: "app-conversations-show",
    templateUrl: "./conversation-show.component.html",
    styleUrls: ["./conversation-show.component.css"]
})

export class ConversationShowComponent implements OnInit, OnDestroy {
    constructor(public conversationService: ConversationService, private authService: AuthService, private route: ActivatedRoute, private socketService: SocketService) { }
    form: FormGroup;
    curUserId = this.authService.getUserId();
    Loading: boolean = false;
    @Input() messages: Message[] = [];
    private MessageSub: Subscription;
    convo_id: string;
    totalmessages: number = 0;
    currentpage: number = 1;
    private conversationSalt: string;
    @Input() conversation: Conversation;
    private ConversationSub: Subscription;
    conversationDataLoading: boolean = true;
    typingMessage: string = "";
    typingUsers: string[] = [];

    ngOnInit() {
        this.form = new FormGroup({
            'content': new FormControl(null, { validators: [Validators.required] }),
            /*image: new FormControl(null, {
                validators: [],
                asyncValidators: [mimetype]
            })*/
        });
        this.Loading = true;
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.convo_id = params.get('id');
            this.conversationService.getConversation(this.convo_id, this.currentpage);
        })
        this.ConversationSub = this.conversationService.getSingleConversationUpdateListener()
            .subscribe((conversationData: { conversation: Conversation }) => {
                this.conversationDataLoading = false;
                this.conversation = conversationData.conversation;
                this.initInput()
            })
        this.MessageSub = this.conversationService.getMessagesUpdateListenetr().
            subscribe((conversationData: { messages: Message[], totalMessages: number }) => {
                this.Loading = false;
                this.totalmessages = conversationData.totalMessages;
                this.messages = conversationData.messages;
                this.scrollToBottom();
            });
        this.socketService.OnNewMessage(this.convo_id).subscribe((message: any) => {
            console.log(message.message);
            if (message.message.creator._id == this.authService.getUserId()) {
                return;
            }

            if (this.conversationSalt == null) {
                this.conversationSalt = this.conversationService.getConversationSalt()
            }

            this.scrollToBottom();
            let decryptedcontent = this.decrypt(this.conversationSalt, message.message.content);
            message.message.content = decryptedcontent;
            this.conversationService.recievedMessage(message.message, this.totalmessages + 1);
        })
        // this.socketService.onTyping(this.convo_id).subscribe((message: any) => {
        //     if (message.user._id == this.authService.getUserId()) {
        //         console.log("started typing from self")
        //         return;
        //     }
        //     console.log(message)

        //     if (this.typingUsers.includes(message.user._id)) {
        //         console.log(message.user + " already typing")
        //     }

        //     this.typingUsers.push(message.user._id);
        //     if (this.typingUsers.length > 2) {
        //         this.typingMessage = 'Multiple people are typing...';
        //     } else if (this.typingUsers.length == 2) {
        //         this.typingMessage = this.typingUsers.join(' and ') + ' are typing...';
        //     } else {
        //         this.typingMessage = message.user.username + ' is typing...';
        //     }
        // })

        // this.socketService.onStopTyping(this.convo_id).subscribe((message: any) => {
        //     if (message.user._id == this.authService.getUserId()) {
        //         console.log("stopped typing from self")
        //         return;
        //     }
        //     console.log(message)

        //     this.typingUsers = this.typingUsers.filter((id) => id != message.user._id);

        //     if (this.typingUsers.length == 0) {
        //         this.typingMessage = "";
        //     }

        //     if (this.typingUsers.length > 2) {
        //         this.typingMessage = 'Multiple people are typing...';
        //     } else if (this.typingUsers.length == 2) {
        //         this.typingMessage = this.typingUsers.join(' and ') + ' are typing...';
        //     } else {
        //         this.typingMessage = message.user.username + ' is typing...';
        //     }
        // })
    }

    findMessage(id: string) {
        console.log(this.messages);
        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i]._id == id) {
                return true;
            }
        }
    }

    initInput() {
        let timer;
        if (!this.conversationDataLoading && document.getElementById('message-input') != null) {
            document.getElementById("message-input").addEventListener('input', () => {
                document.getElementById("message-input").style.height = "auto";

                document.getElementById("message-input").style.height = (document.getElementById("message-input").scrollHeight - 26) + "px";
            })

            document.getElementById("message-input").addEventListener('keydown', (e) => {
                if (e.key == "Enter" && !e.shiftKey) {
                    // force validation
                    this.form.get('content').markAsTouched();
                    this.form.get('content').updateValueAndValidity();
                    if (this.form.valid) {
                        this.createMessage();
                        document.getElementById("message-input").style.height = "auto";
                    }
                    e.preventDefault();
                }
                if (e.key != "Enter" && e.key != "Backspace" && e.key != "ArrowUp" && e.key != "ArrowDown" && e.key != "ArrowLeft" && e.key != "ArrowRight" && e.key != "Delete" && e.key != "Tab" && e.key != "Control" && e.key != "Alt" && e.key != "Shift") {
                    // clearTimeout(timer);
                    // this.socketService.declareTyping(this.convo_id);
                    // timer = setTimeout(() => {
                    //     this.socketService.stopTyping(this.convo_id);
                    // }, 750);
                }
            })
        } else {
            setTimeout(() => {
                this.initInput();
            }, 450);
        }
    }

    scrollToBottom() {
        console.log("scroll to bottom");
        $('#messages').scrollTop($('#messages').height());
    }

    createMessage() {
        if (this.form.invalid) {
            return;
        }

        if (this.form.value.content == null || this.form.value.content.length > 5000) {
            return;
        }

        if (this.conversationSalt == null) {
            this.conversationSalt = this.conversationService.getConversationSalt()
        }

        let encryptedcontent = this.crypt(this.conversationSalt, this.form.value.content);

        this.conversationService.addMessage(encryptedcontent, this.convo_id);
        this.form.reset();
        this.form.get('content').setErrors(null);
        this.scrollToBottom();
    }

    crypt(salt, text) {
        const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
        const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
        const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);

        return text
            .split("")
            .map(textToChars)
            .map(applySaltToChar)
            .map(byteHex)
            .join("");
    };

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

    @HostListener('window:scroll', ['$event']) onScroll(event: any) {
        var scrollTop = $('#messages').scrollTop();
        var topDistance = $('#messages').offset().top;

        if ((topDistance) >= scrollTop) {
            if ((this.totalmessages / 50) > this.currentpage) {
                this.currentpage += 1;
                this.conversationService.addMessages(this.convo_id, this.currentpage);
            }
        }
    }

    ngOnDestroy() {
        this.MessageSub.unsubscribe();
    }
}  