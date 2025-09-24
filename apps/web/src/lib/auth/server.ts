import { createAuthClient } from 'better-auth/client'
import { options } from './options'

export const serverAuthClient = createAuthClient(options)
