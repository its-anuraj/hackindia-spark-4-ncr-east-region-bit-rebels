import { Search, Bell, Moon, Check, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

export function Header() {
  const { searchQuery, setSearchQuery, notifications, markNotificationRead, markAllNotificationsRead } = useAppStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 px-6 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search employees, projects, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 text-foreground"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={cn(
               "relative p-2 rounded-full transition-colors",
               showNotifs ? "bg-primary/20 text-primary" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-card rounded-full animate-pulse" />
            )}
          </button>
          
          {showNotifs && (
             <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
               <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                 <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                 {unreadCount > 0 && (
                   <button onClick={markAllNotificationsRead} className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                      <Check className="w-3 h-3" /> Mark all read
                   </button>
                 )}
               </div>
               <div className="max-h-[300px] overflow-y-auto">
                 {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                 ) : (
                    <div className="divide-y divide-border">
                      {notifications.map(n => (
                         <div 
                           key={n.id} 
                           className={cn("p-4 transition-colors relative group", !n.read ? "bg-primary/5" : "hover:bg-secondary/50")}
                           onClick={() => markNotificationRead(n.id)}
                         >
                            {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                            <div className="flex items-start justify-between gap-2">
                               <p className={cn("text-xs font-semibold mb-0.5", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
                               <span className="text-[10px] text-muted-foreground shrink-0">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                         </div>
                      ))}
                    </div>
                 )}
               </div>
             </div>
          )}
        </div>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Moon className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
