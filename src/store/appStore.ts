import { create } from 'zustand'
import { SAMPLE_EMPLOYEES, SAMPLE_PROJECTS } from '../data/sampleData'
import bcrypt from 'bcryptjs'

export type SystemUser = {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'employee'
  isFirstLogin?: boolean
}

export type Employee = {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar: string
  availability: 'free' | 'partially_busy' | 'fully_occupied'
  experienceYears: number
  successRate: number
  failureRate: number
  xpPoints: number
  level: number
  salary: number
  hireDate: string
  bio: string
  skills: Array<{ name: string; level: string; score: number }>
  badges: string[]
  projectHistory: string[]
  totalProjectsAssigned?: number
  completedProjects?: number
  recentlyGrew?: boolean
  passwordHash?: string
  isFirstLogin?: boolean
}

export type Project = {
  id: string
  name: string
  description: string
  status: 'planning' | 'active' | 'completed' | 'paused'
  complexity: 'easy' | 'medium' | 'hard'
  budget: number
  spent: number
  deadline: string
  startDate: string
  progress: number
  requiredSkills: string[]
  teamMembers: string[]
  backupMembers: string[]
  riskScore: number
  delayProbability: number
  failureProbability: number
  budgetOverrunProbability: number
  successProbability: number
  aiReasoning: string
  tasks: Array<{ id: string; name: string; status: string; assignee: string }>
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export type AppNotification = {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning'
  read: boolean
  timestamp: Date
}

type AppStore = {
  // Theme
  theme: 'dark'
  
  // Navigation
  activePage: string
  setActivePage: (page: string) => void
  
  // Employees
  employees: Employee[]
  addEmployee: (emp: Employee) => void
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  triggerGrowthUpdate: (employeeIds: string[]) => void
  clearGrowthHighlight: (id: string) => void
  
  // Projects
  projects: Project[]
  addProject: (proj: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  
  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (msg: ChatMessage) => void
  clearChat: () => void
  
  // AI Team Builder
  teamBuilderResult: null | {
    team: Employee[]
    successProbability: number
    reasoning: string
    roleAssignments: Record<string, string>
    estimatedCost: number
    missingSkills: string[]
  }
  setTeamBuilderResult: (result: AppStore['teamBuilderResult']) => void
  
  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  
  // Notifications
  notifications: AppNotification[]
  addNotification: (n: AppNotification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  
  // Auth
  isAuthenticated: boolean
  currentUser: SystemUser | null
  users: SystemUser[]
  setIsAuthenticated: (val: boolean) => void
  setCurrentUser: (user: SystemUser | null) => void
  addUser: (user: SystemUser) => void
  removeUser: (id: string) => void
  updateEmployeePassword: (id: string, hash: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'dark',
  
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  
  employees: SAMPLE_EMPLOYEES.map(e => {
    const isAbhishek = e.email === 'abhishek@gmail.com'
    return {
      ...e,
      passwordHash: bcrypt.hashSync(isAbhishek ? '12345' : 'Temp@1234', 10),
      isFirstLogin: !isAbhishek
    }
  }) as Employee[],
  addEmployee: (emp) => set((s) => {
    if (s.employees.some(e => e.email.toLowerCase() === emp.email.toLowerCase())) {
      throw new Error('An employee with this email already exists.')
    }
    return { employees: [...s.employees, emp] }
  }),
  updateEmployee: (id, updates) =>
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  deleteEmployee: (id) =>
    set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),
  updateEmployeePassword: (id, hash) =>
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? { ...e, passwordHash: hash, isFirstLogin: false } : e)),
    })),
  
  triggerGrowthUpdate: (employeeIds) => set((s) => ({
    employees: s.employees.map((e) => {
      if (employeeIds.includes(e.id)) {
        const total = (e.totalProjectsAssigned || Math.max(1, e.projectHistory.length)) + 1
        const completed = (e.completedProjects || e.projectHistory.length) + 1
        const newSuccessRate = Math.round((completed / total) * 100)
        return {
          ...e,
          totalProjectsAssigned: total,
          completedProjects: completed,
          experienceYears: e.experienceYears + 0.5,
          successRate: newSuccessRate,
          recentlyGrew: true
        }
      }
      return e
    })
  })),
  clearGrowthHighlight: (id) => set((s) => ({
    employees: s.employees.map((e) => e.id === id ? { ...e, recentlyGrew: false } : e)
  })),

  projects: SAMPLE_PROJECTS as Project[],
  addProject: (proj) => set((s) => ({ projects: [...s.projects, proj] })),
  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
  
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),
  
  teamBuilderResult: null,
  setTeamBuilderResult: (result) => set({ teamBuilderResult: result }),
  
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  
  notifications: [],
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllNotificationsRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true }))
  })),
  
  isAuthenticated: false,
  currentUser: null,
  users: [
    {
      id: 'admin_1',
      name: 'Admin System',
      email: 'ajsinghindolia@gmail.com',
      passwordHash: bcrypt.hashSync('1234', 10),
      role: 'admin'
    }
  ],
  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  setCurrentUser: (user) => set({ currentUser: user }),
  addUser: (user) => set(s => ({ users: [...s.users, user] })),
  removeUser: (id) => set(s => ({ users: s.users.filter(u => u.id !== id) }))
}))
