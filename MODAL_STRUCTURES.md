# Modal Structures Reference

This document provides comprehensive reference for all modal components and their structures in the NeuraCRM application.

## Table of Contents
- [Lead Conversion Modal](#lead-conversion-modal)
- [Modal Design Patterns](#modal-design-patterns)
- [Component Architecture](#component-architecture)
- [Usage Guidelines](#usage-guidelines)

---

## Lead Conversion Modal

### Component Location
- **File**: `src/modules/leads/LeadConversionModal.tsx`
- **Integration**: `src/modules/leads/LeadDetailsPage.tsx`

### Visual Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Convert Lead: John Smith                          [×]      │
├─────────────────────────────────────────────────────────────┤
│  Review and edit the information before converting...       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Account Information                    *Required        │
│  ├ Account Name: [Acme Corp               ] *               │
│  ├ Industry:     [Technology              ]                 │
│  ├ Website:      [https://acme.com        ]                 │
│  ├ Phone:        [(555) 123-4567          ]                 │
│  ├ Employees:    [100                     ]                 │
│  └ ... (additional fields)                                  │
│                                                             │
│  👤 Contact Information                    *Required        │
│  ├ First Name:   [John                    ] *               │
│  ├ Last Name:    [Smith                   ] *               │
│  ├ Title:        [CEO                     ]                 │
│  ├ Email:        [john@acme.com           ]                 │
│  ├ Phone:        [(555) 123-4567          ]                 │
│  └ ... (additional fields)                                  │
│                                                             │
│  ☑️ Also create Deal                      Optional          │
│  ┌─────────────────────────────────────────────────────────┤
│  │ 💼 Deal Information                                      │
│  │ ├ Deal Name:     [Deal for John Smith   ] *             │
│  │ ├ Stage:         [Prospecting           ▼]              │
│  │ ├ Amount:        [$                     ]               │
│  │ ├ Close Date:    [2025-10-19           📅]              │
│  │ └ Description:   [                      ]               │
│  └─────────────────────────────────────────────────────────┤
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel] [Convert Lead] │
└─────────────────────────────────────────────────────────────┘
```

### Component Props Interface
```typescript
interface LeadConversionModalProps {
  lead: Lead                                    // Lead data to convert
  isOpen: boolean                              // Modal visibility state
  onClose: () => void                          // Close handler
  onConvert: (data: ConversionData) => Promise<void>  // Conversion handler
  isConverting: boolean                        // Loading state
}
```

### Data Structure
```typescript
interface ConversionData {
  account_data: {
    account_name: string                       // Required
    industry?: string
    website?: string
    phone?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    number_of_employees?: number
    description?: string
  }
  contact_data: {
    first_name: string                         // Required
    last_name: string                          // Required
    title?: string
    email?: string
    phone?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
  }
  create_deal: boolean                         // Toggle for deal creation
  deal_data?: {                               // Optional, based on create_deal
    deal_name: string                          // Required if creating deal
    stage: string                              // Default: 'Prospecting'
    amount?: number
    close_date?: string                        // ISO date format
    description?: string
  }
}
```

### Section Breakdown

#### 1. Header Section
- **Title**: "Convert Lead: {first_name} {last_name}"
- **Close Button**: X icon in top-right corner
- **Subtitle**: Guidance text for user understanding

#### 2. Account Information Section
- **Icon**: 📋 Building icon with blue background
- **Status**: Required section (cannot be skipped)
- **Fields**: 
  - Account Name (required, pre-filled with company name or "{first_name} {last_name} Company")
  - Industry (optional, inherited from lead)
  - Website (optional, inherited from lead)
  - Phone (optional, inherited from lead)
  - Number of Employees (optional, inherited from lead)

#### 3. Contact Information Section
- **Icon**: 👤 User icon with green background
- **Status**: Required section (cannot be skipped)
- **Fields**:
  - First Name (required, inherited from lead)
  - Last Name (required, inherited from lead)
  - Title (optional, inherited from lead)
  - Email (optional, inherited from lead)
  - Phone (optional, inherited from lead)

#### 4. Deal Information Section
- **Icon**: 💼 Briefcase icon with purple background
- **Status**: Optional (controlled by checkbox)
- **Toggle**: Checkbox "Also create Deal"
- **Expandable**: Form appears when checkbox is checked
- **Fields**:
  - Deal Name (required if creating, default: "Deal for {first_name} {last_name}")
  - Stage (dropdown, default: "Prospecting")
  - Amount (optional, number input)
  - Close Date (optional, date picker, default: +3 months)
  - Description (optional, inherited from lead)

#### 5. Footer Section
- **Cancel Button**: Gray, closes modal without action
- **Convert Button**: Blue, submits form
- **Loading State**: Shows spinner and "Converting..." text

### Form Validation

#### Required Fields
- **Account Name**: Must not be empty
- **Contact First Name**: Must not be empty  
- **Contact Last Name**: Must not be empty
- **Deal Name**: Required only if "create_deal" is true

#### Error Display
- **Field-level**: Red border and error message below field
- **Real-time**: Errors clear when user starts typing
- **Submission**: Prevents form submission if validation fails

### Pre-filling Logic

#### Account Data Mapping
```typescript
account_name: lead.company_name || `${lead.first_name} ${lead.last_name} Company`
industry: lead.industry || ''
website: lead.website || ''
phone: lead.phone || ''
// ... address fields inherited from lead
```

#### Contact Data Mapping
```typescript
first_name: lead.first_name
last_name: lead.last_name
title: lead.title || ''
email: lead.email || ''
phone: lead.phone || ''
// ... address fields inherited from lead
```

#### Deal Data Mapping
```typescript
deal_name: `Deal for ${lead.first_name} ${lead.last_name}`
stage: 'Prospecting'
close_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // +3 months
description: lead.description || ''
```

---

## Modal Design Patterns

### 1. Standard Modal Structure
```
┌─────────────────────────────────────────┐
│  Title                              [×] │
├─────────────────────────────────────────┤
│  Subtitle/Description                   │
├─────────────────────────────────────────┤
│                                         │
│  Content Area                           │
│  ├ Section 1                            │
│  ├ Section 2                            │
│  └ Section 3                            │
│                                         │
├─────────────────────────────────────────┤
│                    [Cancel] [Primary]   │
└─────────────────────────────────────────┘
```

### 2. Section Headers with Icons
```
┌─ [Icon] Section Title     Status ─┐
│  Field 1: [Input        ]          │
│  Field 2: [Input        ]          │
│  Field 3: [Input        ]          │
└────────────────────────────────────┘
```

### 3. Expandable Sections
```
☑️ Section Title                    Optional
┌─────────────────────────────────────────┐
│  Expandable Content                     │
│  (appears when checkbox is checked)    │
└─────────────────────────────────────────┘
```

### 4. Form Field Layout
```
Label Text                    *Required
[Input Field                         ]
Error message (if any)
```

---

## Component Architecture

### Base Modal Component Pattern
```typescript
interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  maxWidth?: string
  children: React.ReactNode
}

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-4xl',
  children
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose}>×</button>
          </div>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  )
}
```

### Section Component Pattern
```typescript
interface ModalSectionProps {
  icon: React.ReactNode
  title: string
  status: 'required' | 'optional'
  children: React.ReactNode
}

