// import { generateHotels, getHotelById, getRoomsForHotel } from '@utils/mockHotelsGenerator';
// import { HybridCache } from '@utils/hybridCache';
// import type { Hotel, Room } from '../types/hotel.types';
// import type { Paginated } from '../types/pagination.types';
// import type { Result } from '../types/result.types';
// import { ok, err } from '../types/result.types';
// import type { DomainError } from '../types/domain-error.type';

// const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// // Hybrid cache: Redis (distributed) + In-memory (fast)
// const cache = new HybridCache(20, 5, CACHE_TTL);

// class HotelService {
//   private async getCache<T>(key: string): Promise<T | null> {
//     return (await cache.get<T>(key)) || null;
//   }

//   private async setCache(key: string, data: unknown): Promise<void> {
//     await cache.set(key, data);
//   }

//   /**
//    * جلب قائمة الفنادق مع دعم التصفح
//    */
//   async getHotels(page: number, limit: number): Promise<Result<Paginated<Hotel>>> {
//     const cacheKey = `hotels:${page}:${limit}`;
//     const cached = await this.getCache<Paginated<Hotel>>(cacheKey);
//     if (cached) return ok(cached);

//     const pageNum = Math.max(1, page);
//     const limitNum = Math.max(1, limit);
    
//     const startId = (pageNum - 1) * limitNum + 1;
    
//     const hotels = generateHotels(limitNum, startId);

//     const result = {
//       data: hotels,
//       pagination: {
//         page: pageNum,
//         limit: limitNum,
//         hasNext: true,
//         hasPrev: pageNum > 1,
//       }
//     };
//     await this.setCache(cacheKey, result);
//     return ok(result);
//   }

//   /**
//    * جلب تفاصيل فندق معين مع غرفه
//    */
//   async getHotelWithRooms(hotelId: number): Promise<Result<Hotel & { rooms: Room[] }, DomainError>> {
//     const cacheKey = `hotel:${hotelId}`;
//     const cached = await this.getCache<Hotel & { rooms: Room[] }>(cacheKey);
//     if (cached) return ok(cached);

//     if (hotelId < 1) return err({ type: 'ValidationError', message: 'Invalid Hotel ID' });

//     const hotel = getHotelById(hotelId);
//     const rooms = getRoomsForHotel(hotelId);

//     const result = {
//       ...hotel,
//       rooms
//     };
//     await this.setCache(cacheKey, result);
//     return ok(result);
//   }

//   /**
//    * جلب غرف فندق معين
//    */
//   async getHotelRooms(hotelId: number): Promise<Result<Room[], DomainError>> {
//     const cacheKey = `hotel:${hotelId}:rooms`;
//     const cached = await this.getCache<Room[]>(cacheKey);
//     if (cached) return ok(cached);

//     if (hotelId < 1) return err({ type: 'ValidationError', message: 'Invalid Hotel ID' });

//     const rooms = getRoomsForHotel(hotelId);
    
//     await this.setCache(cacheKey, rooms);
//     return ok(rooms);
//   }
// }

// export const hotelService = new HotelService();