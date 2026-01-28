export interface Adventure {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  duration: string;
  location: string;
  maxParticipants: number;
  difficulty: 'Beginner' | 'Moderate' | 'Advanced';
  highlights: string[];
  included: string[];
  languages: string[];
  tags: string[];
  thumbnail: string;
}
