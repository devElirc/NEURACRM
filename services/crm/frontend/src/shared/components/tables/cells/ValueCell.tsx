import React from 'react';

interface ValueCellProps {
  value: number | string | null | undefined;
  currency?: string;
  locale?: string;
  showZero?: boolean;
  className?: string;
}

export const ValueCell: React.FC<ValueCellProps> = ({
  value,
  currency = 'USD',
  locale = 'en-US',
  showZero = true,
  className = '',
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (numericValue === null || numericValue === undefined || (!showZero && numericValue === 0)) {
    return <div className={`text-gray-400 dark:text-gray-500 ${className}`}>—</div>;
  }

  const formattedValue = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue);

  return (
    <div className={`font-medium text-gray-900 dark:text-gray-100 ${className}`}>
      {formattedValue}
    </div>
  );
};

export default ValueCell;