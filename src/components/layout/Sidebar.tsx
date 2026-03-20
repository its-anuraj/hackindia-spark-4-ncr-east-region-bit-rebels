import { useAppStore } from '../../store/appStore'
import {
  LayoutDashboard, Users, Brain, FolderKanban, Activity, 
  AlertTriangle, MessageSquare, Settings, Sparkles, LogOut
} from 'lucide-react'
import { cn } from '../../lib/utils'

const NAVIGATION = [
  { name: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { name: 'Employees', page: 'employees', icon: Users },
  { name: 'Projects', page: 'projects', icon: FolderKanban },
  { name: 'AI Team Builder', page: 'ai-team-builder', icon: Brain },
  { name: 'Risk Prediction', page: 'risk-prediction', icon: AlertTriangle },

  { name: 'AI Assistant', page: 'ai-assistant', icon: MessageSquare },
  { name: 'Admin Panel', page: 'admin', icon: Settings },
]

export function Sidebar() {
  const { activePage, setActivePage, setIsAuthenticated, currentUser, setCurrentUser } = useAppStore()

  const currentNav = NAVIGATION.filter(item => {
    if (['admin', 'ai-team-builder', 'risk-prediction'].includes(item.page)) {
      return currentUser?.role === 'admin'
    }
    return true
  })

  return (
    <div className="w-64 h-screen bg-card border-r border-border p-4 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          TeamForge AI
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {currentNav.map((item) => {
          const isActive = activePage === item.page
          return (
            <button
              key={item.page}
              onClick={() => setActivePage(item.page)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              {item.name}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 group relative">
          <div className="w-9 h-9 rounded-full bg-secondary flex text-primary items-center justify-center text-sm font-bold border-2 border-primary/20">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{currentUser?.name || 'Authorized User'}</p>
            <p className="text-[10px] text-muted-foreground truncate" title={currentUser?.email}>{currentUser?.email}</p>
          </div>
          <button 
            onClick={() => {
              setIsAuthenticated(false)
              setCurrentUser(null)
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
