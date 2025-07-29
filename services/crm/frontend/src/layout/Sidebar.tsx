import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import {
  BarChart3,
  Building2,
  Users,
  Target,
  DollarSign,
  Inbox,
  User,
  TrendingUp,
  X,
  ChevronUp,
  LogOut
} from 'lucide-react'

// Navigation structure with Lucide icons
const NAVIGATION = [
  {
    kind: 'header',
    title: 'DASHBOARDS',
  },
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    href: '/user',
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'CRM MODULES',
  },
  {
    segment: 'accounts',
    title: 'Accounts',
    icon: Building2,
    href: '/accounts',
    permission: 'manage_accounts',
  },
  {
    segment: 'contacts',
    title: 'Contacts',
    icon: Users,
    href: '/contacts',
    permission: 'manage_contacts',
  },
  {
    segment: 'leads',
    title: 'Leads',
    icon: Target,
    href: '/leads',
    permission: 'manage_leads',
  },
  {
    segment: 'deals',
    title: 'Deals',
    icon: DollarSign,
    href: '/deals',
    permission: 'manage_opportunities',
  },
  {
    segment: 'team_inbox',
    title: 'Team Inbox',
    icon: Inbox,
    href: '/team_inbox',
    permission: 'manage_opportunities',
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'USER',
  },
  {
    segment: 'profile',
    title: 'Profile',
    icon: User,
    href: '/profile',
  },
  {
    segment: 'reports',
    title: 'Reports',
    icon: TrendingUp,
    href: '/reports',
    permission: 'manage_reports',
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isMobile = false,
  collapsed = false,
  onToggleCollapse: _onToggleCollapse
}) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Initialize with the correct active item based on current path
  const getActiveSegment = (pathname: string) => {
    return NAVIGATION.find(item =>
      item.href && pathname === item.href
    )?.segment ||
      NAVIGATION.find(item =>
        item.href && item.href !== '/' && pathname.startsWith(item.href)
      )?.segment || null
  }

  const [activeItem, setActiveItem] = useState<string | null>(() =>
    getActiveSegment(location.pathname)
  );

  useEffect(() => {
    const newActiveSegment = getActiveSegment(location.pathname);
    setActiveItem(newActiveSegment);
  }, [location.pathname]);

  // const hasPermission = (permission: string) => {
  //   if (!user) {
  //     console.log('No user found for permission check:', permission)
  //     return false
  //   }

  //   // Superadmin has all permissions
  //   if (user.is_superadmin) {
  //     console.log('Superadmin access granted for permission:', permission)
  //     return true
  //   }

  //   // If user has no roles, allow basic access (temporary fix)
  //   if (!user.roles || user.roles.length === 0) {
  //     console.log('User has no roles, allowing basic access for:', permission)
  //     return true
  //   }

  //   // Check if user has the specific permission
  //   const hasSpecificPermission = user.roles?.some(role => {
  //     const rolePermissions = role.permissions || {}
  //     return rolePermissions[permission] === true || rolePermissions['all'] === true
  //   })

  //   console.log('Permission check for', permission, ':', {
  //     user: user.email,
  //     roles: user.roles?.map(r => ({ name: r.name, permissions: r.permissions })),
  //     hasPermission: hasSpecificPermission
  //   })

  //   return hasSpecificPermission
  // }

  // const hasRole = (role: string) => {
  //   if (!user) return false
  //   if (user.is_superadmin) return true

  //   return user.roles?.some(userRole => 
  //     userRole.name === role || 
  //     userRole.name === 'superadmin'
  //   )
  // }

  const filteredNavigation = NAVIGATION.filter(item => {
    if (item.kind === 'header' || item.kind === 'divider') return true

    // Temporarily disable permission checks for testing
    console.log('Navigation item:', item.title, 'permission:', item.permission)

    // For now, allow all items to test if the issue is with permissions
    return true

    // Original permission logic (commented out for testing)
    // if (item.permission && !hasPermission(item.permission)) {
    //   console.log('Filtering out item due to missing permission:', item.title, item.permission)
    //   return false
    // }
    // return true
  })

  // Helper function for consistent navigation item styles
  const getNavItemStyles = (isActive: boolean, isCollapsed: boolean) => {
    const baseStyles = `group flex items-center text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative transform-gpu ${isCollapsed ? 'justify-center p-2 mx-auto mb-1 w-10 h-10' : 'px-3 py-2 mx-2'
      }`;

    const activeStyles = 'bg-white bg-opacity-10 dark:bg-gray-700 dark:bg-opacity-50 text-white dark:text-gray-200 shadow-lg hover:text-white dark:hover:text-gray-200';

    const inactiveStyles = 'text-neutral-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:bg-opacity-5 dark:hover:bg-opacity-50';

    return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
  }

  const renderNavigationItem = (item: any, index: number) => {
    if (item.kind === 'header') {
      return (
        <div
          key={`header-${index}`}
          className={`transition-all duration-500 ease-out overflow-hidden ${collapsed && !isMobile
              ? 'max-h-0 opacity-0 px-1.5 py-0 mt-0'
              : 'max-h-8 opacity-100 px-2.5 py-1 mt-2 mb-1 first:mt-1'
            }`}
          style={{
            transitionDelay: collapsed && !isMobile ? '0ms' : '150ms'
          }}
        >
          <h3 className="text-xs font-semibold text-white dark:text-gray-300 text-opacity-50 dark:text-opacity-70 uppercase tracking-wide whitespace-nowrap w-full">
            {item.title}
          </h3>
        </div>
      )
    }

    if (item.kind === 'divider') {
      return (
        <div
          key={`divider-${index}`}
          className={`transition-all duration-300 overflow-hidden ${collapsed && !isMobile
              ? 'max-h-0 opacity-0 my-0'
              : 'max-h-3 opacity-100 my-2'
            }`}
          style={{
            transitionDelay: collapsed && !isMobile ? '0ms' : '100ms'
          }}
        >
          <hr className="border-white dark:border-gray-600 border-opacity-15" />
        </div>
      )
    }

    const isActive = activeItem === item.segment
    const IconComponent = item.icon

    // Debug logging for dashboard specifically
    if (item.segment === 'dashboard') {
      console.log('Dashboard render - activeItem:', activeItem, 'isActive:', isActive, 'pathname:', location.pathname)
    }

    return (
      <Link
        key={item.segment}
        to={item.href}
        className={getNavItemStyles(isActive, collapsed && !isMobile)}
        onClick={() => {
          // Provide immediate visual feedback
          console.log('Clicked item:', item.segment, 'Current active:', activeItem)
          setActiveItem(item.segment)
          if (isMobile) onClose()
        }}
        title={collapsed && !isMobile ? item.title : undefined}
      >
        <IconComponent
          className={`transition-all duration-150 ease-out ${collapsed && !isMobile
              ? 'w-5 h-5'
              : 'w-5 h-5 mr-3'
            } ${isActive
              ? 'text-white dark:text-gray-200 scale-105 group-hover:text-white dark:group-hover:text-gray-200 drop-shadow-sm transform-gpu'
              : 'text-white dark:text-gray-400 text-opacity-70 group-hover:scale-105 group-hover:text-white dark:group-hover:text-gray-200 transform-gpu'
            }`}
        />
        <div className={`flex items-center transition-all duration-200 ease-out overflow-hidden ${collapsed && !isMobile ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-3'
          }`}
          style={{
            transitionDelay: collapsed && !isMobile ? '0ms' : '50ms'
          }}>
          <span className="font-medium truncate whitespace-nowrap">{item.title}</span>
        </div>
        {isActive && (collapsed && !isMobile) && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white dark:bg-gray-300 rounded-l opacity-90 shadow-lg transition-all duration-150 ease-out transform-gpu"></div>
        )}
      </Link>
    )
  }

  const sidebarContent = (
    <div className={`flex min-h-0 flex-1 flex-col bg-primary-600 dark:bg-gray-800 shadow-lg transition-all duration-300 ease-out overflow-hidden ${collapsed && !isMobile ? 'items-center' : ''
      }`}>
      {/* Branding */}
      <div className={`flex h-14 items-center bg-primary-600 dark:bg-gray-800 border-b border-primary-500 dark:border-gray-700 border-opacity-15 ${collapsed && !isMobile ? 'justify-center px-2' : 'px-4'
        }`}>
        <div className={`flex items-center ${collapsed && !isMobile ? '' : 'space-x-3'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-white to-blue-50 dark:from-gray-200 dark:to-gray-300 rounded-lg flex items-center justify-center shadow-md border border-white dark:border-gray-600 border-opacity-20">
            <span className="text-primary-600 dark:text-gray-800 font-bold text-lg">N</span>
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-white dark:text-gray-200 font-semibold text-xl tracking-wide">NeuraCRM</span>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto text-white dark:text-gray-200 hover:text-white dark:hover:text-gray-300 hover:text-opacity-70 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-2 overflow-y-auto ${collapsed && !isMobile ? 'px-1.5 space-y-1' : 'px-2.5 space-y-0.5'
        }`}>
        {filteredNavigation.map((item, index) => renderNavigationItem(item, index))}
      </nav>


      {/* User Profile Section - Enhanced with Menu */}
      <div className={`border-t border-primary-500 dark:border-gray-700 border-opacity-15 relative ${collapsed && !isMobile ? 'px-1.5 py-3' : 'px-2.5 py-2'
        }`}>
        {/* User Dropdown Menu */}
        {showUserMenu && (!collapsed || isMobile) && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute bottom-full left-2.5 right-2.5 mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-600">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setShowUserMenu(false)
                  if (isMobile) onClose()
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  logout()
                  setShowUserMenu(false)
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center transition-all duration-200 hover:bg-white hover:bg-opacity-10 rounded-lg ${collapsed && !isMobile ? 'justify-center p-2' : 'p-2 space-x-2.5'
            }`}
          title={collapsed && !isMobile ? `${user?.first_name} ${user?.last_name}` : undefined}
        >
          <div
            className={`bg-white bg-opacity-20 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 border border-white border-opacity-20 ${collapsed && !isMobile ? 'w-8 h-8' : 'w-10 h-10'
              }`}
          >
            <span className="text-white dark:text-gray-200 font-semibold text-sm">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </span>
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${collapsed && !isMobile ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100'
            }`}
            style={{
              transitionDelay: collapsed && !isMobile ? '0ms' : '220ms'
            }}>
            <div className="text-left">
              <p className="text-sm font-semibold text-white dark:text-gray-200 truncate whitespace-nowrap">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-white dark:text-gray-400 text-opacity-60 truncate whitespace-nowrap">{user?.email}</p>
              <div className="flex items-center mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                <span className="text-xs text-green-300 dark:text-green-400 font-medium whitespace-nowrap">Online</span>
              </div>
            </div>
          </div>
          {(!collapsed || isMobile) && (
            <ChevronUp
              className={`w-4 h-4 text-white dark:text-gray-400 text-opacity-60 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''
                }`}
            />
          )}
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`}
          onClick={onClose}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-56 flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {sidebarContent}
        </div>
      </div>
    )
  }

  // Desktop sidebar - with collapsible width
  return (
    <div className={`hidden lg:flex lg:fixed lg:inset-y-0 lg:flex-col transition-all duration-300 ease-out ${collapsed ? 'lg:w-14' : 'lg:w-52'
      }`}>
      {sidebarContent}
    </div>
  )
} 