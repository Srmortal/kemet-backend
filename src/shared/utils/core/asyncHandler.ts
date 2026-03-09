import type { NextFunction, Request, Response } from "express";

type AsyncHandler<ReqType = Request, ResType = Response> = (
  req: ReqType,
  res: ResType,
  next: NextFunction
) => Promise<void>;

export function asyncHandler<
  ReqType extends Request = Request,
  ResType extends Response = Response,
>(
  handler: AsyncHandler<ReqType, ResType>
): (req: ReqType, res: ResType, next: NextFunction) => void {
  return (req: ReqType, res: ResType, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
