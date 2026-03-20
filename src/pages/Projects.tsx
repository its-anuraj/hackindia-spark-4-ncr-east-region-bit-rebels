import { useState } from 'react'
import { useAppStore, type Project } from '../store/appStore'
import {
  FolderKanban, Plus, Search, Users, Clock, DollarSign,
  AlertTriangle, CheckCircle2, Play, PauseCircle, X, TrendingUp,
  Brain, ChevronDown, Calendar
} from 'lucide-react'
import { cn } from '../lib/utils'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'text-blue-400', bg: 'bg-blue-400/15', dot: 'bg-blue-400' },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/15', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', color: 'text-primary', bg: 'bg-primary/15', dot: 'bg-primary' },
  paused: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-400/15', dot: 'bg-amber-400' },
}

const COMPLEXITY_CONFIG = {
  easy: { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  hard: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-400/10' },
}

export function Projects() {
  const { projects: allProjects, employees, addProject, updateProject, deleteProject, searchQuery, setSearchQuery, triggerGrowthUpdate, addNotification, currentUser } = useAppStore()
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const isEmp = currentUser?.role === 'employee'
  const projects = isEmp ? allProjects.filter(p => p.teamMembers.includes(currentUser.id)) : allProjects

  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const getEmployee = (id: string) => employees.find((e) => e.id === id)

  return (
    <div className="p-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', count: projects.length, color: 'text-foreground' },
          { label: 'Active', count: projects.filter((p) => p.status === 'active').length, color: 'text-emerald-400' },
          { label: 'At Risk', count: projects.filter((p) => p.riskScore > 35).length, color: 'text-amber-400' },
          { label: 'Completed', count: projects.filter((p) => p.status === 'completed').length, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            employees={employees}
            onSelect={() => setSelectedProject(project)}
            onDelete={() => { deleteProject(project.id); toast.success('Project removed') }}
            onStatusChange={(status) => updateProject(project.id, { status })}
          />
        ))}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          employees={employees}
          currentUser={currentUser}
          onClose={() => setSelectedProject(null)}
          onUpdate={(updates) => {
            updateProject(selectedProject.id, updates)
            setSelectedProject({ ...selectedProject, ...updates })
            if (updates.status === 'completed' && selectedProject.status !== 'completed') {
              triggerGrowthUpdate(selectedProject.teamMembers)
              toast.success('Project completed! Team growth recorded.', { icon: '🚀' })
              addNotification({
                id: `growth_${Date.now()}`,
                title: 'Project Completed',
                message: `Team growth and XP recorded for ${selectedProject.name}.`,
                type: 'success',
                read: false,
                timestamp: new Date()
              })
            }
          }}
        />
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onSave={(proj) => {
            addProject(proj)
            setShowAddModal(false)
            toast.success('Project created!')
          }}
        />
      )}
    </div>
  )
}

