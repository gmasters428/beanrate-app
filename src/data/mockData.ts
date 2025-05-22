
import { User, CoffeeBean, Rating, BrewMethod, Tag } from "@/types";

export const mockUsers: User[] = [
  {
    id: "1",
    username: "coffeelover",
    name: "Coffee Lover",
    email: "coffee@example.com",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Coffee enthusiast and home barista",
    following: ["2", "3"],
    followers: ["2", "3", "4"],
    createdAt: "2023-01-15T10:30:00Z"
  },
  {
    id: "2",
    username: "beanmaster",
    name: "Bean Master",
    email: "bean@example.com",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    bio: "Coffee roaster and connoisseur",
    following: ["1"],
    followers: ["1", "4"],
    createdAt: "2023-02-10T14:20:00Z"
  },
  {
    id: "3",
    username: "espressoqueen",
    name: "Espresso Queen",
    email: "espresso@example.com",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    bio: "Espresso specialist and latte artist",
    following: ["1", "2"],
    followers: ["1"],
    createdAt: "2023-03-05T09:15:00Z"
  },
  {
    id: "4",
    username: "brewguru",
    name: "Brew Guru",
    email: "brew@example.com",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    bio: "Exploring brewing methods from around the world",
    following: ["1", "2"],
    followers: [],
    createdAt: "2023-04-20T16:45:00Z"
  }
];

export const mockCoffeeBeans: CoffeeBean[] = [
  {
    id: "1",
    name: "Ethiopian Yirgacheffe",
    roaster: "Stumptown Coffee",
    origin: "Ethiopia",
    roastLevel: "Light",
    description: "Floral and citrusy with notes of bergamot and lemon",
    imageUrl: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=400&h=400&fit=crop",
    averageRating: 4.7,
    totalRatings: 128,
    createdAt: "2023-01-10T08:00:00Z"
  },
  {
    id: "2",
    name: "Colombia Supremo",
    roaster: "Blue Bottle Coffee",
    origin: "Colombia",
    roastLevel: "Medium",
    description: "Sweet and balanced with notes of caramel and nuts",
    imageUrl: "https://images.unsplash.com/photo-1559525839-8f275eef9d67?w=400&h=400&fit=crop",
    averageRating: 4.5,
    totalRatings: 95,
    createdAt: "2023-02-15T10:30:00Z"
  },
  {
    id: "3",
    name: "Sumatra Mandheling",
    roaster: "Intelligentsia",
    origin: "Indonesia",
    roastLevel: "Dark",
    description: "Earthy and full-bodied with notes of dark chocolate and spice",
    imageUrl: "https://images.unsplash.com/photo-1587734361993-0490df9f53f9?w=400&h=400&fit=crop",
    averageRating: 4.2,
    totalRatings: 76,
    createdAt: "2023-03-20T14:15:00Z"
  },
  {
    id: "4",
    name: "Kenya AA",
    roaster: "Counter Culture",
    origin: "Kenya",
    roastLevel: "Medium-Light",
    description: "Bright and juicy with notes of blackcurrant and grapefruit",
    imageUrl: "https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?w=400&h=400&fit=crop",
    averageRating: 4.8,
    totalRatings: 112,
    createdAt: "2023-04-05T09:45:00Z"
  },
  {
    id: "5",
    name: "Guatemala Antigua",
    roaster: "Verve Coffee",
    origin: "Guatemala",
    roastLevel: "Medium",
    description: "Smooth and complex with notes of chocolate and cinnamon",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop",
    averageRating: 4.4,
    totalRatings: 89,
    createdAt: "2023-05-12T11:20:00Z"
  }
];

export const mockBrewMethods: BrewMethod[] = [
  { id: "1", name: "Pour Over" },
  { id: "2", name: "French Press" },
  { id: "3", name: "Espresso Machine" },
  { id: "4", name: "Aeropress" },
  { id: "5", name: "Drip Machine" },
  { id: "6", name: "Cold Brew" },
  { id: "7", name: "Moka Pot" },
  { id: "8", name: "Chemex" }
];

