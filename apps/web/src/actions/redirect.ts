'use server'

import { redirect as r } from 'next/navigation'

export default async function redirect(to: string) {
    return await Promise.resolve(r(to))
}
