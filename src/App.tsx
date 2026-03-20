import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Dashboard } from './pages/Dashboard'
import { Employees } from './pages/Employees'
import { AITeamBuilder } from './pages/AITeamBuilder'
import { Projects } from './pages/Projects'

import { RiskPrediction } from './pages/RiskPrediction'
import { AIAssistant } from './pages/AIAssistant'
import { AdminPanel } from './pages/AdminPanel'
import { ChangePassword } from './pages/ChangePassword'
import { Login } from './pages/Login'
import { useAppStore } from './store/appStore'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from './lib/utils'

function PageRenderer({ page, role }: { page: string, role?: string }) {
  switch (page) {
    case 'dashboard': return <Dashboard />
    case 'employees': return <Employees />
    case 'ai-team-builder': return <AITeamBuilder />
    case 'projects': return <Projects />
    case 'risk-prediction': return <RiskPrediction />
    case 'ai-assistant': return <AIAssistant />
    case 'admin': return role === 'admin' ? <AdminPanel /> : <Dashboard />
    case 'change-password': return <ChangePassword />
    default: return <Dashboard />
  }
}

export default function App() {
  const { activePage, isAuthenticated, currentUser } = useAppStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <Login />
  }

  if (currentUser?.isFirstLogin) {
    return <ChangePassword />
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Mobile header with menu */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="font-bold text-sm text-foreground">TeamForge AI</span>
        </div>

        <Header />
        <main className={cn(
          'flex-1 flex flex-col overflow-y-auto',
          activePage === 'ai-assistant' && 'overflow-hidden'
        )}>
          <div className="flex-1 shrink-0">
            <PageRenderer page={activePage} role={currentUser?.role} />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