function ProjectCard({ project, index, employees, onSelect, onDelete, onStatusChange }: {
  project: Project; index: number; employees: any[]; onSelect: () => void; onDelete: () => void; onStatusChange: (s: any) => void
}) {
  const status = STATUS_CONFIG[project.status]
  const complexity = COMPLEXITY_CONFIG[project.complexity]
  const teamEmps = project.teamMembers.map((id) => employees.find((e) => e.id === id)).filter(Boolean)
  const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000) : null
  const budgetUsed = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0

  return (
    <div className={cn('bg-card border border-border rounded-xl p-5 card-hover animate-fade-in cursor-pointer', `stagger-${(index % 4) + 1}`)} onClick={onSelect}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', status.bg, status.color)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-foreground">{project.progress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              project.progress >= 80 ? 'bg-emerald-400' :
              project.progress >= 40 ? 'bg-primary' : 'bg-amber-400'
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Risk Indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'flex items-center gap-1.5 text-xs font-medium',
          project.riskScore > 40 ? 'text-red-400' :
          project.riskScore > 25 ? 'text-amber-400' : 'text-emerald-400'
        )}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Risk: {project.riskScore}%
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          Success: {project.successProbability}%
        </div>
        <div className={cn('text-xs px-2 py-0.5 rounded-md font-medium ml-auto', complexity.bg, complexity.color)}>
          {complexity.label}
        </div>
      </div>

      {/* Team Avatars */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {teamEmps.slice(0, 4).map((emp: any) => (
            <div key={emp.id} title={emp.name} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border-2 border-card flex items-center justify-center text-[10px] font-bold cursor-help">
              {emp.avatar}
            </div>
          ))}
          {teamEmps.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
              +{teamEmps.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {daysLeft !== null && (
            <span className={cn('flex items-center gap-1', daysLeft < 30 ? 'text-amber-400' : '')}>
              <Clock className="w-3.5 h-3.5" />
              {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
            </span>
          )}
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {budgetUsed}% used
          </span>
        </div>
      </div>
    </div>
  )
}

function ProjectDetailModal({ project, employees, currentUser, onClose, onUpdate }: {
  project: Project; employees: any[]; currentUser: any; onClose: () => void; onUpdate: (u: Partial<Project>) => void
}) {
  const teamEmps = project.teamMembers.map((id) => employees.find((e) => e.id === id)).filter(Boolean)
  const status = STATUS_CONFIG[project.status]
  const budgetUsed = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', status.bg, status.color)}>
                {status.label}
              </span>
              <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium capitalize',
                COMPLEXITY_CONFIG[project.complexity].bg, COMPLEXITY_CONFIG[project.complexity].color)}>
                {project.complexity}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
            <X className="w-4.5 h-4.5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress + Risk Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Progress</h4>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-foreground">{project.progress}%</span>
                <span className="text-xs text-emerald-400 mb-1">+5% this week</span>
              </div>
              <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Budget</h4>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-foreground">${(project.spent / 1000).toFixed(0)}k</span>
                <span className="text-xs text-muted-foreground mb-0.5">/ ${(project.budget / 1000).toFixed(0)}k</span>
              </div>
              <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
                <div
                  className={cn('h-full rounded-full', budgetUsed > 90 ? 'bg-red-400' : budgetUsed > 70 ? 'bg-amber-400' : 'bg-emerald-400')}
                  style={{ width: `${budgetUsed}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{budgetUsed}% utilized</p>
            </div>
          </div>

          {/* Risk Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Risk Analysis</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-center" title="Delay Probability">
                <p className="text-xl font-bold text-amber-400">{project.delayProbability}%</p>
                <p className="text-xs text-muted-foreground">Delay Risk</p>
              </div>
              <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-center" title="Failure Probability">
                <p className="text-xl font-bold text-red-400">{project.failureProbability}%</p>
                <p className="text-xs text-muted-foreground">Failure Risk</p>
              </div>
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center" title="Budget Overrun">
                <p className="text-xl font-bold text-accent">{project.budgetOverrunProbability}%</p>
                <p className="text-xs text-muted-foreground">Budget Overrun</p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Team Members ({teamEmps.length})</h4>
            <div className="grid grid-cols-2 gap-2">
              {teamEmps.map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-2 p-2.5 bg-secondary/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-xs font-bold">
                    {emp.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{emp.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          {project.tasks?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Tasks ({project.tasks.length})</h4>
              <div className="space-y-2">
                {project.tasks.map((task) => {
                  const assignee = employees.find((e) => e.id === task.assignee)
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        task.status === 'completed' ? 'bg-emerald-400' :
                        task.status === 'in_progress' ? 'bg-primary' : 'bg-muted-foreground'
                      )} />
                      <span className={cn('text-sm flex-1', task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                        {task.name}
                      </span>
                      {assignee && <span className="text-xs text-muted-foreground">{assignee.name.split(' ')[0]}</span>}
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full capitalize',
                        task.status === 'completed' ? 'bg-emerald-400/15 text-emerald-400' :
                        task.status === 'in_progress' ? 'bg-primary/15 text-primary' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {project.aiReasoning && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-semibold text-primary">AI Reasoning</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{project.aiReasoning}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-4 pt-4 border-t border-border">
            {currentUser?.role === 'employee' && project.teamMembers.includes(currentUser.id) && (
              <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold text-foreground">My Progress Update</span>
                  <span className="text-sm font-bold text-primary">{project.progress}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={project.progress}
                  onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}

            <div className="flex gap-2">
              {currentUser?.role === 'admin' && (
                <>
                  {project.status === 'active' ? (
                    <button onClick={() => onUpdate({ status: 'paused' })} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-400/10 text-amber-400 border border-amber-400/25 rounded-lg text-xs font-medium hover:bg-amber-400/20 transition-colors">
                      <PauseCircle className="w-3.5 h-3.5" /> Pause Project
                    </button>
                  ) : project.status === 'paused' ? (
                    <button onClick={() => onUpdate({ status: 'active' })} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 rounded-lg text-xs font-medium hover:bg-emerald-400/20 transition-colors">
                      <Play className="w-3.5 h-3.5" /> Resume Project
                    </button>
                  ) : null}
                  
                  {project.status !== 'completed' && (
                    <button onClick={() => onUpdate({ status: 'completed' })} className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-primary text-white rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}
                </>
              )}
              <button onClick={onClose} className="flex-1 px-4 py-3 bg-secondary border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Project) => void }) {
  const [form, setForm] = useState({ name: '', description: '', complexity: 'medium' as 'easy' | 'medium' | 'hard', budget: 100000, deadline: '' })

  const handleSave = () => {
    if (!form.name) { toast.error('Project name required'); return }
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      ...form,
      status: 'planning',
      spent: 0,
      startDate: new Date().toISOString().split('T')[0],
      progress: 0,
      requiredSkills: [],
      teamMembers: [],
      backupMembers: [],
      riskScore: 20,
      delayProbability: 15,
      failureProbability: 8,
      budgetOverrunProbability: 12,
      successProbability: 80,
      aiReasoning: '',
      tasks: [],
    }
    onSave(newProj)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold">New Project</h3>
          <button onClick={onClose}><X className="w-4.5 h-4.5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Project description..."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget ($)</label>
              <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: +e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Complexity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((c) => (
                <button key={c} onClick={() => setForm({ ...form, complexity: c })}
                  className={cn('py-2 rounded-lg text-xs font-medium capitalize transition-all',
                    form.complexity === c ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/30')}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Create Project</button>
        </div>
      </div>
    </div>
  )
}
