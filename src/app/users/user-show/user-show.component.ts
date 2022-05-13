import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Post } from "../../posts/post.model";
import { User } from "../user.model";
import { UserService } from "../user.service";

@Component({
    selector: "app-show-user",
    templateUrl: "./user-show.component.html",
    styleUrls: ["./user-show.component.css"]
})

export class UserShowComponent implements OnInit {
    constructor(private userService: UserService, private route: ActivatedRoute) { }
    user: User;
    posts: Post[] = [];
    Loading = false
    PostsLoading = false

    ngOnInit() {
        this.Loading = true;
        this.PostsLoading = true;
        this.route.paramMap.subscribe((params: ParamMap) => {
            let user_id = params.get('id');

            return this.userService.getUser(user_id).subscribe(user => {
                this.user = user.user;
                this.Loading = false;
            });
        })

        this.route.paramMap.subscribe((params: ParamMap) => {
            let user_id = params.get('id');

            return this.userService.getUserPosts(user_id).subscribe(posts => {
                this.posts = this.posts.concat(posts.posts);
                this.PostsLoading = false;
            })
        })
    }
}