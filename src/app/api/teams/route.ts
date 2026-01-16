import { NextRequest, NextResponse } from 'next/server'
import { teamService } from '@/lib/services/team.service'
import { createTeamSchema } from '@/lib/utils/validation'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const teams = await teamService.getAllTeams()
    const result = await Promise.all(
      teams.map(async (team) => {
        const profileDir = path.join(process.cwd(), '.automation-profiles', team.id)
        const profileExists = await fs
          .access(profileDir)
          .then(() => true)
          .catch(() => false)

        return {
          id: team.id,
          name: team.name,
          email: team.email,
          status: team.status,
          memberCount: team.memberCount,
          createdAt: team.createdAt,
          lastLoginCheckAt: team.lastLoginCheckAt,
          loginError: team.loginError,
          loginInitialized: Boolean(team.cookies) || profileExists,
        }
      })
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)

    const team = await teamService.createTeam(validatedData)

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
