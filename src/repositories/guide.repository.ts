import { Guide } from "@models/guide.model";
import { mockGuides } from "@utils/generateMockGuides";

export const guideRepository = {
  async getAllGuides(): Promise<Guide[]> {
    return mockGuides;
  },
  async getGuideById(id: string): Promise<Guide | null> {
    const guide = mockGuides.find(g => g.id === id);
    return guide || null;
  }
}