import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Router } from "@angular/router";
import { AuthService } from "src/app/authentication/auth.service";
import { PostService } from "src/app/posts/posts.service";
import { environment } from "src/environments/environment";
import { Post } from "../../posts/post.model";
import { User } from "../user.model";
import { UserService } from "../user.service";

@Component({
    selector: "app-show-user",
    templateUrl: "./user-show.component.html",
    styleUrls: ["./user-show.component.css"]
})

export class UserShowComponent implements OnInit {
    constructor(private userService: UserService, private route: ActivatedRoute, private authService: AuthService, private router: Router, private postsService: PostService) { }
    user: User;
    posts: Post[] = [];
    Loading = false
    PostsLoading = false
    following = false;
    isCurrentUser = false;
    currentpage = 0;
    userIsAuthenticated = false;
    userId;

    ngOnInit() {
        this.Loading = true;
        this.PostsLoading = true;
        this.userIsAuthenticated = this.authService.getIsAuth();
        this.userId = this.authService.getUserId();
        this.route.paramMap.subscribe((params: ParamMap) => {
            let user_id = params.get('id');

            return this.userService.getUser(user_id).subscribe(user => {
                this.user = user.user;
                this.Loading = false;
                if (this.user.followers.includes(this.authService.getUserId())) {
                    this.following = true;
                }
                if (this.user._id == this.authService.getUserId()) {
                    this.isCurrentUser = true;
                }
            });
        })

        this.route.paramMap.subscribe((params: ParamMap) => {
            let user_id = params.get('id');

            return this.userService.getUserPosts(user_id)
            .subscribe(posts => {
                this.posts = this.posts.concat(posts.posts);
                this.PostsLoading = false;
            })
        })

        window.onclick = function (event) {
            if (!event.target.matches('#dropbtn')) {
                var dropdowns = document.getElementsByClassName("dropdown-content");
                var i;
                for (i = 0; i < dropdowns.length; i++) {
                    var openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }
    }

    toggleFollow() {
        this.userService.followUser(this.user._id).subscribe(res => {
            this.following = !this.following;
            if (this.following) {
                this.user.followers.push(this.authService.getUserId());
            } else {
                this.user.followers = this.user.followers.filter(follower => follower != this.authService.getUserId());
            }
        })
    }

    toggleLike(postId: string) {
        event.preventDefault();
        event.stopPropagation();
        this.postsService.toggleLike(postId).subscribe((postData) => {
            let heartContainer = document.getElementById("heart-container" + postId);
            console.log("liked" + postData.id);
            this.posts.find(post => post.id === postData.id).likes = postData.likes;
            if (postData.likes.includes(this.userId)) {
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
            }
        });
    }

    gotoPost(id: string) {
        this.router.navigate(["/post/" + id]);
    }

    onDelete(postId: string) {
        event.preventDefault();
        event.stopPropagation();
        this.Loading = true;
        this.postsService.deletePost(postId);
    }

    copyLink(id: string) {
        event.preventDefault();
        event.stopPropagation();
        navigator.clipboard.writeText(`https://` + environment.server_location + `/post/${id}`);
        document.getElementById("dropdown" + id + "-1").classList.remove("show");
    }

    openDropdown(dropdownNum: string) {
        event.preventDefault();
        event.stopPropagation();
        console.log("attempetd to oppen: dropdown" + dropdownNum)
        document.getElementById("dropdown" + dropdownNum).classList.toggle("show");
        console.log("oppened: " + "dropdown" + dropdownNum)
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show') && openDropdown.id != "dropdown" + dropdownNum) {
                openDropdown.classList.remove('show');
            }
        }
    }
}