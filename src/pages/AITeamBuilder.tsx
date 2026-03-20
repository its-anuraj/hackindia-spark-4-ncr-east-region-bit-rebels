import { useState } from 'react'
import { useAppStore, type Employee } from '../store/appStore'
import { AVAILABILITY_CONFIG, SKILL_LEVELS, ALL_SKILLS } from '../data/sampleData'

import { 
  Brain, Star, Clock, AlertCircle, CheckCircle2, Loader2, Play, Users, 
  Target, Shield, AlertTriangle, ChevronRight, Plus, X, Sparkles, DollarSign, Zap 
} from 'lucide-react'
import { cn } from '../lib/utils'
import { simulateEmailSend, assignProjectToEmployee } from '../lib/apiMock'
import toast from 'react-hot-toast'

type BuilderForm = {
  projectName: string
  description: string
  requiredSkills: string[]
  deadline: string
  budget: number
  complexity: 'easy' | 'medium' | 'hard'
  teamSize: number
}

export function AITeamBuilder() {
  const { employees, teamBuilderResult, setTeamBuilderResult, setActivePage, addProject, addNotification } = useAppStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [assignStatus, setAssignStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [form, setForm] = useState<BuilderForm>({
    projectName: '',
    description: '',
    requiredSkills: [],
    deadline: '',
    budget: 100000,
    complexity: 'medium' as 'easy' | 'medium' | 'hard',
    teamSize: 4,
  })
  const [newSkill, setNewSkill] = useState('')

  const addSkill = (skill: string) => {
    if (skill && !form.requiredSkills.includes(skill)) {
      setForm((f) => ({ ...f, requiredSkills: [...f.requiredSkills, skill] }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, requiredSkills: f.requiredSkills.filter((s) => s !== skill) }))
  }

  const buildTeam = async () => {
    if (!form.projectName || form.requiredSkills.length === 0) {
      toast.error('Please fill in project name and required skills')
      return
    }
    setLoading(true)

    try {
      // Score employees against requirements
      const scored = employees.map((emp) => {
        let score = 0
        const matchedSkills: string[] = []
        form.requiredSkills.forEach((req) => {
          const skillMatch = emp.skills.find((s) => s.name.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.name.toLowerCase()))
          if (skillMatch) {
            const multiplier = skillMatch.level === 'expert' ? 3 : skillMatch.level === 'intermediate' ? 2 : 1
            score += skillMatch.score * multiplier
            matchedSkills.push(skillMatch.name)
          }
        })
        score += emp.successRate * 0.5
        score += emp.experienceYears * 5
        if (emp.availability === 'free') score += 30
        if (emp.availability === 'partially_busy') score += 10
        return { employee: emp, score, matchedSkills }
      })

      scored.sort((a, b) => b.score - a.score)
      const selected = scored.slice(0, form.teamSize).map((s) => s.employee)

      const avgSuccess = Math.round(
        selected.reduce((a, e) => a + e.successRate, 0) / selected.length
      )
      const complexityPenalty = form.complexity === 'hard' ? 15 : form.complexity === 'medium' ? 8 : 0
      const successProbability = Math.min(99, Math.max(50, avgSuccess - complexityPenalty + 5))

      const roleMap: Record<string, string> = {}
      selected.forEach((emp) => {
        if (emp.role.toLowerCase().includes('frontend')) roleMap[emp.id] = 'Frontend Lead'
        else if (emp.role.toLowerCase().includes('backend')) roleMap[emp.id] = 'Backend Lead'
        else if (emp.role.toLowerCase().includes('design')) roleMap[emp.id] = 'Design Lead'
        else if (emp.role.toLowerCase().includes('product')) roleMap[emp.id] = 'Project Manager'
        else if (emp.role.toLowerCase().includes('devops') || emp.role.toLowerCase().includes('infra')) roleMap[emp.id] = 'DevOps Lead'
        else if (emp.role.toLowerCase().includes('security')) roleMap[emp.id] = 'Security Lead'
        else if (emp.role.toLowerCase().includes('ai') || emp.role.toLowerCase().includes('ml')) roleMap[emp.id] = 'AI/ML Lead'
        else roleMap[emp.id] = 'Technical Lead'
      })

      const estimatedCost = selected.reduce((acc, emp) => acc + Math.round(emp.salary / 12 * 3), 0)

      const allTeamSkills = new Set<string>()
      selected.forEach(emp => {
        emp.skills.forEach(skill => allTeamSkills.add(skill.name.toLowerCase()))
      })

      const missingSkills = form.requiredSkills.filter(req => {
        return !Array.from(allTeamSkills).some(skill => skill.includes(req.toLowerCase()) || req.toLowerCase().includes(skill))
      })

      let reasoning = `Selected ${selected.length} team members for "${form.projectName}" based on skill matching, experience, and availability analysis. ${selected[0]?.name} leads with the highest compatibility score (${avgSuccess}% avg success rate). The team covers ${form.requiredSkills.slice(0, 3).join(', ')} and other required competencies. Estimated ${successProbability}% success probability for ${form.complexity} complexity with ${form.deadline ? `deadline ${form.deadline}` : 'given timeline'}.`
      
      if (missingSkills.length > 0) {
        reasoning += `\n\nIdentified skill gaps: ${missingSkills.join(', ')}.`
      }

      setTeamBuilderResult({
        team: selected,
        successProbability: missingSkills.length > 0 ? Math.max(30, successProbability - (missingSkills.length * 10)) : successProbability,
        reasoning,
        roleAssignments: roleMap,
        estimatedCost,
        missingSkills
      })
      setStep(3)
    } catch (err) {
      toast.error('Failed to build team. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!teamBuilderResult) return
    setAssignStatus('loading')

    // 1. Create project in store
    addProject({
      id: `proj_${Date.now()}`,
      name: form.projectName,
      description: form.description,
      status: 'planning',
      complexity: form.complexity,
      budget: form.budget,
      spent: 0,
      deadline: form.deadline,
      startDate: new Date().toISOString().split('T')[0],
      progress: 0,
      requiredSkills: form.requiredSkills,
      teamMembers: teamBuilderResult.team.map(e => e.id),
      backupMembers: [],
      riskScore: 20,
      delayProbability: 15,
      failureProbability: 10,
      budgetOverrunProbability: 15,
      successProbability: teamBuilderResult.successProbability,
      aiReasoning: teamBuilderResult.reasoning,
      tasks: []
    })

    // 2. Dispatch assign notifications (Micro-stagger for toasts)
    for (const emp of teamBuilderResult.team) {
      // 3. Mock Backend logic
      const response = await assignProjectToEmployee(emp.id, emp.name, emp.email)

      if (response.success) {
        addNotification({
           id: `notif_${Date.now()}_${Math.random()}`,
           title: 'Project Assigned',
           message: response.notification,
           type: 'success',
           read: false,
           timestamp: new Date()
        })
        toast.success(response.notification, { position: 'top-right', duration: 4000 })
        
        // 4. Email simulation with Toast Promise
        const emailPromise = simulateEmailSend(emp.email)
        toast.promise(emailPromise, {
           loading: 'Sending email...',
           success: `Email sent successfully to ${emp.email}`,
           error: 'Failed to send email'
        }, { position: 'top-right' })

        await new Promise(r => setTimeout(r, 600)) // delay slightly for UI pleasantness
      }
    }

    setAssignStatus('success')
    await new Promise(r => setTimeout(r, 1200))
    setActivePage('projects')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Team Builder</h2>
            <p className="text-xs text-muted-foreground">Intelligent team assembly powered by TeamForge AI</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mt-4">
          {[
            { n: 1, label: 'Project Details' },
            { n: 2, label: 'Requirements' },
            { n: 3, label: 'AI Results' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                step === s.n ? 'bg-primary/20 text-primary border border-primary/40' :
                step > s.n ? 'bg-emerald-400/15 text-emerald-400' :
                'bg-secondary text-muted-foreground'
              )}>
                {step > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">{s.n}</span>}
                {s.label}
              </div>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground">Project Details</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Name *</label>
              <input
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                placeholder="e.g. FinTech Payment Platform v2"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Describe the project goals, scope, and key deliverables..."
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Complexity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, complexity: c })}
                      className={cn(
                        'py-2 rounded-lg text-xs font-medium capitalize transition-all',
                        form.complexity === c
                          ? c === 'easy' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/40' :
                            c === 'medium' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40' :
                            'bg-red-400/20 text-red-400 border border-red-400/40'
                          : 'bg-secondary text-muted-foreground border border-border hover:border-primary/30'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team Size</label>
                <input
                  type="number" min={2} max={10} value={form.teamSize}
                  onChange={(e) => setForm({ ...form, teamSize: +e.target.value })}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deadline</label>
                <input
                  type="date" value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Budget ($)</label>
                <input
                  type="number" min={10000} step={10000} value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: +e.target.value })}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => { if (!form.projectName) { toast.error('Project name required'); return }; setStep(2) }}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Next: Requirements <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground">Skill Requirements</h3>
          <p className="text-xs text-muted-foreground">Add the skills required for this project. AI will match the best employees.</p>

          {/* Add Skills */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Add Required Skills</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill(newSkill)}
                  placeholder="Type skill or select below..."
                  list="skills-list"
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <datalist id="skills-list">
                  {ALL_SKILLS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <button
                onClick={() => addSkill(newSkill)}
                className="px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Add */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SKILLS.slice(0, 12).filter((s) => !form.requiredSkills.includes(s)).map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Skills */}
          {form.requiredSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Selected skills ({form.requiredSkills.length}):</p>
              <div className="flex flex-wrap gap-2">
                {form.requiredSkills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/15 border border-primary/30 text-primary text-xs rounded-full font-medium">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
            <h4 className="text-xs font-semibold text-foreground mb-2">Project Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Name: <span className="text-foreground">{form.projectName}</span></span>
              <span>Complexity: <span className="text-foreground capitalize">{form.complexity}</span></span>
              <span>Budget: <span className="text-foreground">${form.budget.toLocaleString()}</span></span>
              <span>Team Size: <span className="text-foreground">{form.teamSize} members</span></span>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              Back
            </button>
            <button
              onClick={buildTeam}
              disabled={loading || form.requiredSkills.length === 0}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Build Team with AI</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 - Results */}
      {step === 3 && teamBuilderResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-emerald-400/10 to-primary/5 border border-emerald-400/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Team Successfully Assembled!</h3>
            </div>
            <p className="text-xs text-muted-foreground">AI analyzed {employees.length} employees and selected the optimal team for "{form.projectName}".</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{teamBuilderResult.successProbability}%</p>
              <p className="text-xs text-muted-foreground">Success Probability</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{teamBuilderResult.team.length}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">${(teamBuilderResult.estimatedCost / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">Est. Cost (3mo)</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Selected Team Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamBuilderResult.team.map((emp, i) => {
                const role = teamBuilderResult.roleAssignments[emp.id]
                const avail = AVAILABILITY_CONFIG[emp.availability]
                return (
                  <div key={emp.id} className={cn('flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border/50 animate-fade-in', `stagger-${i + 1}`)}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {emp.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', avail.dot)} />
                      </div>
                      <p className="text-xs text-primary font-medium">{role}</p>
                      <p className="text-[11px] text-muted-foreground">{emp.successRate}% success · Lv.{emp.level}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-emerald-400 font-medium">Fit: {Math.round(80 + i * -3 + Math.random() * 10)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Skill Gap + Hiring Suggestion */}
          {teamBuilderResult.missingSkills.length > 0 && (
            <div className="bg-gradient-to-r from-red-500/10 to-amber-500/5 border border-red-500/30 rounded-xl p-5 mb-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-foreground">Skill Gap Alert</h3>
              </div>
              <ul className="space-y-2 mb-4">
                {teamBuilderResult.missingSkills.map((missingSkill, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-foreground">No employee available with {missingSkill}.</strong> This creates a critical project dependency.</span>
                  </li>
                ))}
              </ul>
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 text-xs font-semibold rounded-lg border border-red-500/20">
                <Shield className="w-4 h-4" /> Hiring recommended to fulfill these requirements
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI Reasoning</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{teamBuilderResult.reasoning}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => { setStep(1); setTeamBuilderResult(null) }}
              disabled={assignStatus !== 'idle'}
              className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Build Another Team
            </button>
            <button
              onClick={handleCreateProject}
              disabled={assignStatus !== 'idle'}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {assignStatus === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Assigning Team...</>
              ) : assignStatus === 'success' ? (
                <><CheckCircle2 className="w-4 h-4" /> Redirecting...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Assign Team & Create Project</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
