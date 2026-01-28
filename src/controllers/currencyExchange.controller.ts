// import { Request, Response, NextFunction } from 'express';
// import { CurrencyExchangeService } from '../services/currencyExchange.service';
// import { CreateExchangeBookingRequestDto } from '../dto/currencyExchange.dto';

// const service = new CurrencyExchangeService();

// export const createExchangeBooking = async (req: Request, res: Response, next: NextFunction) => {
//   const dto: CreateExchangeBookingRequestDto = req.body as CreateExchangeBookingRequestDto;

//   // Call service
//   const result = await service.createBooking(dto);
//   if (!result.ok) {
//     return next(result.error);
//   }
//   return res.status(201).json(result.value);
// };
