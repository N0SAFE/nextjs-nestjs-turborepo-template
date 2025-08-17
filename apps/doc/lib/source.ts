// @ts-nocheck -- skip type checking

import { docs } from '@/.source'
import { loader } from 'fumadocs-core/source'

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
})
