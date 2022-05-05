import { Component, EventEmitter, Output } from '@angular/core';
import { PostService } from '../posts.service';
import { NgForm } from "@angular/forms";
import { Post } from '../post.model';

@Component({
    selector: "app-post-create",
    templateUrl: "./post-create.component.html",
})

export class PostCreateComponent {
    constructor(public postsService: PostService) { }

    onAddPost(form: NgForm) {
        if (form.invalid) {
            return;
        }

        this.postsService.addPost(form.value.title, form.value.content)
    }
}  