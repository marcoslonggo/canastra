import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn, touchFeedback } from '../../lib/utils'

// Button variants using class-variance-authority for type safety
const buttonVariants = cva(
  'btn-base no-tap-highlight hw-accelerate', // Base classes from globals.css
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary', 
        ghost: 'btn-ghost',
        destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
        outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm min-h-[36px]',
        md: 'px-4 py-2 text-base min-h-touch', // 44px touch target
        lg: 'px-6 py-3 text-lg min-h-[48px]',
        icon: 'h-touch w-touch p-0', // Square touch target
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      rounded: {
        true: 'rounded-full',
        false: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      rounded: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  hapticFeedback?: boolean
  'data-testid'?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      rounded,
      asChild = false,
      loading = false,
      hapticFeedback = true,
      disabled,
      onClick,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Add haptic feedback on mobile devices
      if (hapticFeedback) {
        touchFeedback.vibrate(50)
      }
      
      // Add visual touch feedback
      if (event.currentTarget) {
        touchFeedback.addTouchClass(event.currentTarget, 'active')
      }
      
      // Call original onClick if not disabled or loading
      if (!disabled && !loading && onClick) {
        onClick(event)
      }
    }
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, rounded }),
          loading && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        data-testid={testId}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }