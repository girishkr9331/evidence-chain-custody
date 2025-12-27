import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 p-2 rounded-full 
                 bg-gray-100 dark:bg-gray-800 
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 transition-colors duration-200 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 w-5 h-5 text-yellow-500 transform transition-all duration-300 ease-in-out
                     ${isDarkMode ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
        />
        <Moon 
          className={`absolute inset-0 w-5 h-5 text-blue-400 transform transition-all duration-300 ease-in-out
                     ${isDarkMode ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'}`}
        />
      </div>
      
      {/* Pulse animation on click */}
      <div className="absolute inset-0 rounded-full animate-theme-switch pointer-events-none" />
    </button>
  )
}

export default ThemeToggle