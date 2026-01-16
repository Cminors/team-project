import { z } from 'zod'

// Team schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  description: z.string().optional(),
  teamUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  cookies: z.array(z.any()).optional(), // Cookies from assisted login
  autoInvite: z.boolean().optional(),
  inviteIntervalMs: z.number().min(1000).optional(),
})

export const updateTeamSchema = createTeamSchema.partial().extend({
  id: z.string(),
})

// Member schemas
export const createMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'admin']).optional(),
  teamId: z.string(),
})

export const batchInviteSchema = z.object({
  teamId: z.string(),
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
  role: z.enum(['member', 'admin']).optional(),
  delayMs: z.number().min(0).optional(),
})

// Invite job schemas
export const createInviteJobSchema = z.object({
  teamId: z.string(),
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
})

// Admin schemas
export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type CreateMemberInput = z.infer<typeof createMemberSchema>
export type BatchInviteInput = z.infer<typeof batchInviteSchema>
export type CreateInviteJobInput = z.infer<typeof createInviteJobSchema>
export type CreateAdminInput = z.infer<typeof createAdminSchema>
export type LoginInput = z.infer<typeof loginSchema>