const ModalSection: React.FC<ModalSectionProps> = ({
  icon,
  title,
  status,
  children
}) => (
  <section>
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <span className={`ml-2 text-sm ${status === 'required' ? 'text-red-500' : 'text-gray-500'}`}>
        {status === 'required' ? '*Required' : 'Optional'}
      </span>
    </div>
    {children}
  </section>
)
```

---

## Usage Guidelines

### 1. When to Use Modals
- **Data Review**: When users need to review/edit data before action
- **Multi-step Forms**: Complex forms that benefit from focused attention
- **Confirmation Dialogs**: Actions that require user confirmation
- **Quick Actions**: Forms that don't require full page navigation

### 2. Modal Sizing
- **Small**: `max-w-md` - Simple confirmations, alerts
- **Medium**: `max-w-2xl` - Standard forms, single entity editing
- **Large**: `max-w-4xl` - Complex forms, multiple sections (like Lead Conversion)
- **Extra Large**: `max-w-6xl` - Data tables, complex workflows

### 3. Accessibility
- **Focus Management**: Auto-focus first input, trap focus within modal
- **Keyboard Navigation**: ESC to close, Tab navigation
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: Ensure sufficient contrast for all text

### 4. Mobile Responsiveness
- **Full Width**: On mobile, modals should take full width with padding
- **Scrollable**: Content should scroll if it exceeds viewport height
- **Touch Targets**: Buttons should be at least 44px for touch interaction

### 5. Loading States
- **Button States**: Show loading spinner and disable during async operations
- **Form Locking**: Prevent form edits during submission
- **Clear Feedback**: Provide clear success/error messages

### 6. Error Handling
- **Field-level Validation**: Show errors immediately near relevant fields
- **Form-level Validation**: Prevent submission with invalid data
- **API Errors**: Display clear, actionable error messages
- **Recovery**: Allow users to correct errors and retry

---

## Future Modal Implementations

### Planned Modals
1. **Account Creation Modal** - Similar structure to lead conversion
2. **Contact Creation Modal** - Simplified version with account selection
3. **Deal Creation Modal** - Enhanced with pipeline stage management
4. **Bulk Action Modals** - For batch operations on multiple records
5. **Import/Export Modals** - File upload and download workflows

### Design Consistency
- **Follow established patterns** from Lead Conversion Modal
- **Reuse section components** for consistent styling
- **Maintain accessibility standards** across all implementations
- **Use consistent validation patterns** and error handling

---

## Notes for Developers

### Best Practices
1. **Component Reusability**: Extract common patterns into reusable components
2. **Type Safety**: Use TypeScript interfaces for all modal props and data
3. **Performance**: Use React.memo for components that don't need frequent re-renders
4. **Testing**: Write tests for modal open/close behavior and form validation

### Common Pitfalls
1. **Z-index Issues**: Ensure modals appear above all other content
2. **Body Scroll**: Prevent background scrolling when modal is open
3. **Memory Leaks**: Clean up event listeners and timeouts
4. **Form State**: Reset form state when modal closes

### Code Organization
```
src/
├── components/
│   ├── modals/
│   │   ├── BaseModal.tsx          # Reusable modal wrapper
│   │   ├── ModalSection.tsx       # Reusable section component
│   │   └── ModalFooter.tsx        # Reusable footer component
│   └── forms/
│       ├── FormField.tsx          # Reusable form field component
│       └── FormValidation.tsx     # Validation utilities
└── modules/
    └── leads/
        └── LeadConversionModal.tsx # Specific modal implementation
```

This structure ensures maintainability and consistency across all modal implementations in the application.