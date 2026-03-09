export interface Adventure {
  category: string;
  currency: string;
  description: string;
  difficulty: "Beginner" | "Moderate" | "Advanced";
  duration: string;
  highlights: string[];
  id: string;
  included: string[];
  languages: string[];
  location: string;
  maxParticipants: number;
  price: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  thumbnail: string;
  title: string;
}
