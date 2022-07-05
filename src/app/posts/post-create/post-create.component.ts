import { Component, OnInit } from '@angular/core';
import { PostService } from '../posts.service';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { mimetype } from "./mime-type.validator";
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: "app-post-create",
    templateUrl: "./post-create.component.html",
    styleUrls: ["./post-create.component.css"]
})

export class PostCreateComponent implements OnInit {
    form: FormGroup;
    Pickedimage: string;
    constructor(public postsService: PostService, private authService: AuthService) { }

    ngOnInit() {
        this.form = new FormGroup({
            'content': new FormControl(null, { validators: [Validators.required] }),
            image: new FormControl(null, {
                validators: [],
                asyncValidators: [mimetype]
            })
        });
    }

    PickedImage(event: Event) {
        const file = (event.target as HTMLInputElement).files[0];
        this.form.patchValue({ image: file });
        this.form.get('image').updateValueAndValidity();
        const reader = new FileReader();
        reader.onload = () => {
            this.Pickedimage = reader.result as string;
            document.getElementById('image-name').textContent = file.name.split(/(\\|\/)/g).pop()
        };
        reader.readAsDataURL(file);
    }

    onAddPost() {
        if (this.form.invalid) {
            return;
        }

        if (this.form.value.content == null || this.form.value.content.length > 500) {
            return;
        }

        if (this.form.value.image !== null) {
            if (this.form.value.image.type !== "image/jpeg" && this.form.value.image.type !== "image/jpg" && this.form.value.image.type !== "image/png") {
                return;
            }
        }

        this.postsService.addPost(this.form.value.content, this.form.value.image);
        this.form.reset();
        this.form.get('content').setErrors(null);
        this.form.get('image').setErrors(null);
        document.getElementById('image-name').textContent = "";
    }
}  