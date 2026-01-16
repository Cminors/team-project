import { TeamForm } from '@/components/teams/team-form'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewTeamPage() {
  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Link href="/teams">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回团队列表
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">添加新团队</h1>
        <p className="text-muted-foreground">
          添加一个新的 GPT 团队账号到管理系统
        </p>
      </div>

      <TeamForm mode="create" />
    </div>
  )
}
