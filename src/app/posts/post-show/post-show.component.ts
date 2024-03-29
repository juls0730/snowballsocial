import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { Subject, Subscription } from "rxjs";
import { AuthService } from "src/app/authentication/auth.service";
import { environment } from "src/environments/environment";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Post } from "../post.model";
import { Reply } from "../reply.model";
import { PostService } from "../posts.service";
import { ReplyService } from "../reply.service";
import { Meta } from "@angular/platform-browser";

@Component({
    selector: "app-show-post",
    templateUrl: "./post-show.component.html",
    styleUrls: ["./post-show.component.css"]
})

export class PostShowComponent implements OnInit {
    constructor(private postsService: PostService, private route: ActivatedRoute, private router: Router, private authService: AuthService, private replyService: ReplyService, private meta: Meta) { }
    post: Post;
    replies: any[] = [];
    private replyUpdated = new Subject<{ replies: Reply[], replyCount: number }>();
    totalReplies: number;
    Loading: boolean = false
    userId: string;
    liked: boolean = false;
    form: FormGroup;
    ReplySub: Subscription;
    private authStatusSub: Subscription;
    userIsAuthenticated: boolean;
    focusedImage: string;
    focusedImageAlt: string;

    ngOnInit() {
        this.Loading = true;
        this.form = new FormGroup({
            'reply': new FormControl(null, { validators: [Validators.required, Validators.maxLength(500)] }),
        });
        this.route.paramMap.subscribe((params: ParamMap) => {
            let post_id = params.get('id');

            return this.postsService.getPost(post_id).subscribe(postData => {
                this.post = postData;
                this.Loading = false;
                this.getReplies(post_id);
                this.ReplySub = this.replyService.getReplyUpdateListener().
                    subscribe((replyData: { replies: Reply[], replyCount: number }) => {
                        this.Loading = false;
                        this.totalReplies = replyData.replyCount;
                        this.replies = replyData.replies;
                    });
                this.addMetaTags();
            })
        })
        this.userId = this.authService.getUserId();
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
        navigator.clipboard.writeText(`https://` + environment.server_location + `/post/${id}`);
        document.getElementById("dropdown" + id + "-1").classList.remove("show");
    }

    onDelete(postId: string) {
        this.postsService.deletePost(postId);
        this.router.navigate(["/"])
    }

    onDeleteReply(replyId: string) {
        this.replyService.deleteReply(replyId)
            .subscribe(() => {
                let array = this.replies
                array = array.filter(function (item) {
                    return item.id !== replyId
                })
                this.replies = array
                this.replyUpdated.next({
                    replies: [...this.replies],
                    replyCount: this.replies.length
                });
            })
    }

    openDropdown(dropdownNum: string) {
        document.getElementById("dropdown" + dropdownNum).classList.toggle("show");
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show') && openDropdown.id != "dropdown" + dropdownNum) {
                openDropdown.classList.remove('show');
            }
        }
    }

    toggleLike(postId: string) {
        this.postsService.toggleLike(postId).subscribe((postData) => {
            let heartContainer = document.getElementById("heart-container");
            this.liked = !this.liked;
            this.post.likes = postData.likes;
            if (postData.likes.includes(this.userId)) {
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
            }
        });
    }

    toggleReplyLike(replyId: string) {
        this.replyService.toggleLike(replyId).subscribe((replyData) => {
            let heartContainer = document.getElementById("heart-container" + replyId);
            this.liked = !this.liked;
            const reply = this.replies.find(reply => reply.id === replyData.id);
            reply.likes = replyData.likes;
            if (replyData.likes.includes(this.userId)) {
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
            }
        });
    }

    onAddReply(postId: string) {
        if (this.form.invalid) {
            return;
        }

        this.replyService.addReply(postId, this.form.value.reply)
            .subscribe(responseData => {
                const reply = responseData.reply;
                this.replies.push(reply);
                document.getElementById('submit-reply-group').classList.remove('ng-submitted');
            });
        this.form.reset();
    }

    getReplies(postId: string) {
        this.replyService.getReplies(1, 1, postId).subscribe(repliesData => {
            this.replies = this.replies.concat(repliesData)[0].replies;
        })
    }

    addMetaTags() {
        this.meta.addTag({ name: 'description', content: this.post.content.substring(0, 25) + '...' })
        this.meta.addTag({ name: 'url', content: 'https://test.juls07.dev/post/' + this.post.id })
        this.meta.addTag({ name: 'og:url', content: 'https://test.juls07.dev/post/' + this.post.id })
        this.meta.addTag({ name: 'og:site_name', content: 'Snowball social' })
        this.meta.addTag({ name: 'og:description', content: this.post.content.substring(0, 25) + '...' })
        this.meta.addTag({ name: 'og:type', content: 'website' })
        this.meta.addTag({ name: 'twitter:card', content: 'summary' })
        this.meta.addTag({ name: 'twitter:title', content: 'Snowball social' })
        this.meta.addTag({ name: 'twitter:description', content: this.post.content.substring(0, 25) + '...' })
        this.meta.addTag({ name: 'twitter:url', content: 'https://test.juls07.dev/post/' + this.post.id })
        // this.meta.addTag({ name: keywords, content: this.post.tags })
        if (this.post.imagePath) {
            this.meta.addTag({ name: 'og:image', content: this.post.imagePath.toString() })
            this.meta.addTag({ name: 'twitter:image', content: this.post.imagePath.toString() })
        }
    }
}