import { NextRequest, NextResponse } from 'next/server'
import { inviteService } from '@/lib/services/invite.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await inviteService.getInviteJobById(params.id)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching invite job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite job' },
      { status: 500 }
    )
  }
}
