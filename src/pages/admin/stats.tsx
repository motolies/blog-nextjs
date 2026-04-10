import React, {useState, useEffect, useCallback} from 'react'
import ReactECharts from 'echarts-for-react'
import {toast} from 'sonner'
import {Eye, FileText, FolderTree, Tags, TrendingUp} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import service from '../../service'
import type {StatsOverview} from '../../types/stats'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select'
import {Skeleton} from '../../components/ui/skeleton'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  color: string
}

function StatCard({icon: Icon, label, value, color}: StatCardProps) {
  return (
    <div className="admin-panel admin-panel-pad flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-[color:var(--admin-text-secondary)]">{label}</p>
        <p className="text-2xl font-bold text-[color:var(--admin-text)]">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [data, setData] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendDays, setTrendDays] = useState('30')

  const loadStats = useCallback(async (days: number) => {
    try {
      setLoading(true)
      const response = await service.stats.getOverview(days)
      setData(response)
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error)
      toast.error('통계 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats(Number(trendDays))
  }, [trendDays, loadStats])

  const handleDaysChange = (value: string) => {
    setTrendDays(value)
  }

  const getViewTrendOptions = () => {
    if (!data) return {}
    const {viewTrend} = data

    return {
      title: {text: '일별 조회수 추이', left: 'center', textStyle: {fontSize: 14}},
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0]
          return `${p.axisValue}<br/>조회수: <strong>${p.value.toLocaleString()}</strong>`
        },
      },
      grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
      xAxis: {
        type: 'category',
        data: viewTrend.map(v => v.date),
        axisLabel: {rotate: 45, fontSize: 11},
      },
      yAxis: {type: 'value', name: '조회수', minInterval: 1},
      series: [{
        type: 'line',
        data: viewTrend.map(v => v.count),
        smooth: true,
        areaStyle: {opacity: 0.15},
        lineStyle: {width: 2},
        itemStyle: {color: '#0ea5e9'},
      }],
    }
  }

  const getCategoryDistributionOptions = () => {
    if (!data) return {}
    const {categoryDistribution} = data

    return {
      title: {text: '카테고리별 포스트 분포', left: 'center', textStyle: {fontSize: 14}},
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}개 ({d}%)',
      },
      legend: {type: 'scroll', bottom: 0, left: 'center'},
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {borderRadius: 6, borderColor: '#fff', borderWidth: 2},
        label: {show: false},
        emphasis: {label: {show: true, fontSize: 13, fontWeight: 'bold'}},
        data: categoryDistribution.map(c => ({name: c.categoryName, value: c.postCount})),
      }],
    }
  }

  const getTagDistributionOptions = () => {
    if (!data) return {}
    const {tagDistribution} = data
    const sorted = [...tagDistribution].sort((a, b) => a.postCount - b.postCount)

    return {
      title: {text: '태그별 포스트 분포 (Top 20)', left: 'center', textStyle: {fontSize: 14}},
      tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}},
      grid: {left: '3%', right: '8%', bottom: '3%', top: '15%', containLabel: true},
      xAxis: {type: 'value', minInterval: 1},
      yAxis: {
        type: 'category',
        data: sorted.map(t => t.tagName),
        axisLabel: {fontSize: 11},
      },
      series: [{
        type: 'bar',
        data: sorted.map(t => t.postCount),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              {offset: 0, color: '#6366f1'},
              {offset: 1, color: '#8b5cf6'},
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
      }],
    }
  }

  return (
    <AdminPageFrame
      actions={(
        <div className="w-44">
          <Select value={trendDays} onValueChange={handleDaysChange}>
            <SelectTrigger>
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">최근 7일</SelectItem>
              <SelectItem value="14">최근 14일</SelectItem>
              <SelectItem value="30">최근 30일</SelectItem>
              <SelectItem value="90">최근 90일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    >
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="admin-panel admin-panel-pad">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
          <div className="admin-panel admin-panel-pad">
            <Skeleton className="h-[350px] w-full" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-5">
            <StatCard icon={FileText} label="총 포스트" value={data.totalPosts} color="bg-sky-500" />
            <StatCard icon={Eye} label="총 조회수" value={data.totalViews} color="bg-emerald-500" />
            <StatCard icon={TrendingUp} label="오늘 조회수" value={data.todayViews} color="bg-amber-500" />
            <StatCard icon={FolderTree} label="카테고리" value={data.totalCategories} color="bg-violet-500" />
            <StatCard icon={Tags} label="태그" value={data.totalTags} color="bg-rose-500" />
          </div>

          {/* View Trend Chart */}
          <div className="admin-panel admin-panel-pad mb-4">
            <ReactECharts option={getViewTrendOptions()} style={{height: '350px'}} />
          </div>

          {/* Popular Posts Table */}
          <div className="admin-panel overflow-x-auto mb-4">
            <div className="px-4 py-3 border-b border-[color:var(--admin-border)]">
              <h3 className="text-sm font-semibold text-[color:var(--admin-text)]">
                인기 포스트 Top 10
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[color:var(--admin-border)] bg-slate-50/80 px-4 py-2.5 text-left font-bold text-[color:var(--admin-text)]">순위</th>
                  <th className="border-b border-[color:var(--admin-border)] bg-slate-50/80 px-4 py-2.5 text-left font-bold text-[color:var(--admin-text)]">제목</th>
                  <th className="border-b border-[color:var(--admin-border)] bg-slate-50/80 px-4 py-2.5 text-left font-bold text-[color:var(--admin-text)]">카테고리</th>
                  <th className="border-b border-[color:var(--admin-border)] bg-slate-50/80 px-4 py-2.5 text-right font-bold text-[color:var(--admin-text)]">조회수</th>
                </tr>
              </thead>
              <tbody>
                {data.popularPosts.map((post, index) => (
                  <tr key={post.id} className="text-[color:var(--admin-text-secondary)] hover:bg-sky-500/5">
                    <td className="border-b border-[color:var(--admin-border)] px-4 py-2">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        index < 3 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="border-b border-[color:var(--admin-border)] px-4 py-2">
                      <a
                        href={`/post/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {post.subject}
                      </a>
                    </td>
                    <td className="border-b border-[color:var(--admin-border)] px-4 py-2">{post.categoryName}</td>
                    <td className="border-b border-[color:var(--admin-border)] px-4 py-2 text-right font-medium">
                      {post.viewCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="admin-panel admin-panel-pad">
              <ReactECharts option={getCategoryDistributionOptions()} style={{height: '400px'}} />
            </div>
            <div className="admin-panel admin-panel-pad">
              <ReactECharts option={getTagDistributionOptions()} style={{height: '400px'}} />
            </div>
          </div>
        </>
      ) : null}
    </AdminPageFrame>
  )
}
