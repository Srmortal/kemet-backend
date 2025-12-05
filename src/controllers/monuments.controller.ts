import { Request, Response, NextFunction } from 'express';
import { MonumentsService } from '../services/monuments.service';
import { asyncHandler } from '../utils/asyncHandler';

const monumentsService = new MonumentsService();

/**
 * Controller for Egyptian monuments data
 * Serves scraped content from egymonuments.com
 */
export class MonumentsController {
  /**
   * Get all monuments with pagination
   * GET /api/monuments
   */
  getAllMonuments = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await monumentsService.getAll({ limit, page, category, tag, search });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  });

  /**
   * Get monument by ID
   * GET /api/monuments/:id
   */
  getMonumentById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const monument = await monumentsService.getById(id);

    res.status(200).json({
      success: true,
      data: monument,
    });
  });

  /**
   * Get monument by URL
   * GET /api/monuments/by-url
   */
  getMonumentByUrl = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({ success: false, message: 'URL parameter required' });
      return;
    }

    const monument = await monumentsService.getByUrl(url);

    res.status(200).json({
      success: true,
      data: monument,
    });
  });

  /**
   * Get all categories
   * GET /api/monuments/categories
   */
  getCategories = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const categories = await monumentsService.getCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  });

  /**
   * Get all tags
   * GET /api/monuments/tags
   */
  getTags = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const tags = await monumentsService.getTags();

    res.status(200).json({
      success: true,
      data: tags,
    });
  });

  /**
   * Search monuments
   * POST /api/monuments/search
   */
  searchMonuments = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { query, limit = 20, page = 1 } = req.body;

    const result = await monumentsService.search(query, { limit, page });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  });

  /**
   * Get monument stats
   * GET /api/monuments/stats
   */
  getStats = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await monumentsService.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}
