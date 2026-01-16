import { NextResponse } from 'next/server'
import { assistedLogin } from '@/lib/automation/assisted-login'

export async function POST() {
  try {
    console.log('开始辅助登录流程...')

    const result = await assistedLogin()

    return NextResponse.json(result)
  } catch (error) {
    console.error('辅助登录 API 错误:', error)
    return NextResponse.json(
      {
        success: false,
        message: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    )
  }
}
