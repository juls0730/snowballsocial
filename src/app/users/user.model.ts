export interface User {
    _id: string;
    username: string;
    description: string;
    imagePath?: File;
    followers: string[];
    following: string[];
}  