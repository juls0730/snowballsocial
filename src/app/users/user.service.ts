import { HttpClient } from '@angular/common/http';
import { User } from './user.model';

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Post } from '../posts/post.model';

@Injectable({ providedIn: 'root' })

export class UserService {
    constructor(private http: HttpClient, private router: Router) { }

    getUser(id: string) {
        return this.http.get<{
            user: User
        }>(`https://${environment.api_location}/api/user/${id}`);
    }

    getUserPosts(id: string) {
        return this.http.get<{
            posts: any[]
        }>(`https://${environment.api_location}/api/user/${id}/posts`)
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
                    //maxPosts: postData.maxPosts
                };
            })
        );
    }

    followUser(id: string) {
        return this.http.post<{
            message: string, user: any
        }>(`https://${environment.api_location}/api/user/${id}/toggleFollow`, {});
    }
}