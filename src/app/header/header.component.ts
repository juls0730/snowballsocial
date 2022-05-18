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
        document.getElementById('overlay').classList.toggle('overlay-active');
    }

    onLogout() {
        this.userIsAuthenticated = false;
        this.Loading = true;
        this.curuser = null;
        this.userId = null;
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    ngOnInit() {
        this.Loading = true;
        this.userIsAuthenticated = this.authService.getIsAuth(); // prevent nav from desyncing when user is autotically logged in 
        if (this.userIsAuthenticated) {
            this.initDropdown()
        }
        this.authListenerSubs = this.authService.getAuthStatusListener()
            .subscribe(isAuthenticated => {
                this.userIsAuthenticated = isAuthenticated;
                this.initDropdown()
            });    // this is to get the auth status from the auth service
    }

    ngOnDestroy() {
        this.authListenerSubs.unsubscribe();
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

    closeDropdown() {
        if (this.userIsAuthenticated && !this.Loading) {
            var dropdown = document.getElementById("dropdown-content-user");
            dropdown.classList.remove('leaving');
            dropdown.classList.remove('active');
            this.dropdownOpen = false;
        }
    }

    initDropdown() {
        if (this.userIsAuthenticated) {
            this.userId = this.authService.getUserId();
            this.userService.getUser(this.userId).subscribe(
                (userData: any) => {
                    this.curuser = userData.user;
                    this.Loading = false
                });
        }
    }
}  