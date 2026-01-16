import { NextRequest, NextResponse } from 'next/server'
import { teamService } from '@/lib/services/team.service'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await teamService.checkTeamLogin(params.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking login:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check login' },
      { status: 500 }
    )
  }
}

