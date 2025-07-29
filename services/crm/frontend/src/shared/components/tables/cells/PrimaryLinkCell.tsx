import React from 'react';

interface PrimaryLinkCellProps {
  text: string;
  onClick: () => void;
  className?: string;
}

export const PrimaryLinkCell: React.FC<PrimaryLinkCellProps> = ({
  text,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`
        font-medium text-blue-600 dark:text-blue-400 
        cursor-pointer underline hover:text-blue-700 
        dark:hover:text-blue-300 transition-colors
        ${className}
      `}
      onClick={onClick}
    >
      {text}
    </div>
  );
};

export default PrimaryLinkCell;