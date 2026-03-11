import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long.")
    .max(20, "Username must be at most 20 characters long.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores.",
    ),
  clientPasswordHash: z
    .string()
    .min(5, "Password must be at least 5 characters long.")
    .max(100, "Password must be at most 100 characters long."),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username wird benötigt"),
  clientPasswordHash: z.string().min(1, "Passwort wird benötigt"),
});
