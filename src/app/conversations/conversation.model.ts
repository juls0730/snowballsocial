import { User } from "../authentication/user.model";

export interface Conversation {
    id: string;
    participants: any[];
    name: string;
}  