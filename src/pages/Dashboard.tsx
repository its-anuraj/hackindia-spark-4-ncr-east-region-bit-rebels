import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { StatCard } from '@/components/dashboard/StatCard'
import { AVAILABILITY_CONFIG, BADGE_DEFINITIONS } from '../data/sampleData'
import {
  Users, FolderKanban, TrendingUp, AlertTriangle, CheckCircle2,
  Brain, Clock, DollarSign, Cpu, Star, Activity, ArrowRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import { cn } from '../lib/utils'

const PRODUCTIVITY_DATA = [
  { month: 'Oct', productivity: 72, success: 68, completion: 75 },
  { month: 'Nov', productivity: 78, success: 74, completion: 80 },
  { month: 'Dec', productivity: 82, success: 79, completion: 84 },
  { month: 'Jan', productivity: 85, success: 83, completion: 87 },
  { month: 'Feb', productivity: 88, success: 86, completion: 90 },
  { month: 'Mar', productivity: 91, success: 89, completion: 93 },
]

const DEPT_DATA = [
  { dept: 'Engineering', count: 3, color: '#0EA5E9' },
  { dept: 'AI Research', count: 1, color: '#6366F1' },
  { dept: 'Design', count: 1, color: '#EC4899' },
  { dept: 'Product', count: 1, color: '#F59E0B' },
  { dept: 'Infrastructure', count: 1, color: '#10B981' },
  { dept: 'Security', count: 1, color: '#EF4444' },
]

const SKILL_DEMAND = [
  { skill: 'React', demand: 90 },
  { skill: 'Python', demand: 85 },
  { skill: 'AWS', demand: 78 },
  { skill: 'Node.js', demand: 72 },
  { skill: 'LLM/AI', demand: 95 },
  { skill: 'DevOps', demand: 70 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{p.value}%</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function Dashboard() {
  const { employees: allEmployees, projects: allProjects, setActivePage, currentUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<'productivity' | 'skills'>('productivity')

  const isEmp = currentUser?.role === 'employee'
  const empProfile = isEmp ? allEmployees.find(e => e.id === currentUser.id) : null
  const employees = isEmp ? (empProfile ? [empProfile] : []) : allEmployees
  const projects = isEmp ? allProjects.filter(p => p.teamMembers.some(id => employees.map(e=>e.id).includes(id))) : allProjects

  const activeProjects = projects.filter((p) => p.status === 'active')
  const completedProjects = projects.filter((p) => p.status === 'completed')
  const freeEmployees = employees.filter((e) => e.availability === 'free')
  const avgSuccessRate = Math.round(employees.reduce((acc, e) => acc + e.successRate, 0) / employees.length)

  const topEmployees = [...employees].sort((a, b) => b.xpPoints - a.xpPoints).slice(0, 5)
  const riskProjects = projects.filter((p) => p.riskScore > 30).sort((a, b) => b.riskScore - a.riskScore)

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden p-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 right-48 w-40 h-40 bg-accent/10 rounded-full translate-y-1/2 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> AI Orchestrator Active
            </p>
            <h2 className="text-xl font-bold text-foreground mb-1">Hello, {currentUser?.name || 'User'} 👋</h2>
            <p className="text-sm text-muted-foreground">
              {isEmp ? (
                <>You are currently assigned to <span className="text-primary font-semibold">{activeProjects.length} active projects</span> and have <span className="text-emerald-400 font-semibold">{completedProjects.length} completed milestones</span>.</>
              ) : (
                <>You have <span className="text-primary font-semibold">{activeProjects.length} active projects</span>, {' '}
                <span className="text-amber-400 font-semibold">{riskProjects.length} at risk</span>, and{' '}
                <span className="text-emerald-400 font-semibold">{freeEmployees.length} available employees</span>.</>
              )}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {!isEmp && (
              <button
                onClick={() => setActivePage('ai-team-builder')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Build Team
              </button>
            )}
            <button
              onClick={() => setActivePage('ai-assistant')}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={employees.length}
          subtitle={`${freeEmployees.length} available now`}
          icon={Users}
          iconBg="bg-primary/15"
          iconColor="text-primary"
          trend={{ value: 12, label: 'vs last month' }}
          gradient
          className="animate-fade-in stagger-1"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          subtitle={`${completedProjects.length} completed`}
          icon={FolderKanban}
          iconBg="bg-accent/15"
          iconColor="text-accent"
          trend={{ value: 8, label: 'vs last quarter' }}
          className="animate-fade-in stagger-2"
        />
        <StatCard
          title="Avg Success Rate"
          value={`${avgSuccessRate}%`}
          subtitle="Across all projects"
          icon={TrendingUp}
          iconBg="bg-emerald-400/15"
          iconColor="text-emerald-400"
          trend={{ value: 4.2, label: 'vs last month' }}
          className="animate-fade-in stagger-3"
        />
        <StatCard
          title="At Risk"
          value={riskProjects.length}
          subtitle="Projects need attention"
          icon={AlertTriangle}
          iconBg="bg-amber-400/15"
          iconColor="text-amber-400"
          trend={{ value: -1, label: 'vs last week' }}
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Productivity Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 animate-fade-in stagger-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Team Performance</h3>
              <p className="text-xs text-muted-foreground">6-month trend analysis</p>
            </div>
            <div className="flex gap-1">
              {(['productivity', 'skills'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-md font-medium transition-all',
                    activeTab === tab
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab === 'productivity' ? 'Productivity' : 'Skills'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {activeTab === 'productivity' ? (
              <AreaChart data={PRODUCTIVITY_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSucc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 18%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="productivity" name="Productivity" stroke="hsl(199 89% 48%)" fill="url(#colorProd)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="success" name="Success Rate" stroke="hsl(239 84% 67%)" fill="url(#colorSucc)" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={SKILL_DEMAND} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 18%)" />
                <XAxis dataKey="skill" tick={{ fontSize: 10, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="demand" name="Demand" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="bg-card border border-border rounded-xl p-5 animate-fade-in stagger-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Departments</h3>
          <p className="text-xs text-muted-foreground mb-4">Team distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={DEPT_DATA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="count"
              >
                {DEPT_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(220 40% 11%)', border: '1px solid hsl(220 30% 18%)', borderRadius: 8, fontSize: 12 }}
                formatter={(val) => [`${val} members`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {DEPT_DATA.slice(0, 4).map((d) => (
              <div key={d.dept} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] text-muted-foreground truncate">{d.dept}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Projects */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Active Projects</h3>
            <button
              onClick={() => setActivePage('projects')}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {activeProjects.map((proj) => (
              <div key={proj.id} className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{proj.name}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    proj.riskScore > 40 ? 'bg-red-400/15 text-red-400' :
                    proj.riskScore > 25 ? 'bg-amber-400/15 text-amber-400' :
                    'bg-emerald-400/15 text-emerald-400'
                  )}>
                    {proj.riskScore > 40 ? 'High Risk' : proj.riskScore > 25 ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{proj.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {proj.teamMembers.length} members</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {proj.deadline}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${(proj.budget / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top Performers</h3>
          </div>
          <div className="space-y-3">
            {topEmployees.map((emp, idx) => (
              <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  idx === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-400' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-600' :
                  'bg-secondary text-muted-foreground'
                )}>
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                  {emp.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary">{emp.xpPoints.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">XP · Lv.{emp.level}</p>
                </div>
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  AVAILABILITY_CONFIG[emp.availability].dot
                )} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          isEmp 
            ? { label: 'My Success Rate', value: `${empProfile?.successRate || 85}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' }
            : { label: 'Teams Assembled by AI', value: '47', icon: Brain, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Risks Predicted', value: isEmp ? '2' : '23', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Projects Completed', value: completedProjects.length.toString(), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Skills Tracked', value: isEmp ? (empProfile?.skills?.length || 0).toString() : '120+', icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
        ].map((stat, i) => (
          <div key={stat.label} className={`bg-card border border-border rounded-xl p-4 flex items-center gap-3 animate-fade-in stagger-${i + 1}`}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
