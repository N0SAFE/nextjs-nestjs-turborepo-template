import z from "zod/v4";

export const sortBy = z.enum(["asc", "desc"]).default("desc");
