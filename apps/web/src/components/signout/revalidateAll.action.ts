'use server'

import { revalidatePath } from "next/cache"

export async function revalidateAllAction() {
    revalidatePath('/')
    await Promise.resolve()
}
