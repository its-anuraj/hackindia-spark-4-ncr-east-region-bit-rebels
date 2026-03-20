import { useState } from 'react'
import { useAppStore, type Project } from '../store/appStore'
import {
  AlertTriangle, TrendingDown, DollarSign, Clock, Shield,
  ChevronRight, Brain, AlertCircle, CheckCircle2, Zap, ArrowRight
} from 'lucide-react'
import { cn } from '../lib/utils'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend
} from 'recharts'

const RISK_THRESHOLDS = {
  low: { max: 25, label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25', dot: 'bg-emerald-400' },
  medium: { max: 50, label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/25', dot: 'bg-amber-400' },
  high: { max: 100, label: 'High Risk', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/25', dot: 'bg-red-400' },
}

function getRiskLevel(score: number) {
  if (score <= 25) return RISK_THRESHOLDS.low
  if (score <= 50) return RISK_THRESHOLDS.medium
  return RISK_THRESHOLDS.high
}

const HISTORICAL_RISK = [
  { month: 'Oct', delay: 28, failure: 12, budget: 20 },
  { month: 'Nov', delay: 32, failure: 15, budget: 25 },
  { month: 'Dec', delay: 25, failure: 10, budget: 18 },
  { month: 'Jan', delay: 22, failure: 9, budget: 15 },
  { month: 'Feb', delay: 18, failure: 7, budget: 12 },
  { month: 'Mar', delay: 24, failure: 10, budget: 19 },
]

const AI_SUGGESTIONS: Record<string, string[]> = {
  high: [
    'Consider reducing scope or extending the deadline',
    'Add a senior technical advisor to the team',
    'Set up daily standup meetings for better visibility',
    'Establish weekly budget review checkpoints',
    'Identify and assign backup team members immediately',
  ],
  medium: [
    'Schedule bi-weekly risk review meetings',
    'Ensure key team members have proper documentation',
    'Consider adding a QA specialist to the team',
    'Review and clarify project requirements with stakeholders',
    'Monitor budget utilization weekly',
  ],
  low: [
    'Maintain current team momentum',
    'Document best practices for future projects',
    'Consider this team composition for future similar projects',
    'Continue regular progress updates',
  ],
}

export function RiskPrediction() {
  const { projects, employees, setActivePage } = useAppStore()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const sortedByRisk = [...projects].sort((a, b) => b.riskScore - a.riskScore)
  const highRisk = projects.filter(p => p.riskScore > 50)
  const mediumRisk = projects.filter(p => p.riskScore > 25 && p.riskScore <= 50)
  const lowRisk = projects.filter(p => p.riskScore <= 25)
  const avgRisk = Math.round(projects.reduce((a, p) => a + p.riskScore, 0) / projects.length)

  const radarData = selectedProject ? [
    { factor: 'Delay', value: selectedProject.delayProbability },
    { factor: 'Failure', value: selectedProject.failureProbability },
    { factor: 'Budget', value: selectedProject.budgetOverrunProbability },
    { factor: 'Team Gap', value: Math.max(0, 40 - (selectedProject.teamMembers.length * 8)) },
    { factor: 'Complexity', value: selectedProject.complexity === 'hard' ? 80 : selectedProject.complexity === 'medium' ? 50 : 25 },
    { factor: 'Timeline', value: selectedProject.progress < 30 ? 60 : selectedProject.progress > 70 ? 20 : 40 },
  ] : []

  const riskLevel = selectedProject ? (
    selectedProject.riskScore > 50 ? 'high' : selectedProject.riskScore > 25 ? 'medium' : 'low'
  ) : 'low'

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Risk Score', value: `${avgRisk}%`, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', desc: 'Across all projects' },
          { label: 'High Risk', value: highRisk.length, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10', desc: 'Require attention' },
          { label: 'Medium Risk', value: mediumRisk.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', desc: 'Monitor closely' },
          { label: 'Low Risk', value: lowRisk.length, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-400/10', desc: 'On track' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`bg-card border border-border rounded-xl p-4 animate-fade-in stagger-${i + 1}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-4.5 h-4.5', s.color)} />
                </div>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Project Risk List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Projects by Risk Level</h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {sortedByRisk.map((proj) => {
              const risk = getRiskLevel(proj.riskScore)
              const isSelected = selectedProject?.id === proj.id
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(isSelected ? null : proj)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    isSelected
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-secondary/30 border-transparent hover:border-border hover:bg-secondary/60'
                  )}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', risk.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{proj.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{proj.status} · {proj.complexity}</p>
                  </div>
                  <div className={cn('text-right flex-shrink-0')}>
                    <p className={cn('text-sm font-bold', risk.color)}>{proj.riskScore}%</p>
                    <p className="text-[10px] text-muted-foreground">{risk.label}</p>
                  </div>
                  <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform', isSelected ? 'rotate-90 text-primary' : 'text-muted-foreground')} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 space-y-4">
          {selectedProject ? (
            <>
              {/* Risk Radar */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{selectedProject.name}</h3>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', getRiskLevel(selectedProject.riskScore).bg, getRiskLevel(selectedProject.riskScore).color)}>
                    {getRiskLevel(selectedProject.riskScore).label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Multi-dimensional risk analysis</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(220 30% 18%)" />
                    <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} />
                    <Radar
                      name="Risk"
                      dataKey="value"
                      stroke={selectedProject.riskScore > 50 ? '#EF4444' : selectedProject.riskScore > 25 ? '#F59E0B' : '#10B981'}
                      fill={selectedProject.riskScore > 50 ? '#EF4444' : selectedProject.riskScore > 25 ? '#F59E0B' : '#10B981'}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Risk Breakdown */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-amber-400">{selectedProject.delayProbability}%</p>
                    <p className="text-[11px] text-muted-foreground">Delay Risk</p>
                  </div>
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-red-400">{selectedProject.failureProbability}%</p>
                    <p className="text-[11px] text-muted-foreground">Failure Risk</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-accent">{selectedProject.budgetOverrunProbability}%</p>
                    <p className="text-[11px] text-muted-foreground">Budget Overrun</p>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">AI Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {AI_SUGGESTIONS[riskLevel].map((suggestion, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 bg-secondary/40 rounded-lg">
                      <Zap className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-foreground">{suggestion}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActivePage('ai-assistant')}
                  className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline"
                >
                  Ask AI for detailed analysis <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* Historical Risk Chart */
            <div className="bg-card border border-border rounded-xl p-5 h-full">
              <h3 className="text-sm font-semibold text-foreground mb-1">Historical Risk Trends</h3>
              <p className="text-xs text-muted-foreground mb-4">6-month risk overview across all projects</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={HISTORICAL_RISK} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 18%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(220 40% 11%)', border: '1px solid hsl(220 30% 18%)', borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="delay" name="Delay %" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="failure" name="Failure %" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="budget" name="Budget Overrun %" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-semibold">💡 Tip:</span> Click any project on the left to see its detailed risk radar and AI recommendations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Project Risk Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Project</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Overall Risk</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Delay</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Failure</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Budget</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Success</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedByRisk.map((proj) => {
                const risk = getRiskLevel(proj.riskScore)
                return (
                  <tr key={proj.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-foreground">{proj.name}</p>
                        <p className="text-muted-foreground capitalize">{proj.status}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={cn('px-2 py-1 rounded-full font-semibold', risk.bg, risk.color)}>
                        {proj.riskScore}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={cn('font-medium', proj.delayProbability > 30 ? 'text-red-400' : proj.delayProbability > 15 ? 'text-amber-400' : 'text-emerald-400')}>
                        {proj.delayProbability}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={cn('font-medium', proj.failureProbability > 20 ? 'text-red-400' : proj.failureProbability > 10 ? 'text-amber-400' : 'text-emerald-400')}>
                        {proj.failureProbability}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className={cn('font-medium', proj.budgetOverrunProbability > 30 ? 'text-red-400' : proj.budgetOverrunProbability > 15 ? 'text-amber-400' : 'text-emerald-400')}>
                        {proj.budgetOverrunProbability}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className="text-emerald-400 font-medium">{proj.successProbability}%</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className={cn('h-full rounded-full', proj.progress >= 80 ? 'bg-emerald-400' : proj.progress >= 40 ? 'bg-primary' : 'bg-amber-400')}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-8 text-right">{proj.progress}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
