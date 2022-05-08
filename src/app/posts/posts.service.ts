import { HttpClient } from '@angular/common/http';
import { Post } from './post.model';

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })

export class PostService {
    private posts: Post[] = [];
    private postUpdated = new Subject<{ posts: Post[], postCount: number }>();

    constructor(private http: HttpClient, private router: Router) { }

    getPosts(pagesize: number, currentpage: number) {
        const queryParams = `?pagesize=${pagesize}&currentpage=${currentpage}`;
        this.http.get<{ message: string, posts: any, maxPosts: number }>('https://localhost:2087/api/posts' + queryParams)
            .pipe(
                map(postData => {
                    return {
                        posts: postData.posts.map(post => {
                            return {
                                title: post.title,
                                content: post.content,
                                id: post._id,
                                imagePath: post.imagePath,
                                creator: post.creator
                            };
                        }),
                        maxPosts: postData.maxPosts
                    };
                })
            )
            .subscribe((transformedPostsData) => {
                console.log(transformedPostsData);
                this.posts = transformedPostsData.posts;
                this.postUpdated.next({
                    posts: [...this.posts],
                    postCount: transformedPostsData.maxPosts
                });
            });
    }

    getPostUpdateListenetr() {
        return this.postUpdated.asObservable();
    }

    addPost(title: string, content: string, image: File, creator: string) {
        const postData = new FormData();
        postData.append('title', title);
        postData.append('content', content);
        if (image) {
            postData.append('image', image, title);
        }
        postData.append('creator', creator);
        this.http.post<{ message: string, postId: string }>('https://localhost:2087/api/posts', postData)
            .subscribe((responseData) => {
                location.reload();
            });
    }

    deletePost(postId: string) {
        return this.http.delete("https://localhost:2087/api/posts/" + postId);
    }

    getPost(id: string) {
        return { ...this.posts.find(p => p.id === id) };
    }
}