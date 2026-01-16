import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/utils/crypto'
import { CreateInviteJobInput } from '@/lib/utils/validation'
import { InviteJob } from '@prisma/client'
import { OpenAIAutomationClient } from '@/lib/automation/openai-client'
import { memberService } from './member.service'
import { promises as fs } from 'fs'
import path from 'path'

interface InviteJobLog {
  timestamp: string
  email: string
  status: 'success' | 'failed'
  error?: string
}

export class InviteService {
  async getInviteJobsByTeamId(teamId: string): Promise<InviteJob[]> {
    return await prisma.inviteJob.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getInviteJobById(id: string): Promise<InviteJob | null> {
    return await prisma.inviteJob.findUnique({
      where: { id },
      include: { team: true },
    })
  }

  async createInviteJob(input: CreateInviteJobInput): Promise<InviteJob> {
    // Create member records for all emails
    await memberService.createMembers(input.teamId, input.emails)

    return await prisma.inviteJob.create({
      data: {
        teamId: input.teamId,
        emails: JSON.stringify(input.emails),
        totalCount: input.emails.length,
        status: 'pending',
      },
    })
  }

  async executeInviteJob(jobId: string): Promise<{
    success: boolean
    message: string
  }> {
    const job = await prisma.inviteJob.findUnique({
      where: { id: jobId },
      include: { team: true },
    })

    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    if (job.status === 'running') {
      return { success: false, message: 'Job is already running' }
    }

    try {
      // Update job status to running
      await prisma.inviteJob.update({
        where: { id: jobId },
        data: {
          status: 'running',
          startedAt: new Date(),
        },
      })

      const emails: string[] = JSON.parse(job.emails)
      const logs: InviteJobLog[] = []

      // Get team credentials
      const password = decrypt(job.team.password)

      // Initialize automation client
      const client = new OpenAIAutomationClient()
      const profileRoot =
        process.env.OPENAI_AUTOMATION_PROFILE_DIR ||
        path.join(process.cwd(), '.automation-profiles')
      const profileDir = path.join(profileRoot, job.teamId)
      await fs.mkdir(profileDir, { recursive: true })
      await client.initialize({ userDataDir: profileDir })

      // 获取page对象
      const page = (client as any).page
      if (!page) {
        throw new Error('无法获取浏览器页面对象')
      }

      await page.goto('https://chatgpt.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 尝试使用cookies自动登录
      let needsLogin = !(await client.isChatGPTLoggedIn())
      if (!needsLogin) {
        console.log('已检测到登录状态，跳过登录')
      }
      if (needsLogin && job.team.cookies) {
        try {
          console.log('步骤1: 尝试使用已保存的登录信息...')

          // 设置cookies
          const cookies = JSON.parse(job.team.cookies)
          await page.setCookie(...cookies)

          console.log('Cookies已设置，重新加载页面...')

          // 重新加载页面以应用cookies
          await page.goto('https://chatgpt.com/', {
            waitUntil: 'networkidle2',
            timeout: 30000,
          })

          await new Promise(resolve => setTimeout(resolve, 2000))

          // 检查是否已登录
          const isLoggedIn = await client.isChatGPTLoggedIn()
          console.log('当前URL:', page.url())

          if (isLoggedIn) {
            console.log('使用已保存的登录信息成功！')
            needsLogin = false
          } else {
            console.log('Cookies已过期或未登录，需要重新登录')
          }
        } catch (error) {
          console.log('加载cookies失败，需要重新登录:', error)
        }
      }

      // 如果需要登录，使用ChatGPT登录流程
      if (needsLogin) {
        console.log('步骤1: 登录 ChatGPT...')
        const loginSuccess = await client.loginChatGPT(job.team.email, password, {
          allowManual: process.env.OPENAI_AUTOMATION_INTERACTIVE === 'true',
        })
        if (!loginSuccess) {
          await client.close()

          await prisma.inviteJob.update({
            where: { id: jobId },
            data: {
              status: 'failed',
              completedAt: new Date(),
              logs: JSON.stringify([
                {
                  timestamp: new Date().toISOString(),
                  error: 'Login failed',
                },
              ]),
            },
          })

          return { success: false, message: 'Login failed' }
        }

        // 保存新的cookies
        if (page) {
          const newCookies = await page.cookies()
          await prisma.team.update({
            where: { id: job.teamId },
            data: {
              cookies: JSON.stringify(newCookies),
            },
          })
        }
      }

      // 直接导航到成员管理页面
      console.log('步骤2: 导航到成员管理页面...')
      const navigated = await client.navigateToChatGPTMembers('members')
      if (!navigated) {
        throw new Error('无法导航到成员管理页面（可能需要选择工作空间）')
      }

      if (!(await client.isChatGPTLoggedIn())) {
        throw new Error('未登录或会话已失效，无法访问成员管理页面')
      }

      // Invite members with progress tracking
      const result = await client.inviteMembers(emails, {
        delayMs: job.team.inviteIntervalMs,
        onProgress: async (progress) => {
          const log: InviteJobLog = {
            timestamp: new Date().toISOString(),
            email: progress.email,
            status: progress.status,
            error: progress.error,
          }
          logs.push(log)

          // Update member status
          const member = await prisma.member.findUnique({
            where: {
              teamId_email: {
                teamId: job.teamId,
                email: progress.email,
              },
            },
          })

          if (member) {
            await memberService.updateMemberStatus(
              member.id,
              progress.status === 'success' ? 'invited' : 'failed',
              progress.error
            )
          }

          // Update job progress
          await prisma.inviteJob.update({
            where: { id: jobId },
            data: {
              successCount: logs.filter((l) => l.status === 'success').length,
              failCount: logs.filter((l) => l.status === 'failed').length,
              logs: JSON.stringify(logs),
            },
          })
        },
      })

      await client.close()

      // Update job status to completed
      await prisma.inviteJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          successCount: result.success,
          failCount: result.failed,
          logs: JSON.stringify(logs),
        },
      })

      // Update team stats
      await prisma.team.update({
        where: { id: job.teamId },
        data: {
          lastInviteAt: new Date(),
        },
      })

      return {
        success: true,
        message: `Completed: ${result.success} successful, ${result.failed} failed`,
      }
    } catch (error) {
      console.error('Error executing invite job:', error)

      await prisma.inviteJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          logs: JSON.stringify([
            {
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          ]),
        },
      })

      return {
        success: false,
        message: `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async getJobLogs(jobId: string): Promise<InviteJobLog[]> {
    const job = await prisma.inviteJob.findUnique({
      where: { id: jobId },
    })

    if (!job || !job.logs) {
      return []
    }

    try {
      return JSON.parse(job.logs)
    } catch {
      return []
    }
  }
}

export const inviteService = new InviteService()
