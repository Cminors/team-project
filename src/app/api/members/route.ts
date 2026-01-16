import { NextRequest, NextResponse } from 'next/server'
import { memberService } from '@/lib/services/member.service'
import { createMemberSchema } from '@/lib/utils/validation'
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

    const members = await memberService.getMembersByTeamId(teamId)
    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMemberSchema.parse(body)

    const member = await memberService.createMember(validatedData)

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
