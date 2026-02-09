import type { Adventure } from "../models/adventures.model";

export interface AdventureRepository {
  findById(id: string): Promise<Adventure | null>;
  getAll(): Promise<Adventure[]>;
}