import { NextRequest, NextResponse } from 'next/server'
import { teamService } from '@/lib/services/team.service'
import { updateTeamSchema } from '@/lib/utils/validation'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await teamService.getTeamById(params.id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const profileDir = path.join(process.cwd(), '.automation-profiles', team.id)
    const profileExists = await fs
      .access(profileDir)
      .then(() => true)
      .catch(() => false)

    const { password, cookies, ...rest } = team as any

    return NextResponse.json({
      ...rest,
      lastLoginCheckAt: team.lastLoginCheckAt,
      loginError: team.loginError,
      loginInitialized: Boolean(cookies) || profileExists,
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateTeamSchema.parse({ ...body, id: params.id })

    const team = await teamService.updateTeam(validatedData)

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error updating team:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await teamService.deleteTeam(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}
