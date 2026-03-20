import { Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#030712] border-t border-border mt-auto shrink-0">
      <div className="w-full px-6 py-6 flex flex-col items-center justify-center text-center text-sm text-gray-300 space-y-2">
        <p className="flex items-center justify-center gap-1.5">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> by{' '}
          <a 
            href="#" 
            className="font-bold text-white hover:text-emerald-400 hover:underline transition-all cursor-pointer"
          >
            Bit Rebels
          </a>
        </p>
        <p className="text-gray-500 text-xs">&copy; {currentYear} TeamForge AI. All rights reserved.</p>
      </div>
    </footer>
  )
}
