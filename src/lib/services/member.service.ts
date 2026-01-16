import prisma from '@/lib/prisma'
import { CreateMemberInput } from '@/lib/utils/validation'
import { Member } from '@prisma/client'

export class MemberService {
  async getMembersByTeamId(teamId: string): Promise<Member[]> {
    return await prisma.member.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getMemberById(id: string): Promise<Member | null> {
    return await prisma.member.findUnique({
      where: { id },
      include: { team: true },
    })
  }

  async createMember(input: CreateMemberInput): Promise<Member> {
    return await prisma.member.create({
      data: {
        email: input.email,
        role: input.role ?? 'member',
        teamId: input.teamId,
        status: 'pending',
      },
    })
  }

  async createMembers(teamId: string, emails: string[]): Promise<Member[]> {
    const members: Member[] = []

    for (const email of emails) {
      try {
        const member = await prisma.member.upsert({
          where: {
            teamId_email: {
              teamId,
              email,
            },
          },
          update: {},
          create: {
            email,
            teamId,
            status: 'pending',
          },
        })
        members.push(member)
      } catch (error) {
        console.error(`Failed to create member ${email}:`, error)
      }
    }

    return members
  }

  async updateMemberStatus(
    id: string,
    status: 'pending' | 'invited' | 'joined' | 'failed',
    failReason?: string
  ): Promise<Member> {
    const data: any = { status }

    if (status === 'invited') {
      data.invitedAt = new Date()
    } else if (status === 'joined') {
      data.joinedAt = new Date()
    } else if (status === 'failed' && failReason) {
      data.failReason = failReason
    }

    return await prisma.member.update({
      where: { id },
      data,
    })
  }

  async deleteMember(id: string): Promise<void> {
    await prisma.member.delete({
      where: { id },
    })
  }

  async getMemberStats(teamId: string) {
    const members = await prisma.member.findMany({
      where: { teamId },
    })

    const total = members.length
    const pending = members.filter((m) => m.status === 'pending').length
    const invited = members.filter((m) => m.status === 'invited').length
    const joined = members.filter((m) => m.status === 'joined').length
    const failed = members.filter((m) => m.status === 'failed').length

    return {
      total,
      pending,
      invited,
      joined,
      failed,
      inviteRate: total > 0 ? ((invited / total) * 100).toFixed(2) : '0',
      joinRate: total > 0 ? ((joined / total) * 100).toFixed(2) : '0',
    }
  }
}

export const memberService = new MemberService()
