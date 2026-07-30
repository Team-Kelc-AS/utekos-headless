import { z } from 'zod'
import raw from './color-2-scales.json'

const color2ScaleStepSchema = z.object({
  shade: z.string(),
  cssVar: z.string(),
  token: z.string(),
  oklch: z.string(),
  hex: z.string()
})

const color2ScaleFamilySchema = z.object({
  id: z.string(),
  title: z.string(),
  steps: z.array(color2ScaleStepSchema)
})

const color2ScalesFileSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  shadeSteps: z.array(z.string()),
  familyCount: z.number(),
  families: z.array(color2ScaleFamilySchema)
})

export type Color2ScaleStep = z.infer<
  typeof color2ScaleStepSchema
>
export type Color2ScaleFamily = z.infer<
  typeof color2ScaleFamilySchema
>
export const color2Scales = color2ScalesFileSchema.parse(raw)
