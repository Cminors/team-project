import { NextRequest, NextResponse } from 'next/server'
import { OpenAIAutomationClient } from '@/lib/automation/openai-client'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 初始化浏览器客户端（使用有头模式以便用户看到）
    const client = new OpenAIAutomationClient()
    await client.initialize()

    // 尝试登录
    const loginSuccess = await client.login(email, password)

    await client.close()

    if (loginSuccess) {
      return NextResponse.json({
        success: true,
        message: '登录成功！凭据验证通过',
        email,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '登录失败，请检查邮箱和密码是否正确',
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('辅助登录错误:', error)
    return NextResponse.json(
      {
        success: false,
        message: `登录过程出错: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    )
  }
}
