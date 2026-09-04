import {
  BlobNotFoundError,
  head,
  put,
  type HeadBlobResult,
  type PutBlobResult
} from '@vercel/blob'
import { z } from 'zod'

const inputSchema = z.strictObject({
  body: z.instanceof(Buffer),
  contentType: z.enum(['image/jpeg', 'image/png']),
  pathname: z
    .string()
    .regex(/^meta\/catalog\/v26\/[a-z0-9/-]+\.(?:jpg|png)$/),
  token: z.string().trim().min(1)
})

const blobResultSchema = z
  .object({
    contentDisposition: z.string().min(1),
    contentType: z.string().min(1),
    downloadUrl: z.url(),
    etag: z.string().min(1),
    pathname: z.string().min(1),
    size: z.number().int().nonnegative().optional(),
    url: z.url()
  })
  .passthrough()

export async function publishMetaCatalogImage(input: {
  body: Buffer
  contentType: 'image/jpeg' | 'image/png'
  pathname: string
  token: string
  headImpl?: typeof head
  putImpl?: typeof put
}) {
  const parsed = inputSchema.parse({
    body: input.body,
    contentType: input.contentType,
    pathname: input.pathname,
    token: input.token
  })
  let result: HeadBlobResult | PutBlobResult
  let reused = false

  try {
    result = await (input.headImpl ?? head)(parsed.pathname, {
      token: parsed.token
    })
    reused = true
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) throw error

    result = await (input.putImpl ?? put)(
      parsed.pathname,
      parsed.body,
      {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 31_536_000,
        contentType: parsed.contentType,
        multipart: parsed.body.byteLength >= 10 * 1024 * 1024,
        token: parsed.token
      }
    )
  }

  const blob = blobResultSchema.parse(result)

  if (
    blob.pathname !== parsed.pathname ||
    blob.contentType !== parsed.contentType ||
    !blob.url.endsWith(`/${parsed.pathname}`)
  ) {
    throw new Error(
      `Vercel Blob readback did not match Meta catalog image plan for ${parsed.pathname}`
    )
  }

  if (
    blob.size !== undefined &&
    blob.size !== parsed.body.byteLength
  ) {
    throw new Error(
      `Vercel Blob size mismatch for ${parsed.pathname}: expected ${parsed.body.byteLength}, received ${blob.size}`
    )
  }

  return { ...blob, reused }
}
