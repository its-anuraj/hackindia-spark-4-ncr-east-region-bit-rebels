import { useState, useRef, useEffect } from 'react'
import { useAppStore, type Employee } from '../store/appStore'
import { AVAILABILITY_CONFIG, BADGE_DEFINITIONS, SKILL_LEVELS, DEPARTMENTS, ALL_SKILLS } from '../data/sampleData'
import {
  Building2, Search, Filter, Mail, Phone, MapPin, Briefcase,
  Trash2, Edit2, Plus, Star, Shield, Award, Users, Crosshair,
  Activity, Zap, BookOpen, Fingerprint, Eye, X, CheckSquare, UploadCloud, Github, FileText, CheckCircle2, BarChart2, Link as LinkIcon, Loader2, FolderKanban, TrendingUp, SlidersHorizontal, ChevronDown
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '../lib/utils'
import bcrypt from 'bcryptjs'
import toast from 'react-hot-toast'
import { parseResumeFile, type ParsedResume } from '../lib/resumeParser'
import { simulateEmailSend } from '../lib/apiMock'
type FilterState = {
  department: string
  availability: string
  skill: string
}

export function Employees() {
  const { employees, addEmployee, deleteEmployee, searchQuery, setSearchQuery, currentUser } = useAppStore()
  const [filters, setFilters] = useState<FilterState>({ department: '', availability: '', skill: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortBy, setSortBy] = useState<'xp' | 'name' | 'success'>('xp')

  const isEmp = currentUser?.role === 'employee'
  const displayEmployees = isEmp && currentUser?.id ? employees.filter(e => e.id === currentUser.id) : employees

  const filtered = displayEmployees
    .filter((e) => {
      const q = searchQuery.toLowerCase()
      const matchSearch = !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
      const matchDept = !filters.department || e.department === filters.department
      const matchAvail = !filters.availability || e.availability === filters.availability
      const matchSkill = !filters.skill || e.skills.some((s) => s.name === filters.skill)
      return matchSearch && matchDept && matchAvail && matchSkill
    })
    .sort((a, b) => {
      if (sortBy === 'xp') return b.xpPoints - a.xpPoints
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return b.successRate - a.successRate
    })

  const clearFilters = () => {
    setFilters({ department: '', availability: '', skill: '' })
    setSearchQuery('')
  }

  const handleDelete = (emp: Employee) => {
    if (confirm(`Remove ${emp.name} from the system?`)) {
      deleteEmployee(emp.id)
      toast.success(`${emp.name} removed`)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors',
              showFilters ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary text-foreground border-border hover:bg-muted'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="xp">Sort: XP</option>
            <option value="name">Sort: Name</option>
            <option value="success">Sort: Success Rate</option>
          </select>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={filters.availability}
              onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">All Availability</option>
              <option value="free">Available</option>
              <option value="partially_busy">Partial</option>
              <option value="fully_occupied">Occupied</option>
            </select>

            <select
              value={filters.skill}
              onChange={(e) => setFilters((f) => ({ ...f, skill: e.target.value }))}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">All Skills</option>
              {ALL_SKILLS.slice(0, 15).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {(filters.department || filters.availability || filters.skill || searchQuery) && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:underline ml-auto">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        Showing <span className="text-foreground font-medium">{filtered.length}</span> of {displayEmployees.length} {isEmp ? 'employee' : 'employees'}
      </p>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp, i) => (
          <EmployeeCard
            key={emp.id}
            employee={emp}
            index={i}
            onView={() => setSelectedEmp(emp)}
            onDelete={() => handleDelete(emp)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedEmp && (
        <EmployeeDetailModal employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSave={(emp) => {
            const rawPassword = `Temp@${Math.floor(1000 + Math.random() * 9000)}`
            const newEmp = {
              ...emp,
              email: emp.email || `${emp.name.split(' ').join('.').toLowerCase()}@teamforge.ai`,
              passwordHash: bcrypt.hashSync(rawPassword, 10),
              isFirstLogin: true
            }
            addEmployee(newEmp)
            setShowAddModal(false)
            
            toast.success('Employee account created successfully', { duration: 3000 })
            
            // Feature 2: Credential Sharing Simulation
            toast.custom((t) => (
              <div className="bg-card border border-border p-4 rounded-xl shadow-lg animate-fade-in w-80">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex gap-2 items-center text-primary font-semibold text-sm">
                     <Shield className="w-4 h-4"/> Credentials Generated
                   </div>
                   <button onClick={() => toast.dismiss(t.id)}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"/></button>
                </div>
                <div className="text-xs text-foreground bg-secondary p-3 flex flex-col gap-1.5 rounded-lg font-mono mb-3 border border-border">
                  <div><span className="text-muted-foreground mr-1 uppercase text-[10px]">Email</span><br/>{newEmp.email}</div>
                  <div className="mt-1"><span className="text-muted-foreground mr-1 uppercase text-[10px]">Pass</span><br/>{rawPassword}</div>
                </div>
                <button
                  onClick={() => {
                     toast.dismiss(t.id);
                     toast.promise(simulateEmailSend(newEmp.email), {
                        loading: 'Sending credentials...',
                        success: 'Login credentials sent successfully',
                        error: 'Failed to send'
                     }, { duration: 4000 })
                  }}
                  className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Send Secure Email
                </button>
              </div>
            ), { duration: 25000 })
          }}
        />
      )}
    </div>
  )
}

function EmployeeCard({ employee: emp, index, onView, onDelete }: {
  employee: Employee; index: number; onView: () => void; onDelete: () => void
}) {
  const avail = AVAILABILITY_CONFIG[emp.availability]
  const { clearGrowthHighlight, currentUser } = useAppStore()

  useEffect(() => {
    if (emp.recentlyGrew) {
      const t = setTimeout(() => clearGrowthHighlight(emp.id), 4000)
      return () => clearTimeout(t)
    }
  }, [emp.recentlyGrew, emp.id, clearGrowthHighlight])

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 card-hover relative transition-all duration-700', 
       emp.recentlyGrew ? 'ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/5 -translate-y-1' : '',
      `stagger-${(index % 6) + 1}`
    )}>
      {emp.recentlyGrew && (
         <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg flex items-center gap-1">
            <TrendingUp className="w-3 h-3"/> +Growth
         </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold text-foreground relative">
            {emp.avatar}
            <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card', avail.dot)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{emp.name}</p>
            <p className="text-xs text-muted-foreground">{emp.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onView} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="View Details">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {currentUser?.role === 'admin' && (
             <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-400/10 hover:text-red-400 transition-colors" title="Delete Employee">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
             </button>
          )}
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">
          {emp.department}
        </span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', avail.bg, avail.color)}>
          {avail.label}
        </span>
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md ml-auto">
          {emp.experienceYears}y exp
        </span>
      </div>

      {/* Top Skills */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Top Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {emp.skills.slice(0, 3).map((skill) => {
            const level = SKILL_LEVELS[skill.level as keyof typeof SKILL_LEVELS]
            return (
              <span key={skill.name} className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', level?.bg, level?.color)}>
                {skill.name}
              </span>
            )
          })}
          {emp.skills.length > 3 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{emp.skills.length - 3}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-emerald-400">{emp.successRate}%</p>
          <p className="text-[10px] text-muted-foreground">Success</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-primary">{emp.xpPoints.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">XP</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-accent">Lv.{emp.level}</p>
          <p className="text-[10px] text-muted-foreground">Level</p>
        </div>
      </div>

      {/* Badges */}
      {emp.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-3 border-t border-border/50">
          {emp.badges.slice(0, 3).map((badge) => {
            const def = BADGE_DEFINITIONS[badge as keyof typeof BADGE_DEFINITIONS]
            return def ? (
              <span key={badge} title={def.description} className="text-sm cursor-help">{def.icon}</span>
            ) : null
          })}
          {emp.badges.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{emp.badges.length - 3} badges</span>
          )}
        </div>
      )}
    </div>
  )
}

function EmployeeDetailModal({ employee: emp, onClose }: { employee: Employee; onClose: () => void }) {
  const avail = AVAILABILITY_CONFIG[emp.availability]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-xl font-bold text-foreground">
              {emp.avatar}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{emp.name}</h2>
              <p className="text-sm text-muted-foreground">{emp.role} · {emp.department}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-medium', avail.bg, avail.color)}>
                  {avail.label}
                </span>
                <span className="text-xs text-muted-foreground">{emp.experienceYears} years experience</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Bio */}
          <p className="text-sm text-muted-foreground">{emp.bio}</p>

          {/* Growth Stats Module */}
          <div className="bg-gradient-to-br from-emerald-500/5 to-primary/5 border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden">
             <div className="absolute -bottom-4 -right-4 opacity-[0.03]">
                <TrendingUp className="w-32 h-32" />
             </div>
             <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 relative z-10">
                 <TrendingUp className="w-4 h-4 text-emerald-500" /> Growth Trajectory
             </h4>
             <div className="grid grid-cols-2 gap-6 relative z-10">
                 <div>
                     <div className="flex justify-between items-baseline mb-1.5">
                         <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Experience Level</span>
                         <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", 
                              emp.experienceYears > 5 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' :
                              emp.experienceYears > 2 ? 'bg-blue-400/10 text-blue-400 border-blue-400/30' :
                              'bg-amber-400/10 text-amber-400 border-amber-400/30'
                         )}>
                             {emp.experienceYears > 5 ? 'Expert' : emp.experienceYears > 2 ? 'Intermediate' : 'Beginner'}
                         </span>
                     </div>
                     <p className="text-2xl font-bold text-foreground mb-0.5">{emp.experienceYears} <span className="text-sm font-medium text-muted-foreground">Years</span></p>
                     <p className="text-[10px] text-emerald-400/80">+0.5y awarded per completed project</p>
                 </div>
                 
                 <div>
                     <div className="flex justify-between items-baseline mb-1.5">
                         <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Success Rate</span>
                         <span className="text-sm font-bold text-emerald-400">{emp.successRate}%</span>
                     </div>
                     <div className="h-2 w-full bg-background rounded-full overflow-hidden mt-2 border border-border/50">
                         <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative" style={{ width: `${emp.successRate}%` }}>
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                         </div>
                     </div>
                     <p className="text-[10px] text-muted-foreground mt-1.5">{emp.completedProjects || Math.max(0, emp.projectHistory.length - 1)} completed / {emp.totalProjectsAssigned || Math.max(1, emp.projectHistory.length)} total assigned</p>
                 </div>
             </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Success Rate', value: `${emp.successRate}%`, color: 'text-emerald-400' },
              { label: 'XP Points', value: emp.xpPoints.toLocaleString(), color: 'text-primary' },
              { label: 'Level', value: `Lv.${emp.level}`, color: 'text-accent' },
              { label: 'Projects', value: emp.projectHistory.length, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Skills</h4>
            <div className="space-y-2.5">
              {emp.skills.map((skill) => {
                const level = SKILL_LEVELS[skill.level as keyof typeof SKILL_LEVELS]
                return (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{skill.name}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', level?.bg, level?.color)}>
                          {level?.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{skill.score}/100</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Badges */}
          {emp.badges.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {emp.badges.map((badge) => {
                  const def = BADGE_DEFINITIONS[badge as keyof typeof BADGE_DEFINITIONS]
                  return def ? (
                    <div key={badge} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium', def.color)}>
                      <span>{def.icon}</span>
                      <span>{def.name}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type AddTab = 'manual' | 'resume' | 'github'

function AddEmployeeModal({ onClose, onSave }: { onClose: () => void; onSave: (emp: Employee) => void }) {
  const [activeTab, setActiveTab] = useState<AddTab>('manual')

  // Manual State
  const [form, setForm] = useState({
    name: '', email: '', role: '', department: DEPARTMENTS[0],
    availability: 'free' as const, experienceYears: 1, bio: '',
  })

  // Resume State
  const [dragActive, setDragActive] = useState(false)
  const [resumeState, setResumeState] = useState<'idle' | 'analyzing' | 'success'>('idle')
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // GitHub State
  const [githubUrl, setGithubUrl] = useState('')
  const [githubState, setGithubState] = useState<'idle' | 'analyzing' | 'success'>('idle')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAnalyzeResume(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAnalyzeResume(e.target.files[0])
    }
  }

  const handleAnalyzeResume = async (file?: File) => {
    if (!file) return
    setResumeState('analyzing')
    try {
      const result = await parseResumeFile(file)
      setParsedData(result)
      setResumeState('success')
    } catch (e) {
      toast.error('Failed to analyze resume. Please try a different PDF or DOCX file.')
      setResumeState('idle')
    }
  }

  const handleAnalyzeGithub = () => {
    if (!githubUrl) return
    setGithubState('analyzing')
    setTimeout(() => setGithubState('success'), 2500)
  }

  const handleSaveManual = () => {
    if (!form.name || !form.role) { toast.error('Name and role are required'); return }
    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      avatar: form.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      successRate: 75, failureRate: 25, xpPoints: 0, level: 1,
      salary: 100000, hireDate: new Date().toISOString().split('T')[0],
      skills: [], badges: [], projectHistory: [],
      ...form,
    }
    onSave(newEmp)
  }

  const handleSaveResumeResult = () => {
    if (!parsedData) return;
    const newEmp: Employee = {
      id: `emp_${Date.now()}`, name: parsedData.name, email: parsedData.email, role: parsedData.roles[0] || 'Software Engineer',
      department: 'Engineering', availability: 'free', experienceYears: parsedData.experienceYears, successRate: 88, failureRate: 12, xpPoints: 4200, level: 6, salary: 120000, hireDate: new Date().toISOString().split('T')[0], bio: `Profile automatically extracted from uploaded resume. Background in ${parsedData.skills.slice(0, 3).map(s=>s.name).join(', ')}. Raw text: ${parsedData.rawText.substring(0, 50)}...`,
      avatar: parsedData.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      skills: parsedData.skills, badges: ['problem_solver'], projectHistory: [],
    }
    onSave(newEmp)
  }

  const handleSaveGithubResult = () => {
    const username = githubUrl.split('/').pop() || 'GitHub'
    const newEmp: Employee = {
      id: `emp_${Date.now()}`, name: `${username} Profile`, email: `${username}@github.com`, role: 'Open Source Contributor',
      department: 'Engineering', availability: 'free', experienceYears: 6, successRate: 94, failureRate: 6, xpPoints: 8500, level: 12, salary: 135000, hireDate: new Date().toISOString().split('T')[0], bio: 'Extracted from GitHub analysis. Consistent open-source contributions with deep expertise in system architecture.',
      avatar: username.slice(0, 2).toUpperCase(),
      skills: [
        { name: 'TypeScript', level: 'expert', score: 96 },
        { name: 'Python', level: 'expert', score: 90 },
        { name: 'Rust', level: 'intermediate', score: 72 },
      ], badges: ['innovator', 'fast_deliverer'], projectHistory: [],
    }
    onSave(newEmp)
  }

  const MOCK_GITHUB_COMMITS = [
    { day: 'Mon', commits: 12 }, { day: 'Tue', commits: 25 }, { day: 'Wed', commits: 18 }, { day: 'Thu', commits: 32 }, { day: 'Fri', commits: 24 }, { day: 'Sat', commits: 5 }, { day: 'Sun', commits: 8 }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-base font-semibold text-foreground">Onboard Talent</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors"><X className="w-4.5 h-4.5 text-muted-foreground" /></button>
        </div>
        
        <div className="p-5">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-secondary/30 p-1 rounded-xl">
            {(['manual', 'resume', 'github'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {tab === 'manual' && <Edit2 className="w-4 h-4" />}
                {tab === 'resume' && <FileText className="w-4 h-4" />}
                {tab === 'github' && <Github className="w-4 h-4" />}
                {tab === 'resume' ? 'Resume Analysis' : tab === 'github' ? 'GitHub Analysis' : 'Manual Entry'}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'manual' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@company.com" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role *</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Senior Engineer" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Availability</label>
                  <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as any })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    <option value="free">Available</option>
                    <option value="partially_busy">Partially Busy</option>
                    <option value="fully_occupied">Fully Occupied</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Experience (years)</label>
                  <input type="number" min={0} max={40} value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: +e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3} placeholder="Brief description..."
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button onClick={onClose} className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleSaveManual} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Add Employee</button>
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="space-y-4 animate-fade-in">
              {resumeState === 'idle' && (
                <div
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileSelect} />
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Drag & drop resume here</h3>
                  <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
                  <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest">(Click to browse files)</p>
                </div>
              )}

              {resumeState === 'analyzing' && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center relative z-10">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Analyzing Resume...</h3>
                  <div className="flex flex-col gap-2 w-48 mx-auto mt-2">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-1/3 animate-pulse" />
                    </div>
                    <p className="text-xs text-muted-foreground animate-pulse">Extracting skills & experience</p>
                  </div>
                </div>
              )}

              {resumeState === 'success' && parsedData && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground drop-shadow-sm">Successfully Parsed {parsedData.name}'s Resume</h4>
                      <p className="text-xs text-emerald-400/80 mt-0.5">Contact: {parsedData.email} | Profiles extracted with AI heuristics.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extracted Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map(s => (
                           <span key={s.name} className={cn("text-xs px-2 py-1 rounded-md font-medium border", 
                              s.level === 'expert' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : 
                              s.level === 'intermediate' ? 'bg-blue-400/15 text-blue-400 border-blue-400/20' : 
                              'bg-stone-400/15 text-stone-400 border-stone-400/20'
                           )}>
                              {s.name} ({s.level})
                           </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="bg-secondary/50 rounded-xl p-4 border border-border flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experience</span>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1">{parsedData.experienceYears} Years Total</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Roles identified:<br/>{parsedData.roles.map(r => `• ${r}`).join('\n')}</p>
                      </div>
                      <div className="bg-secondary/50 rounded-xl p-4 border border-border flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderKanban className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</span>
                        </div>
                        {parsedData.projects.map((p, i) => (
                           <div key={i} className="mb-2 last:mb-0">
                               <p className="text-sm font-bold text-foreground mb-1">{p.title}</p>
                               <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <button onClick={() => setResumeState('idle')} className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Scan Another</button>
                    <button onClick={handleSaveResumeResult} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                       <Plus className="w-4 h-4" /> Add to Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4 animate-fade-in">
              {githubState === 'idle' && (
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="url" placeholder="https://github.com/username"
                      value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl p-4">
                     <Github className="w-5 h-5 text-primary shrink-0" />
                     <p>We'll analyze public repositories, commit history, and language distributions to build an intelligent developer profile.</p>
                  </div>
                  <button onClick={handleAnalyzeGithub} disabled={!githubUrl} className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                    Analyze GitHub Profile
                  </button>
                </div>
              )}

              {githubState === 'analyzing' && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 border border-border">
                    <Github className="w-8 h-8 text-foreground animate-pulse" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Fetching Repositories & Commits...</h3>
                  <div className="flex gap-1.5 mt-2">
                    {[1,2,3].map(i => <div key={i} className={cn("w-2 h-2 rounded-full bg-primary animate-pulse")} style={{animationDelay: `${i * 150}ms`}} />)}
                  </div>
                </div>
              )}

              {githubState === 'success' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-4 border-b border-border pb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center font-bold text-white shadow-lg">
                      GH
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground">{githubUrl.split('/').pop() || 'Developer'}</h3>
                      <p className="text-xs text-muted-foreground">GitHub Open Source Profile</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400 tracking-tight">85<span className="text-xs text-muted-foreground">/100</span></div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contribution Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/40 border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Repositories</p>
                      <div className="text-xl font-bold text-foreground">42 <span className="text-xs font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded">Active</span></div>
                    </div>
                    <div className="bg-secondary/40 border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Top Languages</p>
                      <div className="flex items-center gap-2">
                         <div className="w-full h-2 rounded-full bg-secondary overflow-hidden flex">
                           <div className="bg-blue-400 h-full" style={{width: '55%'}} title="TypeScript" />
                           <div className="bg-yellow-400 h-full" style={{width: '30%'}} title="Python" />
                           <div className="bg-emerald-400 h-full" style={{width: '15%'}} title="Go" />
                         </div>
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-2 font-medium">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> TS (55%)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> PY (30%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
                      <BarChart2 className="w-4 h-4 text-primary" /> Commit Activity
                    </p>
                    <div className="h-28 w-full mt-2">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={MOCK_GITHUB_COMMITS}>
                           <Bar dataKey="commits" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
                           <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215 16% 47%)' }} />
                           <Tooltip cursor={{fill: 'hsl(220 35% 16%)'}} contentStyle={{ background: 'hsl(220 40% 11%)', border: '1px solid hsl(220 30% 18%)', borderRadius: 8, fontSize: 12 }} />
                         </BarChart>
                       </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                     <p className="text-xs font-semibold text-primary mb-1">AI Skill Insights:</p>
                     <p className="text-xs text-muted-foreground leading-relaxed text-foreground">
                        Highly active in frontend ecosystems. Consistent contributor across 42 repositories. Displays deep expertise in TypeScript and architecture.
                     </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
                    <button onClick={() => setGithubState('idle')} className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Analyze Another</button>
                    <button onClick={handleSaveGithubResult} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                       <Plus className="w-4 h-4" /> Add to Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