export const mockTags: Tag[] = [
  { id: "1", name: "Black" },
  { id: "2", name: "With Milk" },
  { id: "3", name: "Vanilla Syrup" },
  { id: "4", name: "Caramel Syrup" },
  { id: "5", name: "Hazelnut Syrup" },
  { id: "6", name: "Oat Milk" },
  { id: "7", name: "Almond Milk" },
  { id: "8", name: "Latte" },
  { id: "9", name: "Cappuccino" },
  { id: "10", name: "Americano" }
];

export const mockRatings: Rating[] = [
  {
    id: "1",
    userId: "1",
    user: mockUsers[0],
    coffeeBeanId: "1",
    coffeeBean: mockCoffeeBeans[0],
    rating: 5,
    brewMethod: "Pour Over",
    tags: ["Black"],
    notes: "Incredible floral notes with a bright acidity. Perfect for morning brewing.",
    beanImage: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=400&h=400&fit=crop",
    brewedImage: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400&h=400&fit=crop",
    createdAt: "2023-05-15T08:30:00Z",
    likes: ["2", "3"],
    comments: [
      {
        id: "1",
        userId: "2",
        user: mockUsers[1],
        ratingId: "1",
        content: "Looks amazing! I need to try this bean.",
        createdAt: "2023-05-15T09:15:00Z"
      }
    ]
  },
  {
    id: "2",
    userId: "2",
    user: mockUsers[1],
    coffeeBeanId: "3",
    coffeeBean: mockCoffeeBeans[2],
    rating: 4,
    brewMethod: "French Press",
    tags: ["Black"],
    notes: "Rich and earthy. Perfect for a rainy afternoon.",
    beanImage: "https://images.unsplash.com/photo-1587734361993-0490df9f53f9?w=400&h=400&fit=crop",
    brewedImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
    createdAt: "2023-05-16T14:45:00Z",
    likes: ["1", "4"],
    comments: []
  },
  {
    id: "3",
    userId: "3",
    user: mockUsers[2],
    coffeeBeanId: "2",
    coffeeBean: mockCoffeeBeans[1],
    rating: 5,
    brewMethod: "Espresso Machine",
    tags: ["Latte", "Vanilla Syrup", "Oat Milk"],
    notes: "Makes an incredible latte with oat milk and a touch of vanilla.",
    beanImage: "https://images.unsplash.com/photo-1559525839-8f275eef9d67?w=400&h=400&fit=crop",
    brewedImage: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=400&fit=crop",
    createdAt: "2023-05-17T10:20:00Z",
    likes: ["1", "2", "4"],
    comments: [
      {
        id: "2",
        userId: "1",
        user: mockUsers[0],
        ratingId: "3",
        content: "That latte art is incredible!",
        createdAt: "2023-05-17T11:05:00Z"
      },
      {
        id: "3",
        userId: "4",
        user: mockUsers[3],
        ratingId: "3",
        content: "I need to try this combination.",
        createdAt: "2023-05-17T13:30:00Z"
      }
    ]
  },
  {
    id: "4",
    userId: "4",
    user: mockUsers[3],
    coffeeBeanId: "4",
    coffeeBean: mockCoffeeBeans[3],
    rating: 4,
    brewMethod: "Aeropress",
    tags: ["Black"],
    notes: "Bright and fruity. The Aeropress really brings out the blackcurrant notes.",
    beanImage: "https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?w=400&h=400&fit=crop",
    brewedImage: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop",
    createdAt: "2023-05-18T16:10:00Z",
    likes: ["1"],
    comments: []
  },
  {
    id: "5",
    userId: "1",
    user: mockUsers[0],
    coffeeBeanId: "5",
    coffeeBean: mockCoffeeBeans[4],
    rating: 4,
    brewMethod: "Chemex",
    tags: ["Black"],
    notes: "Clean and smooth. The Chemex brewing really highlights the chocolate notes.",
    beanImage: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop",
    brewedImage: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop",
    createdAt: "2023-05-19T09:30:00Z",
    likes: ["2", "3"],
    comments: [
      {
        id: "4",
        userId: "3",
        user: mockUsers[2],
        ratingId: "5",
        content: "I love Guatemalan beans in a Chemex too!",
        createdAt: "2023-05-19T10:45:00Z"
      }
    ]
  }
];
