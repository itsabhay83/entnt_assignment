import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Search, 
  Bell, 
  User, 
  Home, 
  Briefcase, 
  Users, 
  Menu,
  X
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  // const navigate = useNavigate()

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Candidates', href: '/candidates', icon: Users },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results or filter current page
      console.log('Searching for:', searchQuery)
      // You can implement search logic here
    }
  }

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard/analytics'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="flex items-center ml-2 md:ml-0">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-lg">
                  Talent
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  Flow
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search jobs, candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>
            </div>

            {/* Right side - Notifications & Profile */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <Bell size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="text-white" size={18} />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  Admin User
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Navigation */}
        <nav className={`
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        `}>
          <div className="pt-5 pb-4 overflow-y-auto">
            <div className="px-3">
              <ul className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`
                          flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                          ${isActiveRoute(item.href)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon size={18} className="mr-3" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </nav>

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout