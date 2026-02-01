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