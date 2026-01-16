import { NextRequest, NextResponse } from 'next/server'
import { teamService } from '@/lib/services/team.service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await teamService.syncTeamMembers(params.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error syncing team:', error)
    return NextResponse.json(
      { error: 'Failed to sync team members' },
      { status: 500 }
    )
  }
}
