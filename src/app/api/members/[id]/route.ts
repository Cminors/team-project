import { NextRequest, NextResponse } from 'next/server'
import { memberService } from '@/lib/services/member.service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await memberService.deleteMember(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
