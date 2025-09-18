"use server"
import { revalidatePath as nextRevalidatePath } from "next/cache"

export const revalidatePath = async (
    ...args: Parameters<typeof nextRevalidatePath>
) => {
    console.log("Revalidating path:", ...args)
    return nextRevalidatePath(...args)
}
