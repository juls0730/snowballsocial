import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class logincomponent {
  constructor(public authservice: AuthService) { }
  onlogin(form: NgForm) {
    if (form.invalid) {
      return;
    }

    this.authservice.loginUser(form.value.emailusername, form.value.password);
  }
}  