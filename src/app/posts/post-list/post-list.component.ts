import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import { Post } from '../post.model';
import { PostService } from '../posts.service';
import { Subscription } from 'rxjs';

@Component({
    selector: "app-post-list",
    templateUrl: "./post-list.component.html",
    styleUrls: ["./post-list.component.css"]
})

export class PostListComponent implements OnInit, OnDestroy {
    /*posts=[  
        {title: 'First Post', content:'This is the first post\'s content'},  
        {title: 'Second Post', content:'This is the second post\'s content'},  
        {title: 'Third Post', content:'This is the third post\'s content'}    
      ];  */
    @Input() posts: Post[] = [];
    private PostSub: Subscription;
    constructor(public postsService: PostService) {
        this.postsService = postsService;
    }

    ngOnInit() {
        this.postsService.getPosts();
        this.PostSub = this.postsService.getPostUpdateListenetr().
            subscribe((posts: Post[]) => {
                this.posts = posts;
            });
    }

    ngOnDestroy() {
        this.PostSub.unsubscribe();
    }
}  