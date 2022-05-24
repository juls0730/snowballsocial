import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "src/app/authentication/auth.service";
import { UserService } from "../user.service";

@Component({
    selector: "app-user-setting",
    templateUrl: "./user-setting.component.html",
    styleUrls: ["./user-setting.component.css"]
})

export class UserSettingComponent implements OnInit {
    constructor(private userService: UserService, private route: ActivatedRoute, private authService: AuthService, private router: Router) { }

    ngOnInit() {
        
    }
}