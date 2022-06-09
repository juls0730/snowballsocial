import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ConversationService } from '../conversation.service';
import { AuthService } from 'src/app/authentication/auth.service';
import { Conversation } from '../conversation.model';
import { Subscription } from 'rxjs';

@Component({
    selector: "app-conversations-list",
    templateUrl: "./conversations-list.component.html",
    styleUrls: ["./conversations-list.component.css"]
})

export class ConversationsListComponent implements OnInit, OnDestroy {
    constructor(public conversationService: ConversationService, private authService: AuthService) { }
    Loading: boolean = false;
    @Input() conversations: Conversation[] = [];
    private ConversationSub: Subscription;

    ngOnInit() {
        this.Loading = true;
        this.conversationService.getConversations();
        this.ConversationSub = this.conversationService.getConversationUpdateListenetr().
            subscribe((conversationData: { conversations: Conversation[] }) => {
                this.Loading = false;
                this.conversations = conversationData.conversations;
            });
        this.Loading = false;
    }

    ngOnDestroy() {
        this.ConversationSub.unsubscribe();
    }
}  