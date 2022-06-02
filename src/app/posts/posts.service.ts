import { HttpClient } from '@angular/common/http';
import { Post } from './post.model';

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Reply } from './reply.model';

@Injectable({ providedIn: 'root' })

export class PostService {
    private posts: Post[] = [];
    private replies: Reply[] = [];
    private postUpdated = new Subject<{ posts: Post[], postCount: number }>();

    constructor(private http: HttpClient, private router: Router) { }

    getPosts(currentpage: number) {
        const queryParams = `?currentpage=${currentpage}`;
        this.http.get<{ message: string, posts: any, maxPosts: number }>('https://' + environment.api_location + '/api/posts' + queryParams)
            .pipe(
                map(postData => {
                    return {
                        posts: postData.posts.map(post => {
                            return {
                                content: post.content,
                                id: post._id,
                                imagePath: post.imagePath,
                                creator: post.creator._id,
                                creatorname: post.creator.username,
                                replies: post.replies,
                                likes: post.likes
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

    addPosts(currentpage: number) {
        const queryParams = `?currentpage=${currentpage}`;
        this.http.get<{ message: string, posts: any, maxPosts: number }>('https://' + environment.api_location + '/api/posts' + queryParams)
            .pipe(
                map(postData => {
                    return {
                        posts: postData.posts.map(post => {
                            return {
                                content: post.content,
                                id: post._id,
                                imagePath: post.imagePath,
                                creator: post.creator._id,
                                creatorname: post.creator.username,
                                replies: post.replies,
                                likes: post.likes
                            };
                        }),
                        maxPosts: postData.maxPosts
                    };
                })
            )
            .subscribe((transformedPostsData) => {
                console.log(transformedPostsData);
                this.posts = this.posts.concat(transformedPostsData.posts);
                this.postUpdated.next({
                    posts: [...this.posts],
                    postCount: transformedPostsData.maxPosts
                });
            });
    }

    getPostUpdateListenetr() {
        return this.postUpdated.asObservable();
    }

    addPost(content: string, image: File) {
        const postData = new FormData();
        postData.append('content', content);
        if (image) {
            postData.append('image', image, content.substring(0, 10));
        }
        this.http.post<{ post: any }>('https://' + environment.api_location + '/api/posts', postData)
            .subscribe((responseData) => {
                const post: Post = {
                    id: responseData.post._id,
                    content: responseData.post.content,
                    imagePath: responseData.post.imagePath,
                    creator: responseData.post.creator._id,
                    creatorname: responseData.post.creator.username,
                    likes: responseData.post.likes,
                    replies: responseData.post.replies
                };
                console.log(responseData);
                console.log(post)
                // put new post at the begging of the array
                this.posts.unshift(post)
                this.postUpdated.next({
                    posts: [...this.posts],
                    postCount: responseData.post.maxPosts
                });
            });
    }

    deletePost(postId: any) {
        return this.http.delete('https://' + environment.api_location + '/api/posts/' + postId)
            .subscribe(() => {
                let array = this.posts
                array = array.filter(function (item) {
                    return item.id !== postId
                })
                this.posts = array
                this.postUpdated.next({
                    posts: [...this.posts],
                    postCount: this.posts.length
                });
            })
    }

    getPost(id: string) {
        return this.http.get<{ post: any }>('https://' + environment.api_location + '/api/posts/' + id)
            .pipe(
                map(postData => {
                    return {
                        id: postData.post._id,
                        content: postData.post.content,
                        imagePath: postData.post.imagePath,
                        creator: postData.post.creator._id,
                        creatorname: postData.post.creator.username,
                        likes: postData.post.likes
                    }
                }));
    }

    getReplies(id: string) {
        return this.http.get<{ replies: Reply[] }>('https://' + environment.api_location + '/api/posts/' + id + '/replies');
    }

    addReply(reply: string, postId: string) {
        const postData = new FormData();
        postData.append('reply', reply);
        this.http.post<{ reply: any }>('https://' + environment.api_location + '/api/posts/' + postId + '/reply', postData)
            .subscribe((responseData) => {
                const reply: Reply = {
                    id: responseData.reply._id,
                    content: responseData.reply.content,
                    imagePath: responseData.reply.imagePath,
                    creator: responseData.reply.creator,
                    likes: responseData.reply.likes
                };
                console.log(responseData);
                console.log(reply)
                this.replies.push(reply);
                this.postUpdated.next({
                    posts: [...this.posts],
                    postCount: responseData.reply.maxPosts
                });
            });
    }

    toggleLike(id: string) {
        return this.http.put<{ post: any }>('https://' + environment.api_location + '/api/posts/' + id + '/togglelike', {})
            .pipe(
                map(postData => {
                    return {
                        id: postData.post._id,
                        title: postData.post.title,
                        content: postData.post.content,
                        imagePath: postData.post.imagePath,
                        creator: postData.post.creator._id,
                        creatorname: postData.post.creator.username,
                        likes: postData.post.likes
                    }
                }));
    }
}