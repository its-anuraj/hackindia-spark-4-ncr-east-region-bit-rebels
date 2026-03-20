import { useState, useRef, useEffect } from 'react'
import { useAppStore, type ChatMessage } from '../store/appStore'

import {
  Send, Sparkles, Brain, Users, FolderKanban, RotateCcw,
  Loader2, Copy, ChevronDown, Zap, MessageSquare
} from 'lucide-react'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

const SUGGESTED_PROMPTS = [
  { icon: '🚀', text: 'Build a team for a fintech app in 2 months', category: 'Team Building' },
  { icon: '⚠️', text: 'Identify risk factors for the Cloud Migration project', category: 'Risk Analysis' },
  { icon: '👤', text: 'Who is our best React developer available right now?', category: 'Employee Query' },
  { icon: '📊', text: 'Summarize overall team performance this quarter', category: 'Analytics' },
  { icon: '💡', text: 'Which skills are most in demand across our projects?', category: 'Skill Intelligence' },
  { icon: '🎯', text: 'Suggest backup employees for the FinTech project', category: 'Backup Planning' },
]

function generateAIResponse(userMessage: string, employees: any[], projects: any[]): string {
  const msg = userMessage.toLowerCase()

  if (msg.includes('fintech') || msg.includes('build a team')) {
    const available = employees.filter((e) => e.availability !== 'fully_occupied')
    const topDevs = available.filter((e) => e.skills.some((s: any) => ['React', 'Node.js', 'TypeScript'].includes(s.name))).slice(0, 2)
    const mlEng = available.find((e) => e.skills.some((s: any) => s.name.includes('Python') || s.name.includes('LLM')))
    const teamNames = [topDevs[0]?.name, topDevs[1]?.name, mlEng?.name].filter(Boolean).join(', ')

    return `**AI Team Assembly — FinTech Application**\n\nBased on the requirements for a 2-month fintech project, I recommend this team:\n\n**Recommended Team:**\n${topDevs[0] ? `• **${topDevs[0].name}** (${topDevs[0].role}) — Frontend & UI, ${topDevs[0].successRate}% success rate` : ''}\n${topDevs[1] ? `• **${topDevs[1].name}** (${topDevs[1].role}) — Backend APIs & Data, ${topDevs[1].successRate}% success rate` : ''}\n${mlEng ? `• **${mlEng.name}** (${mlEng.role}) — ML & Risk Systems, ${mlEng.successRate}% success rate` : ''}\n\n**Estimated Success Probability:** 87%\n**Estimated Timeline:** 7-8 weeks (buffer included)\n**Estimated Cost:** ~$85,000 for 2-month engagement\n\n**AI Reasoning:** This team combines strong frontend execution, robust backend capabilities, and specialized fintech/ML expertise. All selected members have >85% historical success rates and are currently available.\n\n*Navigate to AI Team Builder for full automated assembly options.*`
  }

  if (msg.includes('risk') || msg.includes('cloud migration')) {
    return `**Risk Analysis — Cloud Migration Project**\n\nCurrent risk assessment for the Cloud Migration project:\n\n🟡 **Overall Risk Score: 45%** (Medium-High)\n\n**Key Risk Factors:**\n• **Delay Probability: 30%** — Timeline is aggressive for microservices migration scope\n• **Budget Overrun: 38%** — Currently at 34% of budget with only 28% completion\n• **Technical Complexity: High** — Legacy monolith decomposition is inherently unpredictable\n\n**Immediate Recommendations:**\n1. 🔴 Add 1 senior backend engineer to accelerate service decomposition\n2. 🟡 Conduct weekly budget reviews and scope prioritization\n3. 🟢 Enable automated rollback mechanisms before production cutover\n4. 🟡 Consider phasing migration in 4 separate service groups\n\n**Backup Resources Available:** Omar Hassan (Security) can assist with security hardening.\n\n*View full risk dashboard in Risk Prediction section.*`
  }

  if (msg.includes('react') || msg.includes('best') || msg.includes('developer')) {
    const reactDevs = employees
      .filter((e) => e.skills.some((s: any) => s.name === 'React'))
      .sort((a: any, b: any) => {
        const aSkill = a.skills.find((s: any) => s.name === 'React')?.score || 0
        const bSkill = b.skills.find((s: any) => s.name === 'React')?.score || 0
        return bSkill - aSkill
      })

    const top = reactDevs[0]
    const available = reactDevs.filter((e) => e.availability === 'free')

    return `**Best Available React Developer**\n\n🏆 **Top React Expert: ${top?.name}**\n• Role: ${top?.role}\n• React Score: ${top?.skills.find((s: any) => s.name === 'React')?.score}/100 (Expert)\n• Overall Success Rate: ${top?.successRate}%\n• Status: ${top?.availability === 'free' ? '✅ Available' : '⚠️ Partially Busy'}\n\n**All React-Capable Developers:**\n${reactDevs.map((e: any) => {
      const skill = e.skills.find((s: any) => s.name === 'React')
      return `• ${e.name}: Score ${skill?.score}/100 (${skill?.level}) — ${e.availability === 'free' ? '✅ Available' : e.availability === 'partially_busy' ? '⚠️ Partial' : '🔴 Busy'}`
    }).join('\n')}\n\n${available.length} developer(s) are fully available right now.`
  }

  if (msg.includes('performance') || msg.includes('summary') || msg.includes('quarter')) {
    const avgSuccess = Math.round(employees.reduce((a: number, e: any) => a + e.successRate, 0) / employees.length)
    const topEmp = [...employees].sort((a: any, b: any) => b.xpPoints - a.xpPoints)[0]
    const completed = projects.filter((p: any) => p.status === 'completed').length

    return `**Q1 2026 Team Performance Summary**\n\n📊 **Overall Metrics:**\n• Average Success Rate: **${avgSuccess}%** (+4.2% vs last quarter)\n• Projects Completed: **${completed}**\n• Active Projects: **${projects.filter((p: any) => p.status === 'active').length}**\n• Total Employees: **${employees.length}**\n\n🏆 **Top Performer: ${topEmp?.name}**\n• XP Earned: ${topEmp?.xpPoints.toLocaleString()} points\n• Level: ${topEmp?.level}\n• Success Rate: ${topEmp?.successRate}%\n\n📈 **Key Highlights:**\n• AI Customer Support Bot delivered 3 days ahead of schedule\n• Engineering team grew skill scores by average 8 points\n• Zero critical security incidents this quarter\n• Team collaboration rating: 4.7/5.0\n\n💡 **Areas for Improvement:**\n• Cloud Migration timeline needs attention (30% delay risk)\n• 2 employees need upskilling in modern DevOps tooling`
  }

  if (msg.includes('skill') || msg.includes('demand')) {
    return `**In-Demand Skills Analysis — Current Portfolio**\n\n🔥 **Highest Demand Skills (by project requirements):**\n\n1. **Python** — Required in 75% of active projects\n   → Current team coverage: 4/8 members have Python skills\n   → Gap: Need 1-2 more Python-proficient engineers\n\n2. **React/TypeScript** — Core frontend stack\n   → Team coverage: Strong (3 skilled members)\n   → Recommendation: Mentor junior devs to expert level\n\n3. **LLM/AI Engineering** — Rapidly growing demand\n   → Only 1 expert (Priya Sharma)\n   → **High priority**: Upskill 2 additional engineers\n   → Estimated time: 3-4 months with structured training\n\n4. **Cloud/DevOps (AWS/K8s)** — Infrastructure critical\n   → Coverage: Alex Rivera (expert), others partial\n   → Recommendation: Cross-train 1 backend engineer\n\n**Suggested Training Budget:** $18,000 Q2 2026\n*Navigate to Skill Intelligence for detailed learning paths.*`
  }

  if (msg.includes('backup')) {
    return `**Backup Employee Recommendations — FinTech Project**\n\nCurrent FinTech team: Sarah Chen, Priya Sharma, Lisa Park\n\n**Recommended Backup Assignments:**\n\n• **Backup for Sarah Chen (Frontend):**\n  → David Kim — React (Intermediate, 78/100), available\n  → Best coverage for emergency replacement\n\n• **Backup for Priya Sharma (AI/ML):**\n  → No direct ML backup available ⚠️\n  → Recommend: Upskill Marcus Johnson in MLOps (4-week plan)\n  → Alternative: Contract engagement if critical\n\n• **Backup for Lisa Park (PM):**\n  → Omar Hassan can serve as interim PM for technical coordination\n  → For strategic PM: Escalate to department head\n\n**Action Items:**\n1. ✅ Assign David Kim as frontend backup immediately\n2. 🟡 Start Marcus Johnson on ML fundamentals training\n3. 📋 Document backup protocols in project charter\n\n*Use AI Team Builder to formally assign backup members.*`
  }

  // Generic response
  const empCount = employees.length
  const activeProj = projects.filter((p: any) => p.status === 'active').length
  return `I'm the TeamForge AI Assistant. I can help you with:\n\n• **Team Assembly** — "Build a team for [project type] in [timeframe]"\n• **Risk Analysis** — "Analyze risks for [project name]"\n• **Employee Queries** — "Who are our best [skill] developers?"\n• **Performance Analytics** — "Summarize team performance"\n• **Skill Intelligence** — "What skills are in demand?"\n• **Backup Planning** — "Suggest backups for [project]"\n\n**Current Status:**\n• ${empCount} employees in the system\n• ${activeProj} active projects\n• AI monitoring all TeamForge AI metrics in real-time\n\nHow can I optimize your teams today?`
}

