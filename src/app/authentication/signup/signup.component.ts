import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from "../auth.service";

@Component({
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class signupcomponent {
  showPassword: boolean = false;
  constructor(public authService: AuthService) { }
  onsignup(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.authService.CreateUser(form.value.email, form.value.username, form.value.password);
  }

  public togglePassword() {
    this.showPassword = !this.showPassword;
  }
}  