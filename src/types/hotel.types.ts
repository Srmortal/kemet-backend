export interface Hotel {
  id: number;
  name: string;
  governorate: string;
  city: string;
  stars: 3 | 4 | 5;
  rating: number;
  reviewsCount: number;
  currency: 'EGP';
  thumbnail: string;
}

export interface Room {
  id: number;
  hotelId: number;
  name: 'Standard Room' | 'Deluxe Room' | 'Executive Suite' | 'Royal Suite';
  capacity: number;
  pricePerNight: number;
  currency: 'EGP';
  amenities: {
    wifi: boolean;
    ac: boolean;
    tv: boolean;
    balcony: boolean;
  };
}

