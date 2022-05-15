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
            'title': new FormControl(null, { validators: [Validators.required, Validators.maxLength(50)] }),
            'content': new FormControl(null, { validators: [Validators.required] }),
            image: new FormControl(null, {  
                validators:[],  
                asyncValidators: [mimetype]  
      })    // we make it empty so that it will not be required
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

        if (this.form.value.title == null || this.form.value.content == null) {
            return;
        }

        if (this.form.value.title.length > 50) {
            return;
        }

        if (this.form.value.content.length > 500) {
            return;
        }

        this.postsService.addPost(this.form.value.title, this.form.value.content, this.form.value.image, this.authService.getUserId());
        this.form.reset();
        document.getElementById('submit-group').classList.remove('ng-submitted');
    }
}  