import { Component, Input, OnInit, OnDestroy, HostListener } from "@angular/core";
import { Post } from '../post.model';
import { PostService } from '../posts.service';
import { Subscription } from 'rxjs';
import { AuthService } from "src/app/authentication/auth.service";
import { environment } from '../../../environments/environment';
import { Router } from "@angular/router";

@Component({
    selector: "app-post-list",
    templateUrl: "./post-list.component.html",
    styleUrls: ["./post-list.component.css"]
})

export class PostListComponent implements OnInit, OnDestroy {
    totalposts: number = 0;
    currentpage: number = 1;
    userId: string;
    private authStatusSub: Subscription;
    @Input() posts: Post[] = [];
    private PostSub: Subscription;
    userIsAuthenticated: boolean;
    focusedImage: string;
    focusedImageAlt: string;
    averageimagecolor: any;
    Loading: boolean = false

    constructor(public postsService: PostService, private authService: AuthService, private router: Router) { }

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
        document.getElementById("focused-image").addEventListener('pointerdown', (event) => {
            this.unFocusImage();
        })
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

    focusImage(imageUrl: string) {
        event.stopPropagation();
        this.focusedImage = imageUrl;
        document.getElementById("focused-image").classList.toggle("show");
        // this.averageimagecolor = this.getAverageRGBofImage(document.getElementById("focused-image-img"));
        // document.getElementById("focused-image").style.backgroundColor = `rgba(${this.averageimagecolor.r},${this.averageimagecolor.g},${this.averageimagecolor.b},0.5)`;
    }

    unFocusImage() {
        document.getElementById("focused-image").classList.remove("show");
        // this.focusedImage = null;
        // this.averageimagecolor = null;
        // document.getElementById("focused-image").style.backgroundColor = null;
    }

    getAverageRGBofImage(img: any) {
        var blockSize = 5, // only visit every 5 pixels
            defaultRGB = { r: 0, g: 0, b: 0 }, // for non-supporting envs
            canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d'),
            data, width, height,
            i = -4,
            length,
            rgb = { r: 0, g: 0, b: 0 },
            count = 0;

        if (!context) {
            return defaultRGB;
        }

        height = canvas.height = img.naturalHeight || img.offsetHeight || img.height;
        width = canvas.width = img.naturalWidth || img.offsetWidth || img.width;

        context.drawImage(img, 0, 0);

        try {
            data = context.getImageData(0, 0, width, height);
        } catch (e) {
            /* security error, img on diff domain */
            return defaultRGB;
        }

        length = data.data.length;

        while ((i += blockSize * 4) < length) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i + 1];
            rgb.b += data.data[i + 2];
        }

        // ~~ used to floor values
        rgb.r = ~~(rgb.r / count);
        rgb.g = ~~(rgb.g / count);
        rgb.b = ~~(rgb.b / count);

        canvas.remove();
        return rgb;
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