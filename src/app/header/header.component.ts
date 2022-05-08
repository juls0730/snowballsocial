import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { Subscription } from 'rxjs';
import { AuthService } from '../authentication/auth.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})

export class HeaderComponent implements OnInit, OnDestroy {
    private authListenerSubs: Subscription;
    public userIsAuthenticated = false;

    constructor(private authService: AuthService, private router: Router) { }

    slideOutNav() {
        document.getElementById('slideoutnav').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('overlay-active');
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/']);
    }

    ngOnInit() {
        this.userIsAuthenticated = this.authService.getIsAuth(); // prevent nav from desyncing when user is autotically logged in 
        this.authListenerSubs = this.authService.getAuthStatusListener()
            .subscribe(isAuthenticated => {
                this.userIsAuthenticated = isAuthenticated;
            });    // this is to get the auth status from the auth service
    }

    ngOnDestroy() {
        this.authListenerSubs.unsubscribe();
    }
}  