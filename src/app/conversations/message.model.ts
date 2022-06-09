import { User } from "../users/user.model";

export interface Message {
    id?: string;
    _id?: string;
    content: string;
    creator: User;
}  