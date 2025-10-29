'use server'

import { revalidatePath } from "next/cache"

export function revalidateAllAction() {
    revalidatePath('/')
}
