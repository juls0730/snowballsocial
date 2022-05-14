import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/authentication/auth.service";
import { environment } from "src/environments/environment";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Post } from "../post.model";
import { Reply } from "../reply.model";
import { PostService } from "../posts.service";
import { ReplyService } from "../reply.service";

@Component({
    selector: "app-show-post",
    templateUrl: "./post-show.component.html",
    styleUrls: ["./post-show.component.css"]
})

export class PostShowComponent implements OnInit {
    constructor(private postsService: PostService, private route: ActivatedRoute, private router: Router, private authService: AuthService, private replyService: ReplyService) {
        this.postsService = postsService;
    }
    post: Post;
    replies: any[] = [];
    Loading = false
    userId: string;
    liked = false;
    form: FormGroup;
    private ReplySub: Subscription;
    private authStatusSub: Subscription;
    userIsAuthenticated: boolean;

    ngOnInit() {
        this.Loading = true;
        this.form = new FormGroup({
            'reply': new FormControl(null, { validators: [Validators.required, Validators.maxLength(500)] }),
            /*image: new FormControl(null, {
                validators: [],
                asyncValidators: [mimetype]
            })    // we make it empty so that it will not be required*/
        });
        this.route.paramMap.subscribe((params: ParamMap) => {
            let post_id = params.get('id');

            return this.postsService.getPost(post_id).subscribe(postData => {
                this.post = postData;
                this.Loading = false;
                this.getReplies(post_id);
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

    onDelete(postId: string) {
        this.Loading = true;
        this.postsService.deletePost(postId);
        this.Loading = false;
        this.router.navigate(["/"])
    }

    onDeleteReply(replyId: string) {
        this.replyService.deleteReply(replyId);
    }

    openDropdown(dropdownNum: string) {
        event.preventDefault();
        event.stopPropagation();
        console.log("dropdown" + dropdownNum)
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
        event.preventDefault();
        event.stopPropagation();
        this.postsService.toggleLike(postId).subscribe((postData) => {
            let heartContainer = document.getElementById("heart-container");
            console.log("liked" + postData.id);
            this.liked = !this.liked;
            this.post.likes = postData.likes;
            if (postData.likes.includes(this.userId)) {
                heartContainer.classList.remove("unlikeAnimation");
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
                heartContainer.classList.toggle("unlikeAnimation");
            }
        });
    }

    toggleReplyLike(replyId: string) {
        event.preventDefault();
        event.stopPropagation();
        this.replyService.toggleLike(replyId).subscribe((replyData) => {
            let heartContainer = document.getElementById("heart-container" + replyId);
            console.log("liked" + replyData.id);
            this.liked = !this.liked;
            const reply = this.replies.find(reply => reply.id === replyData.id);
            reply.likes = replyData.likes;
            if (replyData.likes.includes(this.userId)) {
                heartContainer.classList.remove("unlikeAnimation");
                heartContainer.classList.toggle("likeAnimation");
            } else {
                heartContainer.classList.remove("likeAnimation");
                heartContainer.classList.toggle("unlikeAnimation");
            }
        });
    }

    onAddReply(postId: string) {
        if (this.form.invalid) {
            return;
        }

        console.log("reply: " + this.form.value.reply);
        this.replyService.addReply(postId, this.form.value.reply)
            .subscribe(responseData => {
                const reply = responseData.reply;
                console.log(reply)
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
}