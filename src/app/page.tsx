import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, Users, Shield, Zap, Activity, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="container relative pb-24 pt-20 sm:pt-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <Zap className="mr-2 h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">强大的团队管理工具</span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            GPT 团队管理器
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            统一管理多个 OpenAI GPT 团队账号，支持自动化成员邀请，让团队协作更高效
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                进入仪表板
              </Button>
            </Link>
            <Link href="/teams">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Users className="mr-2 h-5 w-5" />
                管理团队
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">核心功能</h2>
            <p className="text-muted-foreground">
              提供完整的团队管理解决方案
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>集中管理</CardTitle>
                <CardDescription>
                  在单一仪表板中管理多个 OpenAI 团队账号
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>自动化邀请</CardTitle>
                <CardDescription>
                  使用浏览器自动化技术批量邀请团队成员
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>安全加密</CardTitle>
                <CardDescription>
                  使用 AES-256-GCM 加密保护账号凭据安全
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>进度追踪</CardTitle>
                <CardDescription>
                  实时监控邀请任务状态和执行进度
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>成员管理</CardTitle>
                <CardDescription>
                  追踪邀请状态，管理团队成员列表
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>数据统计</CardTitle>
                <CardDescription>
                  详细的统计数据和邀请成功率分析
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-24">
        <Card className="mx-auto max-w-3xl border-2 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-8">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">开始使用</h2>
              <p className="mb-6 text-muted-foreground">
                立即创建你的第一个团队，体验高效的团队管理
              </p>
              <Link href="/teams">
                <Button size="lg">
                  <Users className="mr-2 h-5 w-5" />
                  创建团队
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
