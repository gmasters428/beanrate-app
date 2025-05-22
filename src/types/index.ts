
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  following: string[];
  followers: string[];
  createdAt: string;
}

export interface CoffeeBean {
  id: string;
  name: string;
  roaster: string;
  origin: string;
  roastLevel: string;
  description?: string;
  imageUrl?: string;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
}

export interface BrewMethod {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Rating {
  id: string;
  userId: string;
  user: User;
  coffeeBeanId: string;
  coffeeBean: CoffeeBean;
  rating: number;
  brewMethod: string;
  tags: string[];
  notes?: string;
  beanImage?: string;
  brewedImage?: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  ratingId: string;
  content: string;
  createdAt: string;
}
