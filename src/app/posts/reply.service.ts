import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Reply } from './reply.model';

@Injectable({ providedIn: 'root' })

export class ReplyService {
    private replies: Reply[] = [];
    private replyUpdated = new Subject<{ replies: Reply[], replyCount: number }>();

    constructor(private http: HttpClient, private router: Router) { }

    getReplies(pagesize: number, currentpage: number, postId: string) {
        const queryParams = `?pagesize=${pagesize}&currentpage=${currentpage}`;
        return this.http.get<{ replies: any }>('https://' + environment.api_location + '/api/posts/' + postId + "/replies" + queryParams)
            .pipe(
                map(replyData => {
                    return {
                        replies: replyData.replies.map(reply => {
                            return {
                                content: reply.content,
                                id: reply._id,
                                imagePath: reply.imagePath,
                                creator: reply.creator,
                                likes: reply.likes
                            };
                        }),
                    };
                })
            )
    }

    getReplyUpdateListener() {
        return this.replyUpdated.asObservable();
    }

    addReply(postId: string, content: string) {
        const postData = new FormData();
        postData.append('reply', content);

        return this.http.post<{ message: string, reply: any }>('https://' + environment.api_location + '/api/posts/' + postId + "/reply", postData)
            .pipe(
                map(replyData => {
                    return {
                        reply: {
                            content: replyData.reply.content,
                            id: replyData.reply._id,
                            imagePath: replyData.reply.imagePath,
                            creator: replyData.reply.creator,
                            likes: replyData.reply.likes
                        }
                    }
                })
            )
    }

    deleteReply(replyId: string) {
        return this.http.delete('https://' + environment.api_location + '/api/posts/reply/' + replyId)
            .subscribe((replyUpdated) => {
                this.replies.pop();
                this.replyUpdated.next({
                    replies: [...this.replies],
                    replyCount: this.replies.length
                });
            })
    }

    toggleLike(replyId: string) {
        return this.http.put<{ reply: any }>('https://' + environment.api_location + '/api/posts/reply/' + replyId + '/togglelike', {})
            .pipe(
                map(replyData => {
                    return {
                        id: replyData.reply._id,
                        content: replyData.reply.content,
                        imagePath: replyData.reply.imagePath,
                        creator: replyData.reply.creator,
                        likes: replyData.reply.likes
                    }
                }));
    }
}