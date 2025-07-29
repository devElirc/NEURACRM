# Layout Components

This directory contains reusable layout components for the NeuraCRM application.

## Components

### PageLayout
The main layout component that includes:
- Left sidebar with navigation
- Top header with page title and user menu
- Responsive design for mobile and desktop

### Sidebar
A reusable sidebar component with:
- Navigation menu with icons
- Permission-based menu filtering
- Active state highlighting
- Mobile responsive overlay

### Header
A top header component with:
- Page title display
- User menu with profile and logout
- Mobile menu button
- Responsive design



### SimpleLayout
A simple layout for pages that don't need the sidebar (like login pages):
- Minimal header
- Centered content

## Usage

### Using PageLayout (Recommended)
```tsx
import { PageLayout } from './layout'

// In your App.tsx routes
<Route path="/" element={
  <ProtectedRoute>
    <PageLayout />
  </ProtectedRoute>
}>
  <Route index element={<DashboardPage />} />
  <Route path="accounts" element={<AccountsListPage />} />
  {/* ... other routes */}
</Route>
```

### Using Individual Components
```tsx
import { Sidebar, Header, Footer } from './layout'

const CustomLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

## Features

- **Responsive Design**: Works on mobile and desktop
- **Permission-Based Navigation**: Menu items are filtered based on user permissions
- **Active State**: Current page is highlighted in the sidebar
- **User Menu**: Dropdown with profile and logout options
- **Consistent Styling**: Uses Tailwind CSS with a cohesive design system
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Customization

### Adding New Navigation Items
Edit the `NAVIGATION` array in `Sidebar.tsx`:

```tsx
const NAVIGATION = [
  // ... existing items
  {
    segment: 'reports',
    title: 'Reports',
    icon: '📈',
    href: '/reports',
    permission: 'manage_reports', // optional
  },
]
```

### Customizing Styles
All components use Tailwind CSS classes and can be customized by modifying the className props.

### Adding New Layout Variants
Create new layout components following the same pattern as the existing ones. 