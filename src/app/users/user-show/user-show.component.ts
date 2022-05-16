import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { AuthService } from "src/app/authentication/auth.service";
import { Post } from "../../posts/post.model";
import { User } from "../user.model";
import { UserService } from "../user.service";

@Component({
    selector: "app-show-user",
    templateUrl: "./user-show.component.html",
    styleUrls: ["./user-show.component.css"]
})

export class UserShowComponent implements OnInit {
    constructor(private userService: UserService, private route: ActivatedRoute, private authSerive: AuthService) { }
    user: User;
    posts: Post[] = [];
    Loading = false
    PostsLoading = false
    following = false;
    isCurrentUser = false;

    ngOnInit() {
        this.Loading = true;
        this.PostsLoading = true;
        this.route.paramMap.subscribe((params: ParamMap) => {
            let user_id = params.get('id');

            return this.userService.getUser(user_id).subscribe(user => {
                this.user = user.user;
                this.Loading = false;
                if (this.user.followers.includes(this.authSerive.getUserId())) {
                    this.following = true;
                }
                if (this.user._id == this.authSerive.getUserId()) {
                    this.isCurrentUser = true;
                }
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

    toggleFollow() {
        this.userService.followUser(this.user._id).subscribe(res => {
            this.following = !this.following;
            if (this.following) {
                this.user.followers.push(this.authSerive.getUserId());
            } else {
                this.user.followers = this.user.followers.filter(follower => follower != this.authSerive.getUserId());
            }
        })
    }
}