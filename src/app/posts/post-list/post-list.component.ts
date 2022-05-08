import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Post } from '../post.model';
import { PostService } from '../posts.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from "src/app/authentication/auth.service";

@Component({
    selector: "app-post-list",
    templateUrl: "./post-list.component.html",
    styleUrls: ["./post-list.component.css"]
})

export class PostListComponent implements OnInit, OnDestroy {
    totalposts = 0;
    postperpage = 15;
    currentpage = 1;
    userId: string;
    private authStatusSub: Subscription;
    @Input() posts: Post[] = [];
    private PostSub: Subscription;
    userIsAuthenticated: boolean;
    constructor(public postsService: PostService, private authService: AuthService) {
        this.postsService = postsService;
    }
    Loading = false //This is property  

    ngOnInit() {
        this.Loading = true;
        this.postsService.getPosts(this.postperpage, this.currentpage);
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
    }

    onChangedPage(pageData: PageEvent) {
        this.Loading = true;
        this.currentpage = pageData.pageIndex + 1;
        this.postperpage = pageData.pageSize;
        this.postsService.getPosts(this.postperpage, this.currentpage);
    }

    onDelete(postId: string) {
        this.Loading = true;
        this.postsService.deletePost(postId)
            .subscribe(() => {
                this.postsService.getPosts(this.postperpage, this.currentpage);
            });
    }

    ngOnDestroy() {
        this.PostSub.unsubscribe();
        this.authStatusSub.unsubscribe();
    }
}  