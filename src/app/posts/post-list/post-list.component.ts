import { Component, Input, OnInit, OnDestroy, HostListener } from "@angular/core";
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

    constructor(public postsService: PostService, private authService: AuthService, private router: Router) { }
    Loading = false

    ngOnInit() {
        this.Loading = true;
        this.postsService.getPosts(this.currentpage);
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
                for (let i = 0; i < dropdowns.length; i++) {
                    var openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }
    }

    copyLink(id: string) {
        event.stopPropagation();
        navigator.clipboard.writeText(`https://` + environment.server_location + `/post/${id}`);
        document.getElementById("dropdown" + id + "-1").classList.remove("show");
    }

    openDropdown(dropdownNum: string) {
        event.stopPropagation();
        document.getElementById("dropdown" + dropdownNum).classList.toggle("show");
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
        this.postsService.addPosts(this.currentpage);
    }

    onDelete(postId: string) {
        event.stopPropagation();
        this.Loading = true;
        this.postsService.deletePost(postId);
    }

    @HostListener('window:scroll', ['$event']) onScroll(event: any) {
        const element = document.getElementById('posts');

        const domRect = element.getBoundingClientRect();
        const spaceBelow = window.innerHeight - domRect.bottom;

        if (spaceBelow >= -750) {
            if ((this.totalposts / 15) > this.currentpage) {
                this.currentpage += 1;
                this.postsService.addPosts(this.currentpage)
            }
        }
    }

    toggleLike(postId: string) {
        event.stopPropagation();
        this.postsService.toggleLike(postId).subscribe((postData) => {
            let heartContainer = document.getElementById("heart-container" + postId);
            this.posts.find(post => post.id === postData.id).likes = postData.likes;
            if (postData.likes.includes(this.userId)) {
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
            }
        });
    }

    ngOnDestroy() {
        this.PostSub.unsubscribe();
        this.authStatusSub.unsubscribe();
    }
}  