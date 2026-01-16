'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, Mail, CheckCircle, XCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react'

interface DashboardStats {
  totalTeams: number
  activeTeams: number
  totalMembers: number
  totalInvites: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    activeTeams: 0,
    totalMembers: 0,
    totalInvites: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/teams')
      const teams = await response.json()

      const totalTeams = teams.length
      const activeTeams = teams.filter((t: any) => t.status === 'active').length
      const totalMembers = teams.reduce(
        (sum: number, t: any) => sum + t.memberCount,
        0
      )

      setStats({
        totalTeams,
        activeTeams,
        totalMembers,
        totalInvites: 0,
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">仪表板</h1>
        <p className="text-muted-foreground">
          概览你的 GPT 团队管理数据
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">团队总数</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeTeams} 个活跃
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃团队</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTeams - stats.activeTeams} 个未激活
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成员总数</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有团队成员
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">邀请总数</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalInvites}</div>
            <p className="text-xs text-muted-foreground mt-1">
              成功发送
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              快速操作
            </CardTitle>
            <CardDescription>
              常用的团队管理任务
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/teams/new">
              <Button className="w-full justify-between" size="lg">
                <span className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  添加新团队
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/teams">
              <Button className="w-full justify-between" variant="outline" size="lg">
                <span className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  查看所有团队
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle>使用指南</CardTitle>
            <CardDescription>
              设置你的 GPT 团队管理系统
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </div>
                <p className="text-sm">添加你的第一个团队账号</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </div>
                <p className="text-sm">验证团队凭据</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </div>
                <p className="text-sm">导入或添加成员邮箱</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </div>
                <p className="text-sm">开始批量邀请</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
