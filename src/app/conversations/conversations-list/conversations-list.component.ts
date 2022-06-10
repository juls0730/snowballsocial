import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ConversationService } from '../conversation.service';
import { AuthService } from 'src/app/authentication/auth.service';
import { Conversation } from '../conversation.model';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: "app-conversations-list",
    templateUrl: "./conversations-list.component.html",
    styleUrls: ["./conversations-list.component.css"]
})

export class ConversationsListComponent implements OnInit, OnDestroy {
    constructor(public conversationService: ConversationService, private authService: AuthService) { }
    Loading: boolean = false;
    form: FormGroup;
    @Input() conversations: Conversation[] = [];
    private ConversationSub: Subscription;

    ngOnInit() {
        this.form = new FormGroup({
            'participants': new FormControl(null, { validators: [Validators.required] }),
        })
        this.Loading = true;
        this.conversationService.getConversations();
        this.ConversationSub = this.conversationService.getConversationUpdateListenetr().
            subscribe((conversationData: { conversations: Conversation[] }) => {
                this.Loading = false;
                this.conversations = conversationData.conversations;
            });
        this.Loading = false;
    }

    onCreateConversation() {
        if (this.form.invalid) {
            return;
        }

        if (this.form.value.participants == null) {
            return;
        }

        this.conversationService.addConversation(this.form.value.participants);
        this.form.reset();
        this.form.get('participants').setErrors(null);
    }

    ngOnDestroy() {
        this.ConversationSub.unsubscribe();
    }
}  