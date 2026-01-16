import puppeteer, { Browser, Page } from 'puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { addExtra } from 'puppeteer-extra'

// Add stealth plugin
const puppeteerExtra = addExtra(puppeteer as any)
puppeteerExtra.use(StealthPlugin())

// 创建可见的浏览器用于辅助登录
export async function createVisibleBrowser(): Promise<Browser> {
  return await puppeteerExtra.launch({
    headless: false, // 可见模式
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1200x900',
      '--start-maximized',
    ],
  }) as Browser
}

// 辅助登录函数
export async function assistedLogin(): Promise<{
  success: boolean
  email?: string
  cookies?: any[]
  message: string
}> {
  let browser: Browser | null = null

  try {
    console.log('打开浏览器窗口...')
    browser = await createVisibleBrowser()
    const page = await browser.newPage()

    // 导航到 ChatGPT 成员管理页（确保登录后进入正确上下文）
    await page.goto('https://chatgpt.com/admin/members?tab=members', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('等待用户登录 ChatGPT...')

    // 给页面加一个提示条（不使用 alert，避免阻塞交互）
    await page.evaluate(() => {
      const existing = document.getElementById('automation-login-hint')
      if (existing) existing.remove()
      const hint = document.createElement('div')
      hint.id = 'automation-login-hint'
      hint.style.position = 'fixed'
      hint.style.top = '12px'
      hint.style.left = '12px'
      hint.style.right = '12px'
      hint.style.zIndex = '2147483647'
      hint.style.background = '#fff8e1'
      hint.style.color = '#1f2937'
      hint.style.border = '1px solid #f59e0b'
      hint.style.borderRadius = '8px'
      hint.style.padding = '12px 16px'
      hint.style.fontSize = '14px'
      hint.style.fontFamily = 'system-ui, -apple-system, Segoe UI, sans-serif'
      hint.textContent =
        '请在此窗口完成 ChatGPT 登录（可能包含验证码/2FA），并确保能打开 Members 页面。登录完成后系统会自动保存登录状态。'
      document.body.appendChild(hint)
    })

    // 等待用户登录成功：不在 auth/login 且不出现登录弹窗（邮箱输入/第三方登录按钮）
    await page.waitForFunction(
      () => {
        const url = window.location.href
        if (url.includes('/auth') || url.includes('/login')) return false

        const emailInput = document.querySelector(
          'input[type="email"], input[name="email"], input[autocomplete="username"]'
        )
        if (emailInput) return false

        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
        const hasProviders = buttons.some(btn => {
          const text = (btn.textContent || '').trim().toLowerCase()
          return (
            text.includes('continue with google') ||
            text.includes('continue with apple') ||
            text.includes('continue with microsoft') ||
            text.includes('continue with phone') ||
            text.includes('log in') ||
            text.includes('sign in') ||
            text.includes('sign up')
          )
        })

        if (hasProviders) return false

        return url.includes('/admin/members')
      },
      { timeout: 12 * 60 * 1000 } // 12分钟超时（验证码/2FA 留足时间）
    )

    console.log('登录成功，提取信息...')

    // 等待页面完全加载
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 尝试获取用户邮箱
    let email = ''
    try {
      // 尝试多种方式获取邮箱
      email = await page.evaluate(() => {
        const bodyText = document.body.innerText || ''
        const emailMatch = bodyText.match(/[\w.+-]+@[\w.-]+\.\w+/)
        if (emailMatch) return emailMatch[0]

        return ''
      })
    } catch (err) {
      console.log('无法自动提取邮箱')
    }

    // 获取 cookies
    const cookies = await page.cookies()

    await browser.close()

    return {
      success: true,
      email: email || undefined,
      cookies: cookies,
      message: email ? `登录成功！检测到邮箱：${email}` : '登录成功！',
    }
  } catch (error) {
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        // 忽略关闭错误
      }
    }

    console.error('辅助登录失败:', error)

    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        success: false,
        message: '登录超时（12分钟），请重试',
      }
    }

    return {
      success: false,
      message: `辅助登录失败: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()

  // Set a realistic viewport
  await page.setViewport({ width: 1920, height: 1080 })

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  })

  return page
}
