import { z } from 'zod'

/**
 * Zod validation schema for user authentication / login.
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().min(1, 'passwordRequired').min(6, 'passwordMinLength'),
  redirectTo: z.string().optional()
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Standard server action response envelope.
 */
export type AuthActionResult<T = void> = { success: true; data?: T; redirectTo?: string } | { success: false; error: string; code?: string }
