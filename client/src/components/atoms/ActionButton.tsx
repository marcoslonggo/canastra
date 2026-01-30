import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useUIStore } from '../../stores/uiStore';
import { cn, touchFeedback } from '../../lib/utils';

// ActionButton variants - specialized for game actions
const actionButtonVariants = cva(
  'relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] no-tap-highlight hw-accelerate',
  {
    variants: {
      variant: {
        // Primary action (main game actions)
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-md hover:shadow-lg',
        // Secondary action (alternative actions) 
        secondary: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 shadow-md hover:shadow-lg',
        // Success action (positive outcomes)
        success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-md hover:shadow-lg',
        // Danger action (risky/destructive actions)
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md hover:shadow-lg',
        // Warning action (caution required)
        warning: 'bg-yellow-500 text-black hover:bg-yellow-600 active:bg-yellow-700 shadow-md hover:shadow-lg',
        // Ghost action (subtle actions)
        ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-gray-300',
        // Outline action (secondary emphasis)
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
      },
      size: {
        // Small but still touch-friendly
        sm: 'px-4 py-2.5 text-sm min-h-[44px] gap-2',
        // Standard mobile-first size  
        md: 'px-6 py-3 text-base min-h-[48px] gap-2',
        // Large for important actions
        lg: 'px-8 py-4 text-lg min-h-[52px] gap-3',
        // Icon only - square touch target
        icon: 'h-[44px] w-[44px] p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      rounded: {
        true: 'rounded-full',
        false: 'rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      rounded: false,
    },
  }
);

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  loading?: boolean;
  hapticFeedback?: boolean;
  icon?: React.ReactNode;
  loadingText?: string;
  'data-testid'?: string;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      rounded,
      loading = false,
      hapticFeedback = true,
      icon,
      loadingText,
      disabled,
      onClick,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const { isMobile, shouldReduceAnimations } = useUIStore();
    
    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent double-clicks during loading
      if (loading || disabled) return;
      
      // Add haptic feedback on mobile devices
      if (hapticFeedback && isMobile) {
        touchFeedback.vibrate(50);
      }
      
      // Add visual touch feedback with scale animation
      if (event.currentTarget && !shouldReduceAnimations()) {
        touchFeedback.addTouchClass(event.currentTarget, 'active');
      }
      
      // Call original onClick
      if (onClick) {
        onClick(event);
      }
    };
    
    // Loading spinner component
    const LoadingSpinner = () => (
      <div className={cn(
        "inline-flex h-4 w-4 border-2 border-current border-t-transparent rounded-full",
        !shouldReduceAnimations() && "animate-spin"
      )} />
    );
    
    const ButtonContent = () => {
      if (loading) {
        return (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            <span className={cn(
              'truncate',
              isMobile && size === 'sm' && 'hidden' // Hide loading text on small mobile buttons
            )}>
              {loadingText || 'Loading...'}
            </span>
          </div>
        );
      }
      
      return (
        <div className="flex items-center justify-center gap-2">
          {icon && (
            <span className={cn(
              'flex-shrink-0',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base', 
              size === 'lg' && 'text-lg',
              size === 'icon' && 'text-lg'
            )}>
              {icon}
            </span>
          )}
          {size !== 'icon' && (
            <span className="truncate font-inherit">
              {children}
            </span>
          )}
        </div>
      );
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          actionButtonVariants({ variant, size, fullWidth, rounded }),
          loading && 'cursor-wait',
          !shouldReduceAnimations() && 'transition-transform hover:scale-[1.02] active:scale-[0.98]',
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        data-testid={testId}
        {...props}
      >
        <ButtonContent />
      </button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

// Specialized variants for common game actions
export const DrawButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant'>>(
  (props, ref) => <ActionButton ref={ref} variant="primary" {...props} />
);

export const DiscardButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant'>>(
  (props, ref) => <ActionButton ref={ref} variant="primary" className="bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 border-blue-500 shadow-md hover:shadow-lg" {...props} />
);

export const BaterButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant'>>(
  (props, ref) => <ActionButton ref={ref} variant="success" {...props} />
);

export const EndTurnButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant'>>(
  (props, ref) => <ActionButton ref={ref} variant="warning" {...props} />
);

export const DangerActionButton = React.forwardRef<HTMLButtonElement, Omit<ActionButtonProps, 'variant'>>(
  (props, ref) => <ActionButton ref={ref} variant="danger" {...props} />
);

DrawButton.displayName = 'DrawButton';
DiscardButton.displayName = 'DiscardButton';
BaterButton.displayName = 'BaterButton';
EndTurnButton.displayName = 'EndTurnButton';
DangerActionButton.displayName = 'DangerActionButton';