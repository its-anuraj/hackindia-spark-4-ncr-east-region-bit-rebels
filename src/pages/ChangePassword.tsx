import { useState } from 'react'
import { Shield, KeyRound, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'
import bcrypt from 'bcryptjs'

export function ChangePassword() {
  const { currentUser, setActivePage, updateEmployeePassword, setCurrentUser } = useAppStore()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (currentUser?.id) {
        const newHash = bcrypt.hashSync(newPassword, 10)
        // Update employee DB
        updateEmployeePassword(currentUser.id, newHash)
        // Update local session to avoid re-triggering this flow
        setCurrentUser({ ...currentUser, isFirstLogin: false, passwordHash: newHash })
        
        toast.success('Password updated successfully')
        setActivePage(currentUser.role === 'admin' ? 'admin' : 'dashboard')
      }
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4 z-50">
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 mb-6 relative z-10">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2 relative z-10">Change Password</h1>
          <p className="text-sm text-muted-foreground mb-8 relative z-10">
            For security reasons, you must change your temporary password before accessing TeamForge AI.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
            </div>

            <div className="pb-4">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">Confirm Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                  placeholder="Must match new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure My Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
