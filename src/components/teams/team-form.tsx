'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

const teamSchema = z.object({
  name: z.string().min(1, '团队名称不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  description: z.string().optional(),
  teamUrl: z.string().url('请输入有效的URL').optional().or(z.literal('')),
})

type TeamFormData = z.infer<typeof teamSchema>

interface TeamFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<TeamFormData>
  teamId?: string
}

export function TeamForm({ mode, initialData, teamId }: TeamFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAssistedLogin, setIsAssistedLogin] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      password: '',
      description: '',
      teamUrl: '',
    },
  })

  // 辅助添加功能
  const handleAssistedAdd = async () => {
    setIsAssistedLogin(true)
    setStatusMessage({
      type: 'info',
      text: '正在打开浏览器窗口，请在浏览器中登录 ChatGPT（可能需要验证码/2FA）...',
    })

    try {
      const response = await fetch('/api/auth/assisted-login', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        // 自动填充邮箱
        if (result.email) {
          setValue('email', result.email)
        }

        setStatusMessage({
          type: 'success',
          text: result.message + ' 请填写其他信息并提交。',
        })

        // 保存 cookies 到 sessionStorage，稍后提交时使用
        if (result.cookies) {
          sessionStorage.setItem('chatgpt_cookies', JSON.stringify(result.cookies))
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || '辅助登录失败',
        })
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: '辅助登录失败: ' + (error instanceof Error ? error.message : '未知错误'),
      })
    } finally {
      setIsAssistedLogin(false)
    }
  }

  // 表单提交
  const onSubmit = async (data: TeamFormData) => {
    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      // 从 sessionStorage 获取 cookies（如果有）
      const cookiesStr =
        sessionStorage.getItem('chatgpt_cookies') ||
        sessionStorage.getItem('openai_cookies')
      const cookies = cookiesStr ? JSON.parse(cookiesStr) : null

      const payload = {
        ...data,
        cookies: cookies,
      }

      const url = mode === 'create' ? '/api/teams' : `/api/teams/${teamId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          text: mode === 'create' ? '团队创建成功！' : '团队更新成功！',
        })

        // 清除 sessionStorage
        sessionStorage.removeItem('chatgpt_cookies')
        sessionStorage.removeItem('openai_cookies')

        // 创建后可选进行一次初始化登录（保存会话，后续自动化无需重复登录）
        if (mode === 'create' && result?.id) {
          const shouldInit = confirm(
            '是否现在初始化登录 ChatGPT 并保存登录状态？（会打开浏览器窗口，可能需要验证码/2FA）'
          )
          if (shouldInit) {
            setStatusMessage({
              type: 'info',
              text: '正在初始化登录，请在打开的浏览器窗口中完成登录...',
            })

            try {
              const initResp = await fetch(`/api/teams/${result.id}/init-login`, {
                method: 'POST',
              })
              const initResult = await initResp.json()
              setStatusMessage({
                type: initResp.ok ? 'success' : 'error',
                text:
                  initResult.message ||
                  (initResp.ok ? '初始化登录成功' : '初始化登录失败'),
              })
            } catch (e) {
              setStatusMessage({
                type: 'error',
                text: '初始化登录失败，请稍后在团队详情页点击“初始化登录”重试',
              })
            }
          }

          router.push(`/teams/${result.id}`)
          return
        }

        // 跳转到团队列表或详情页
        setTimeout(() => {
          if (mode === 'create') {
            router.push('/teams')
          } else {
            router.push(`/teams/${teamId}`)
          }
        }, 1000)
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || '操作失败',
        })
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: '操作失败: ' + (error instanceof Error ? error.message : '未知错误'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? '创建新团队' : '编辑团队'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? '添加一个新的 GPT 团队到管理系统'
            : '更新团队信息'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 状态消息 */}
        {statusMessage && (
          <div
            className={`mb-4 p-4 rounded-md ${
              statusMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* 辅助添加按钮 */}
        {mode === 'create' && (
          <div className="mb-6">
            <Button
              type="button"
              onClick={handleAssistedAdd}
              disabled={isAssistedLogin}
              variant="outline"
              className="w-full border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
            >
              {isAssistedLogin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在打开浏览器...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  辅助添加（自动登录）
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              点击后会打开浏览器窗口，在浏览器中登录 ChatGPT，系统会自动保存登录信息（用于后续自动化）
            </p>
            <div className="my-4 flex items-center">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-4 text-xs text-muted-foreground">或手动填写</span>
              <div className="flex-1 border-t border-border"></div>
            </div>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 团队名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              团队名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="例如：Marketing Team"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">
              邮箱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="team@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              密码 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="输入账号密码"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              密码将被加密存储
            </p>
          </div>

          {/* 团队 URL */}
          <div className="space-y-2">
            <Label htmlFor="teamUrl">团队 URL</Label>
            <Input
              id="teamUrl"
              type="url"
              placeholder="https://platform.openai.com/..."
              {...register('teamUrl')}
            />
            {errors.teamUrl && (
              <p className="text-sm text-red-500">{errors.teamUrl.message}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="团队描述或备注信息"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? '创建中...' : '更新中...'}
                </>
              ) : (
                <>{mode === 'create' ? '创建团队' : '更新团队'}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
