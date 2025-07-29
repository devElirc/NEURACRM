import React, { useState, useRef, useEffect } from 'react';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  hidden?: boolean;
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
  className?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const visibleActions = actions.filter(action => !action.hidden);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        className="
          p-1 text-gray-500 hover:text-gray-700 
          dark:text-gray-400 dark:hover:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          rounded transition-colors cursor-pointer
        "
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg">⋯</span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute right-0 top-full mt-1 z-50
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg min-w-[150px]
          "
        >
          {visibleActions.map((action) => (
            <button
              key={action.id}
              className={`
                flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left
                transition-colors
                ${action.variant === 'danger'
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                first:rounded-t-lg last:rounded-b-lg
              `}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
            >
              {action.icon && (
                <span className="w-4 h-4 flex-shrink-0">
                  {action.icon}
                </span>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;