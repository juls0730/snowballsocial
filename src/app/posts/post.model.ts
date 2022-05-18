export interface Post {
  id: string;
  content: string;
  imagePath?: File;
  creator: string;
  creatorname?: string;
  likes?: any;
  replies?: any;
}  