import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, invalid, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'field-control flex h-11 w-full px-3.5 py-1 text-[15px] text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      aria-invalid={invalid || undefined}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
