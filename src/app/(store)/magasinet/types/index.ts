import type { z } from 'zod'
import type {
  magazineArticleSchema,
  magazineBlockSchema,
  magazineCategorySchema,
  magazineImageSchema
} from '../schemas/magazineArticleSchema'

export type MagazineCategory = z.infer<typeof magazineCategorySchema>
export type MagazineImage = z.infer<typeof magazineImageSchema>
export type MagazineBlock = z.infer<typeof magazineBlockSchema>
export type MagazineArticle = z.infer<typeof magazineArticleSchema>
export type MagazineArticleInput = z.input<typeof magazineArticleSchema>
