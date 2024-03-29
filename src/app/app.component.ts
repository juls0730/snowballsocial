import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './authentication/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  constructor(private authservice: AuthService, public router: Router) { }
  ngOnInit() {
    this.authservice.autoAuthUser();
  }
}  
