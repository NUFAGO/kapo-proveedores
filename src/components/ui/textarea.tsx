import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    const baseClasses = 'w-full bg-transparent border border-gray-200 text-[var(--text-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-2 text-xs resize-none';

    return (
      <textarea
        ref={ref}
        className={cn(baseClasses, className)}
        autoComplete="off"
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
