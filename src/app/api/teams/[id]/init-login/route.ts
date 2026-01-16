import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/utils/crypto'
import { OpenAIAutomationClient } from '@/lib/automation/openai-client'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json(
        { success: false, message: '团队不存在' },
        { status: 404 }
      )
    }

    const password = decrypt(team.password)

    const profileRoot = path.join(process.cwd(), '.automation-profiles')
    const profileDir = path.join(profileRoot, teamId)
    await fs.mkdir(profileDir, { recursive: true })

    const client = new OpenAIAutomationClient()
    await client.initialize({
      userDataDir: profileDir,
      headless: false,
      usePool: false,
    })

    const loggedIn = await client.loginChatGPT(team.email, password, {
      allowManual: true,
      timeoutMs: 12 * 60 * 1000,
    })

    if (!loggedIn) {
      await client.close()
      return NextResponse.json(
        { success: false, message: '登录失败或超时（可能需要验证码/2FA）' },
        { status: 400 }
      )
    }

    const page = (client as any).page
    if (page) {
      const cookies = await page.cookies()
      await prisma.team.update({
        where: { id: teamId },
        data: {
          cookies: JSON.stringify(cookies),
          status: 'active',
          lastLoginCheckAt: new Date(),
          loginError: null,
        },
      })
    }

    await client.close()

    return NextResponse.json({
      success: true,
      message: '初始化登录成功，已保存登录状态',
    })
  } catch (error) {
    console.error('Init login failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: `初始化登录失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    )
  }
}
