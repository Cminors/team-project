import { NextRequest, NextResponse } from 'next/server'
import { teamService } from '@/lib/services/team.service'
import { decrypt } from '@/lib/utils/crypto'
import { createVisibleBrowser } from '@/lib/automation/assisted-login'

export async function POST(request: NextRequest) {
  try {
    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    const team = await teamService.getTeamById(teamId)
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // 获取解密的密码
    const password = decrypt(team.password)

    // 创建可见浏览器
    const browser = await createVisibleBrowser()
    const page = await browser.newPage()

    // 登录
    await page.goto('https://platform.openai.com/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // 填写邮箱
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    })
    await page.type('input[type="email"], input[name="email"]', team.email, {
      delay: 100,
    })

    await new Promise(resolve => setTimeout(resolve, 500))

    // 点击继续
    const continueButton = await page.$('button[type="submit"]')
    if (continueButton) {
      await continueButton.click()
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // 填写密码
    await page.waitForSelector(
      'input[type="password"], input[name="password"]',
      { timeout: 10000 }
    )
    await page.type(
      'input[type="password"], input[name="password"]',
      password,
      { delay: 100 }
    )

    await new Promise(resolve => setTimeout(resolve, 500))

    // 提交登录
    const submitButton = await page.$('button[type="submit"]')
    if (submitButton) {
      await submitButton.click()
    }

    // 等待登录完成
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 导航到成员页面
    await page.goto('https://platform.openai.com/settings/organization/members', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    // 获取页面 HTML 用于调试
    const pageContent = await page.content()

    // 尝试多种可能的选择器
    const possibleSelectors = [
      '[data-testid="member-email"]',
      '[data-testid="member-row"]',
      '.member-email',
      '.member-row',
      '[role="row"]',
      'table tr',
      '[class*="member"]',
      '[class*="email"]',
    ]

    const results: any = {}

    for (const selector of possibleSelectors) {
      try {
        const elements = await page.$$(selector)
        results[selector] = {
          count: elements.length,
          samples: []
        }

        // 获取前3个元素的内容作为样本
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const text = await elements[i].evaluate(el => el.textContent)
          const html = await elements[i].evaluate(el => el.outerHTML.substring(0, 200))
          results[selector].samples.push({
            text: text?.substring(0, 100),
            html: html
          })
        }
      } catch (e) {
        results[selector] = { error: 'Selector not found or error' }
      }
    }

    // 截图保存到临时目录
    const screenshotPath = `/tmp/openai-members-${Date.now()}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })

    console.log('=== 成员页面调试信息 ===')
    console.log('截图已保存到:', screenshotPath)
    console.log('选择器测试结果:', JSON.stringify(results, null, 2))

    return NextResponse.json({
      success: true,
      message: '浏览器窗口已打开，请手动检查页面结构。检查完成后关闭浏览器窗口。',
      screenshotPath,
      selectorResults: results,
      note: '浏览器窗口将保持打开状态30秒，用于手动检查。之后自动关闭。',
    })

    // 保持浏览器打开30秒用于调试
    setTimeout(async () => {
      await browser.close()
    }, 30000)

  } catch (error) {
    console.error('调试失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
