// ORPC-style contract draft for package build operations

import { o } from '@orpc/contract'
import { z } from 'zod'

export const buildArtifactSchema = z.object({
  path: z.string(),
  size: z.number(),
  checksum: z.string(),
  mimeType: z.string().optional(),
  publishedUri: z.string().optional(),
})

export const buildResultSchema = z.object({
  id: z.string(),
  packageName: z.string(),
  status: z.enum(['pending','running','success','failed','cancelled']),
  exitCode: z.number().nullable(),
  durationMs: z.number().nullable(),
  artifacts: z.array(buildArtifactSchema),
  logs: z.string().optional(),
})

export const buildContract = o.contract({
  buildPackage: o.route({
    method: 'POST',
    path: '/build/package',
    body: z.object({ packageName: z.string(), options: z.record(z.any()).optional() }),
    responses: { 200: buildResultSchema },
  }),
  listBuildable: o.route({
    method: 'GET',
    path: '/build/list',
    responses: { 200: z.object({ packages: z.array(z.string()) }) }
  })
})
