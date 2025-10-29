'use server'

import { redirect as r } from 'next/navigation'

export default function redirect(to: string) {
    return r(to)
}
