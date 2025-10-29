"use server"
import { revalidatePath as nextRevalidatePath } from "next/cache"

export const revalidatePath = (
    ...args: Parameters<typeof nextRevalidatePath>
) => {
    nextRevalidatePath(...args);
}
