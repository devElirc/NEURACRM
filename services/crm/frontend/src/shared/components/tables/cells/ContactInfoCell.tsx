import React from 'react';

interface ContactInfoCellProps {
  email?: string;
  phone?: string;
  className?: string;
}

export const ContactInfoCell: React.FC<ContactInfoCellProps> = ({
  email,
  phone,
  className = '',
}) => {
  if (!email && !phone) {
    return <div className={`text-gray-400 dark:text-gray-500 ${className}`}>No contact info</div>;
  }

  return (
    <div className={className}>
      {email && (
        <div className="text-gray-900 dark:text-gray-100">
          {email}
        </div>
      )}
      {phone && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {phone}
        </div>
      )}
    </div>
  );
};

export default ContactInfoCell;