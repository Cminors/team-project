import { NextRequest, NextResponse } from 'next/server'
import { inviteService } from '@/lib/services/invite.service'
import { createInviteJobSchema } from '@/lib/utils/validation'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    const jobs = await inviteService.getInviteJobsByTeamId(teamId)
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching invite jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createInviteJobSchema.parse(body)

    const job = await inviteService.createInviteJob(validatedData)

    // Execute the job asynchronously
    inviteService.executeInviteJob(job.id).catch((error) => {
      console.error('Error executing invite job:', error)
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error creating invite job:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invite job' },
      { status: 500 }
    )
  }
}