export function AIAssistant() {
  const { employees, projects, chatMessages, addChatMessage, clearChat } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    addChatMessage(userMsg)
    setInput('')
    setLoading(true)

    // Simulate thinking
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))

    const response = generateAIResponse(content, employees, projects)
    const aiMsg: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }
    addChatMessage(aiMsg)
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Brain className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">TeamForge AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-muted-foreground">Online · Ready to assist</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chatMessages.length > 0 && (
            <button
              onClick={() => { clearChat(); toast.success('Chat cleared') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors border border-border"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 animate-float">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">TeamForge AI Assistant</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
              Ask me anything about your TeamForge AI. I can build teams, analyze risks, find talent, and optimize project success.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => sendMessage(prompt.text)}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-left hover:border-primary/40 hover:bg-secondary/50 transition-all group"
                >
                  <span className="text-xl flex-shrink-0">{prompt.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{prompt.category}</p>
                    <p className="text-sm text-foreground truncate">{prompt.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Analyzing TeamForge AI data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-card/50">
        {chatMessages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p.text}
                onClick={() => sendMessage(p.text)}
                className="text-xs px-3 py-1.5 bg-secondary border border-border rounded-full text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              >
                {p.icon} {p.text.length > 35 ? p.text.slice(0, 33) + '…' : p.text}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about your TeamForge AI... (Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 min-h-[44px] max-h-32 transition-all"
              style={{ height: 'auto' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">AI responses are generated based on your TeamForge AI data.</p>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  const renderContent = (text: string) => {
    const parts = text.split('\n')
    return parts.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-foreground mt-2 first:mt-0">{line.slice(2, -2)}</p>
      }
      if (line.startsWith('• ')) {
        const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return <p key={i} className="flex items-start gap-1.5 ml-2"><span className="text-primary mt-0.5 flex-shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: content }} /></p>
      }
      const rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <p key={i} className={cn('', line === '' && 'h-2')} dangerouslySetInnerHTML={{ __html: rendered }} />
    })
  }

  return (
    <div className={cn('flex items-start gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        isUser ? 'bg-gradient-to-br from-primary to-accent text-white' : 'bg-primary/15 border border-primary/30'
      )}>
        {isUser ? 'AD' : <Brain className="w-4 h-4 text-primary" />}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-white rounded-tr-sm'
          : 'bg-card border border-border rounded-tl-sm text-muted-foreground'
      )}>
        {isUser ? <p>{message.content}</p> : (
          <div className="space-y-0.5 text-[13px]">{renderContent(message.content)}</div>
        )}
        <p className={cn('text-[10px] mt-2', isUser ? 'text-white/60' : 'text-muted-foreground/60')}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
