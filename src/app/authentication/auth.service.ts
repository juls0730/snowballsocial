import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user.model';
import { Subject } from "rxjs";
import { Router } from "@angular/router";
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: "root" })

export class AuthService {
    private token: string;
    private tokenTimer: any;
    private userId: string;
    private authStatusListener = new Subject<boolean>();
    private isAuthenticated = false;

    constructor(private http: HttpClient, private router: Router, private cookieService: CookieService) { }

    getToken() {
        return this.token;
    }

    getIsAuth() {
        return this.isAuthenticated;
    }

    getUserId() {
        return this.userId;
    }

    getAuthStatusListener() {
        return this.authStatusListener.asObservable();
    }

    CreateUser(email: string, username: string, password: string) {

        const authData: User = {
            email: email,
            username: username,
            password: password
        }

        this.http.post("https://localhost:2087/api/user/signup", authData)
            .subscribe(response => {
                this.loginUser(username, password);
            })

    }

    loginUser(usernameemail: string, password: string) {

        const authData: User = {
            usernameemail: usernameemail,
            password: password
        };

        this.http.post<{ token: string, expiresIn: number, userId: string }>("https://localhost:2087/api/user/login", authData)
            .subscribe(response => {
                const token = response.token;
                this.token = token;
                if (token) {
                    const expiresInDuration = response.expiresIn;
                    this.setAuthTimer(expiresInDuration);
                    this.isAuthenticated = true;
                    this.userId = response.userId;
                    this.authStatusListener.next(true);
                    const now = new Date();
                    const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
                    this.saveAuthData(token, expirationDate, this.userId);
                    this.router.navigate(['/']);
                }
            });
    }

    logout() {
        this.token = null;
        this.userId = null;  
        this.isAuthenticated = false;
        this.authStatusListener.next(false);
        this.router.navigate(['/']);
        this.clearAuthData();
        clearTimeout(this.tokenTimer);
    }

    private saveAuthData(token: string, expirationDate: Date, userId: string) {
        this.cookieService.set('token', token);
        this.cookieService.set('expiration', expirationDate.toISOString());
        this.cookieService.set('userId', this.userId);
    }

    private clearAuthData() {
        this.cookieService.delete('token');
        this.cookieService.delete('expiration');
        this.cookieService.delete('userId');
    }

    autoAuthUser() {
        const authInformation = this.getAuthData();
        if (!authInformation) {
            return;
        }
        const now = new Date();
        const expiresInDuration = authInformation.expirationDate.getTime() - now.getTime();
        if (expiresInDuration > 0) {
            this.token = authInformation.token;
            this.isAuthenticated = true;
            this.userId = authInformation.userId  
            this.setAuthTimer(expiresInDuration / 1000);
            this.authStatusListener.next(true);
        }
    }

    private getAuthData() {
        const token = this.cookieService.get("token");
        const expirationDate = this.cookieService.get("expiration");
        const userId = this.cookieService.get("userId");
        if (!token || !expirationDate) {
            return
        }
        return {
            token: token,
            expirationDate: new Date(expirationDate),
            userId: userId
        }
    }

    private setAuthTimer(duration: number) {
        this.tokenTimer = setTimeout(() => {
            this.logout();
        }, duration * 1000);
    }
}  