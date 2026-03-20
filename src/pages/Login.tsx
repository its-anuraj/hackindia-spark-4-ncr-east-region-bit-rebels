import { useState } from 'react'
import { Brain, Lock, Mail, Loader2 } from 'lucide-react'
import { useAppStore, type SystemUser } from '../store/appStore'
import toast from 'react-hot-toast'
import bcrypt from 'bcryptjs'

export function Login() {
  const { setIsAuthenticated, setCurrentUser, users, employees, setActivePage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      
      let matchedUser: SystemUser | null = null

      // Check Admin Layer
      const adminMatch = users.find(u => u.email === email)
      if (adminMatch && bcrypt.compareSync(password, adminMatch.passwordHash)) {
        matchedUser = adminMatch
      } else {
        // Check Employee Layer
        const empMatch = employees.find(e => e.email === email && e.passwordHash)
        if (empMatch && empMatch.passwordHash && bcrypt.compareSync(password, empMatch.passwordHash)) {
          matchedUser = {
            id: empMatch.id,
            name: empMatch.name,
            email: empMatch.email,
            passwordHash: empMatch.passwordHash,
            role: 'employee',
            isFirstLogin: empMatch.isFirstLogin
          }
        }
      }
      
      if (matchedUser) {
        toast.success(`Login successful! Welcome ${matchedUser.name}.`, { icon: '👋', duration: 3000 })
        setCurrentUser(matchedUser)
        setIsAuthenticated(true)
        
        if (matchedUser.isFirstLogin) {
          setActivePage('change-password')
        } else {
          setActivePage(matchedUser.role === 'admin' ? 'admin' : 'dashboard')
        }
      } else {
        toast.error('Invalid credentials. Please try again.')
      }
    }, 1200)
  }

  return (
    <div className="flex h-screen w-full bg-background items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full animate-pulse transition-all duration-[5000ms] ease-in-out"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full transition-all duration-[7000ms]"></div>
      </div>

      <div className="w-full max-w-md bg-card/60 backdrop-blur-2xl border border-border/40 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in text-center">
        <div className="w-16 h-16 bg-primary/15 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-1">TeamForge AI</h1>
        <p className="text-muted-foreground text-sm mb-8">Sign in to orchestrate your workforce.</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium text-foreground"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Workspace'}
          </button>
        </form>
      </div>
    </div>
  )
}
