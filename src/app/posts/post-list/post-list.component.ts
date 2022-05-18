import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Post } from '../post.model';
import { PostService } from '../posts.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from "src/app/authentication/auth.service";
import { environment } from '../../../environments/environment';
import { Router } from "@angular/router";

@Component({
    selector: "app-post-list",
    templateUrl: "./post-list.component.html",
    styleUrls: ["./post-list.component.css"]
})

export class PostListComponent implements OnInit, OnDestroy {
    totalposts = 0;
    currentpage = 1;
    userId: string;
    private authStatusSub: Subscription;
    @Input() posts: Post[] = [];
    private PostSub: Subscription;
    userIsAuthenticated: boolean;

    constructor(public postsService: PostService, private authService: AuthService, private router: Router) {
        this.postsService = postsService;
    }
    Loading = false //This is property  

    ngOnInit() {
        this.Loading = true;
        this.postsService.getPosts( this.currentpage);
        this.userId = this.authService.getUserId();
        this.PostSub = this.postsService.getPostUpdateListenetr().
            subscribe((postData: { posts: Post[], postCount: number }) => {
                this.Loading = false;
                this.totalposts = postData.postCount;
                this.posts = postData.posts;
            });
        this.userIsAuthenticated = this.authService.getIsAuth();
        this.authStatusSub = this.authService.getAuthStatusListener()
            .subscribe(isAuthenticated => {
                this.userIsAuthenticated = isAuthenticated;
                this.userId = this.authService.getUserId();
            });
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

    gotoPost(id: string) {
        this.router.navigate(["/post/" + id]);
    }

    onChangedPage(pageData: PageEvent) {
        this.Loading = true;
        this.currentpage = pageData.pageIndex + 1;
        this.postsService.getPosts(this.currentpage);
    }

    onDelete(postId: string) {
        event.preventDefault();
        event.stopPropagation();
        this.Loading = true;
        this.postsService.deletePost(postId);
    }

    toggleLike(postId: string) {
        event.preventDefault();
        event.stopPropagation();
        this.postsService.toggleLike(postId).subscribe((postData) => {
            let heartContainer = document.getElementById("heart-container" + postId);
            console.log("liked" + postData.id);
            this.posts.find(post => post.id === postData.id).likes = postData.likes;
            if (postData.likes.includes(this.userId)) {
                heartContainer.classList.remove("unlikeAnimation");
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
                heartContainer.classList.toggle("unlikeAnimation");
            }
        });
    }

    ngOnDestroy() {
        this.PostSub.unsubscribe();
        this.authStatusSub.unsubscribe();
    }
}  