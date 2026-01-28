import { Guide } from "@models/guide.model";
import { Result,ok,err } from "../types/result.types";
import { guideRepository } from "@repositories/guide.repository";
import { DomainError } from "types/domain-error.type";

// Service contract
export async function getGuides(
  params: { page: number; limit: number }
): Promise<Result<{ guides: Guide[]; total: number; totalPages: number }>> {
  try {
    const allGuides = await guideRepository.getAllGuides();
    const total = allGuides.length;
    const page = params.page;
    const limit = params.limit;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const guides = allGuides.slice(start, end);
    return ok({ guides, total, totalPages });
  } catch (error) {
    return err(error as DomainError);
  }
}

export async function getGuideById(
  id: string
): Promise<Result<Guide>> {
  try {
    const guide = await guideRepository.getGuideById(id);
    if (!guide) {
      return err({
        type: 'NotFound',
        message: `Guide with id ${id} not found`
      });
    }
    return ok(guide);
  } catch (error) {
    return err(error as DomainError);
  }
}
