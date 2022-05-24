import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { Subscription } from 'rxjs';
import { AuthService } from '../authentication/auth.service';
import { UserService } from '../users/user.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})

export class HeaderComponent implements OnInit, OnDestroy {
    private authListenerSubs: Subscription;
    public userIsAuthenticated = false;
    public curuser: any;
    public userId: string;
    Loading = false;
    dropdownOpen = false;

    constructor(private authService: AuthService, private router: Router, private userService: UserService) { }

    slideOutNav() {
        document.getElementById('slideoutnav').classList.toggle('active');
    }

    onLogout() {
        this.dropdownOpen = false;
        this.userIsAuthenticated = false;
        this.curuser = null;
        this.userId = null;
        this.authService.logout();
    }

    ngOnInit() {
        this.userIsAuthenticated = this.authService.getIsAuth();
        this.Loading = true;
        if (this.userIsAuthenticated) {
            this.userId = this.authService.getUserId();
            this.userService.getUser(this.userId).subscribe(
                (userData: any) => {
                    this.curuser = userData.user;
                    this.Loading = false;
                });
        }
        this.authListenerSubs = this.authService.getAuthStatusListener()
            .subscribe(isAuthenticated => {
                this.userIsAuthenticated = isAuthenticated;
                if (this.userIsAuthenticated) {
                    this.userId = this.authService.getUserId();
                    this.userService.getUser(this.userId).subscribe(
                        (userData: any) => {
                            this.curuser = userData.user;
                            this.Loading = false;
                        });
                }
            });
    }

    ngOnDestroy() {
        this.authListenerSubs.unsubscribe();
    }

    waitFor(conditionFunction) {

        const poll = resolve => {
            if (conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), 400);
        }

        return new Promise(poll);
    }

    openDropdown() {
        var dropdown = document.getElementById("dropdown-content-user");
        if (!this.dropdownOpen) {
            dropdown.classList.add('active');
            dropdown.classList.remove('leaving');
            this.dropdownOpen = true
        } else {
            dropdown.classList.remove('active');
            dropdown.classList.add('leaving');
            this.dropdownOpen = false
        }
    }

    goto(route: string) {
        this.router.navigate([route])
    }
}