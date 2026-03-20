import { useState } from 'react'
import { useAppStore, type Employee, type Project } from '../store/appStore'
import { AVAILABILITY_CONFIG, BADGE_DEFINITIONS, DEPARTMENTS } from '../data/sampleData'
import {
  Shield, Users, FolderKanban, Settings, Edit2, Trash2, Plus, X,
  CheckCircle2, AlertCircle, Brain, RefreshCw, Eye, TrendingUp,
  DollarSign, Activity, Save, UserPlus, Lock, Mail
} from 'lucide-react'
import bcrypt from 'bcryptjs'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

type AdminTab = 'overview' | 'employees' | 'projects' | 'admins' | 'system'

export function AdminPanel() {
  const { employees, projects, addEmployee, updateEmployee, deleteEmployee, updateProject, deleteProject, users, addUser, removeUser, currentUser } = useAppStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [showProvisioner, setShowProvisioner] = useState(false)

  const totalBudget = projects.reduce((a, p) => a + p.budget, 0)
  const totalSpent = projects.reduce((a, p) => a + p.spent, 0)
  const avgSuccess = Math.round(employees.reduce((a, e) => a + e.successRate, 0) / employees.length)

  const TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'admins', label: 'Admins', icon: Shield },
    { id: 'system', label: 'System', icon: Settings },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Admin Banner */}
      <div className="relative rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-400/10 via-transparent to-red-400/5 overflow-hidden p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Admin Control Panel</h2>
            <p className="text-xs text-muted-foreground">Full system access · Override AI decisions · Manage all data</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" /> Admin
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground border border-transparent hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Employees', value: employees.length, sub: `${employees.filter(e => e.availability === 'free').length} available`, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, sub: `${projects.length} total`, icon: FolderKanban, color: 'text-accent', bg: 'bg-accent/10' },
              { label: 'Avg Success Rate', value: `${avgSuccess}%`, sub: 'Organization-wide', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'Budget Utilized', value: `${Math.round((totalSpent / totalBudget) * 100)}%`, sub: `$${(totalSpent / 1000).toFixed(0)}k / $${(totalBudget / 1000).toFixed(0)}k`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                    <Icon className={cn('w-4.5 h-4.5', s.color)} />
                  </div>
                  <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-xs font-medium text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Admin Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Reset All XP', icon: RefreshCw, action: () => { employees.forEach(e => updateEmployee(e.id, { xpPoints: 0, level: 1 })); toast.success('XP reset for all employees') }, color: 'text-red-400' },
                { label: 'Mark All Available', icon: CheckCircle2, action: () => { employees.forEach(e => updateEmployee(e.id, { availability: 'free' })); toast.success('All employees marked available') }, color: 'text-emerald-400' },
                { label: 'Complete All Active', icon: CheckCircle2, action: () => { projects.filter(p => p.status === 'active').forEach(p => updateProject(p.id, { status: 'completed', progress: 100 })); toast.success('Active projects marked complete') }, color: 'text-primary' },
                { label: 'AI Recalculate Risks', icon: Brain, action: () => { projects.forEach(p => updateProject(p.id, { riskScore: Math.max(5, p.riskScore - Math.floor(Math.random() * 8)) })); toast.success('Risk scores recalculated') }, color: 'text-accent' },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex flex-col items-center gap-2 p-4 bg-secondary/50 border border-border rounded-xl hover:border-primary/30 hover:bg-secondary transition-all"
                  >
                    <Icon className={cn('w-5 h-5', action.color)} />
                    <span className="text-xs font-medium text-foreground text-center">{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">System Activity Log</h3>
            <div className="space-y-2">
              {[
                { time: '2m ago', event: 'AI Team Builder assembled team for FinTech project', type: 'ai', icon: Brain },
                { time: '15m ago', event: 'Risk score for Cloud Migration updated to 45%', type: 'warning', icon: AlertCircle },
                { time: '1h ago', event: 'Sarah Chen earned Top Performer badge', type: 'success', icon: CheckCircle2 },
                { time: '2h ago', event: 'Budget alert: Cloud Migration at 85% utilization', type: 'warning', icon: AlertCircle },
                { time: '5h ago', event: 'New employee Marcus Johnson onboarded', type: 'info', icon: Users },
              ].map((log, i) => {
                const Icon = log.icon
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0',
                      log.type === 'ai' ? 'text-primary' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1">
                      <p className="text-xs text-foreground">{log.event}</p>
                      <p className="text-[10px] text-muted-foreground">{log.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
         <AdminManager
           users={users}
           addUser={addUser}
           removeUser={removeUser}
           currentUserId={currentUser?.id}
         />
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-foreground">All Employees ({employees.length})</h3>
            <button
              onClick={() => setShowProvisioner(!showProvisioner)}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/25 rounded-md text-xs font-bold hover:bg-primary/20 transition-all shadow-sm shadow-primary/5"
            >
              {showProvisioner ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {showProvisioner ? 'Cancel Onboarding' : 'Onboard New Employee'}
            </button>
          </div>

          {showProvisioner && (
            <div className="p-5 border-b border-border bg-secondary/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <EmployeeProvisioner
                onSave={(newEmp) => {
                  addEmployee(newEmp)
                  setShowProvisioner(false)
                }}
              />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Employee</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Department</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Availability</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Success Rate</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">XP</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Level</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {employees.map((emp) => {
                  const avail = AVAILABILITY_CONFIG[emp.availability]
                  return (
                    <tr key={emp.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {emp.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{emp.name}</p>
                            <p className="text-muted-foreground">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 text-muted-foreground">{emp.department}</td>
                      <td className="text-center py-3 px-3">
                        <span className={cn('px-2 py-0.5 rounded-full font-medium text-[11px]', avail.bg, avail.color)}>
                          {avail.label}
                        </span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={cn('font-semibold', emp.successRate >= 90 ? 'text-emerald-400' : emp.successRate >= 75 ? 'text-amber-400' : 'text-red-400')}>
                          {emp.successRate}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 text-primary font-semibold">{emp.xpPoints.toLocaleString()}</td>
                      <td className="text-center py-3 px-3 text-accent font-semibold">Lv.{emp.level}</td>
                      <td className="text-center py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingEmp(emp)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Remove ${emp.name}?`)) { deleteEmployee(emp.id); toast.success(`${emp.name} removed`) } }}
                            className="p-1.5 rounded-lg hover:bg-red-400/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">All Projects ({projects.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Project</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Progress</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Risk</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Budget</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Team</th>
                  <th className="text-center py-3 px-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {projects.map((proj) => {
                  const budgetUsed = proj.budget > 0 ? Math.round((proj.spent / proj.budget) * 100) : 0
                  return (
                    <tr key={proj.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{proj.name}</p>
                        <p className="text-muted-foreground capitalize">{proj.complexity}</p>
                      </td>
                      <td className="text-center py-3 px-3">
                        <select
                          value={proj.status}
                          onChange={(e) => { updateProject(proj.id, { status: e.target.value as any }); toast.success('Status updated') }}
                          className="bg-secondary border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs"
                        >
                          <option value="planning">Planning</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-secondary rounded-full min-w-[50px]">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${proj.progress}%` }} />
                          </div>
                          <span className="text-muted-foreground w-8 text-right">{proj.progress}%</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className={cn('font-semibold', proj.riskScore > 50 ? 'text-red-400' : proj.riskScore > 25 ? 'text-amber-400' : 'text-emerald-400')}>
                          {proj.riskScore}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-3 text-muted-foreground">
                        ${(proj.budget / 1000).toFixed(0)}k <span className="text-primary">({budgetUsed}%)</span>
                      </td>
                      <td className="text-center py-3 px-3 text-muted-foreground">{proj.teamMembers.length}</td>
                      <td className="text-center py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingProj(proj)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete ${proj.name}?`)) { deleteProject(proj.id); toast.success('Project deleted') } }}
                            className="p-1.5 rounded-lg hover:bg-red-400/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">System Configuration</h3>
            <div className="space-y-4">
              {[
                { label: 'AI Team Builder', desc: 'Automatically assemble teams using ML scoring', enabled: true },
                { label: 'Risk Prediction Engine', desc: 'Continuously monitor and update project risk scores', enabled: true },
                { label: 'Backup Auto-assignment', desc: 'Auto-assign backup members when availability changes', enabled: true },

                { label: 'Budget Alerts', desc: 'Notify when project budget exceeds 80% utilization', enabled: true },
                { label: 'Skill Gap Detection', desc: 'Alert when critical skills are missing from active projects', enabled: false },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.desc}</p>
                  </div>
                  <div className={cn(
                    'w-11 h-6 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ml-4 flex-shrink-0',
                    setting.enabled ? 'bg-primary' : 'bg-secondary border border-border'
                  )}>
                    <div className={cn(
                      'w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                      setting.enabled ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">AI Model Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">AI Model</label>
                <select className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option>GPT-4.1 Mini (Default)</option>
                  <option>GPT-4.1</option>
                  <option>Claude Sonnet</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Risk Calculation Frequency</label>
                <select className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option>Real-time</option>
                  <option>Every hour</option>
                  <option>Daily</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Team Size</label>
                <input type="number" defaultValue={10} min={2} max={20}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Backup Member Threshold</label>
                <input type="number" defaultValue={2} min={1} max={5}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <button
                onClick={() => toast.success('Settings saved!')}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <EditEmployeeModal
          employee={editingEmp}
          onClose={() => setEditingEmp(null)}
          onSave={(updates) => {
            updateEmployee(editingEmp.id, updates)
            setEditingEmp(null)
            toast.success('Employee updated!')
          }}
        />
      )}
    </div>
  )
}

function EditEmployeeModal({ employee, onClose, onSave }: {
  employee: Employee
  onClose: () => void
  onSave: (updates: Partial<Employee>) => void
}) {
  const [form, setForm] = useState({
    role: employee.role,
    department: employee.department,
    availability: employee.availability,
    successRate: employee.successRate,
    xpPoints: employee.xpPoints,
    level: employee.level,
  })

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center font-bold text-sm">{employee.avatar}</div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Edit {employee.name}</h3>
              <p className="text-xs text-muted-foreground">Admin override</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Availability</label>
              <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as any })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                <option value="free">Available</option>
                <option value="partially_busy">Partial</option>
                <option value="fully_occupied">Occupied</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Success Rate (%)</label>
              <input type="number" min={0} max={100} value={form.successRate}
                onChange={(e) => setForm({ ...form, successRate: +e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">XP Points</label>
              <input type="number" min={0} value={form.xpPoints}
                onChange={(e) => setForm({ ...form, xpPoints: +e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Level</label>
              <input type="number" min={1} max={20} value={form.level}
                onChange={(e) => setForm({ ...form, level: +e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminManager({ users, addUser, removeUser, currentUserId }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return

    const emailExists = users.some((u: any) => u.email.toLowerCase() === form.email.toLowerCase())
    if (emailExists) {
      toast.error('An admin with this email already exists.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      addUser({
        id: `admin_${Date.now()}`,
        name: form.name,
        email: form.email,
        passwordHash: bcrypt.hashSync(form.password, 10),
        role: 'admin'
      })
      toast.success('Admin created successfully.')
      setForm({ name: '', email: '', password: '' })
      setLoading(false)
    }, 600)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Create Admin Form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> Provision New Admin</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email <Mail className="w-3 h-3 inline pb-0.5 text-muted-foreground"/></label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50" placeholder="jane@teamforge.ai" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Password <Lock className="w-3 h-3 inline pb-0.5 text-muted-foreground"/></label>
            <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-primary/50" placeholder="••••••" />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Provisioning...' : 'Create Admin'}
          </button>
        </form>
      </div>

      {/* Admin List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="text-sm font-semibold text-foreground">Active Administrators</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">Email</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3 text-foreground font-medium flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">{u.name.charAt(0)}</div>
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded capitalize font-bold">{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.id !== currentUserId && (
                      <button onClick={() => {
                        if (confirm('Are you sure you want to revoke this admin access?')) {
                          removeUser(u.id); toast.success('Admin revoked')
                        }
                      }} className="p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded transition-colors" title="Revoke Access">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
function EmployeeProvisioner({ onSave }: { onSave: (emp: Employee) => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: '', department: DEPARTMENTS[0], skills: '' })
  const [passwordMode, setPasswordMode] = useState<'auto' | 'manual'>('auto')
  const [manualPassword, setManualPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.role) {
      toast.error('Please fill required fields')
      return
    }

    setLoading(true)
    const rawPassword = passwordMode === 'auto' ? `Temp@${Math.floor(1000 + Math.random() * 9000)}` : manualPassword
    
    if (passwordMode === 'manual' && manualPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role,
      department: form.department,
      skills: form.skills.split(',').map(s => ({ name: s.trim(), level: 'Beginner', score: 50 })).filter(s => s.name),
      avatar: form.name.charAt(0),
      availability: 'free',
      experienceYears: 0,
      successRate: 85,
      failureRate: 5,
      xpPoints: 0,
      level: 1,
      salary: 50000,
      hireDate: new Date().toISOString(),
      bio: `Professional ${form.role} with a focus on delivering high-quality results.`,
      badges: [],
      projectHistory: [],
      completedProjects: 0,
      totalProjectsAssigned: 0,
      passwordHash: bcrypt.hashSync(rawPassword, 10),
      isFirstLogin: true
    } as any as Employee // Casting as any then Employee to bypass deep partial issues if needed, but the structure is largely correct now

    setTimeout(() => {
      try {
        onSave(newEmp)
        toast.success('Employee account created successfully')
        
        // Feature 2: Credential Sharing Simulation
        toast.custom((t) => (
          <div className="bg-card border border-border p-4 rounded-xl shadow-lg animate-fade-in w-80">
            <div className="flex justify-between items-center mb-2">
               <div className="flex gap-2 items-center text-primary font-semibold text-sm">
                 <Shield className="w-4 h-4"/> Account Credentials
               </div>
               <button onClick={() => toast.dismiss(t.id)}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"/></button>
            </div>
            <div className="text-xs text-foreground bg-secondary p-3 flex flex-col gap-1.5 rounded-lg font-mono mb-3 border border-border">
              <div><span className="text-muted-foreground mr-1 uppercase text-[10px]">Email</span><br/>{newEmp.email}</div>
              <div className="mt-1"><span className="text-muted-foreground mr-1 uppercase text-[10px]">Temp Password</span><br/>{rawPassword}</div>
            </div>
            <button
              onClick={() => {
                 toast.dismiss(t.id);
                 toast.success('Login credentials simulated sent to email!')
              }}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" /> Send Email (Simulation)
            </button>
          </div>
        ), { duration: 25000 })
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }, 600)
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} 
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="John Doe" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Address *</label>
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} 
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="john@company.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Role *</label>
          <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} 
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Frontend Developer" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
          <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} 
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Skills (comma separated)</label>
        <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} 
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="React, TypeScript, Node.js" />
      </div>
      
      <div className="pt-2">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Initial Security Setup</label>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={passwordMode === 'auto'} onChange={() => setPasswordMode('auto')} className="text-primary" />
            <span className="text-xs text-foreground">Auto-generate password</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={passwordMode === 'manual'} onChange={() => setPasswordMode('manual')} className="text-primary" />
            <span className="text-xs text-foreground">Set password manually</span>
          </label>
        </div>
        {passwordMode === 'manual' && (
          <input required type="password" value={manualPassword} onChange={e => setManualPassword(e.target.value)} 
            className="w-full md:w-1/2 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mb-3" placeholder="Set manual password" />
        )}
      </div>

      <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {loading ? 'Provisioning Account...' : 'Complete Account Provisioning'}
      </button>
    </form>
  )
}
