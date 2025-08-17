import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, formUtils, deviceUtils } from '../../lib/utils'

const inputVariants = cva(
  'input-base transition-colors duration-200 hw-accelerate',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50',
      },
      size: {
        sm: 'px-2 py-1 text-sm min-h-[36px]',
        md: 'px-3 py-2 text-base min-h-touch', // 44px touch target
        lg: 'px-4 py-3 text-lg min-h-[52px]',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: true,
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  preventZoom?: boolean
  'data-testid'?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      preventZoom = true,
      disabled,
      type = 'text',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = React.useState(false)
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!)
    
    // Prevent zoom on iOS when input is focused
    React.useEffect(() => {
      if (preventZoom && inputRef.current) {
        formUtils.preventZoom(inputRef.current)
      }
    }, [preventZoom])
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      
      // Scroll input into view on mobile
      if (deviceUtils.isMobile()) {
        setTimeout(() => {
          e.target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }, 300) // Delay for keyboard animation
      }
      
      props.onFocus?.(e)
    }
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }
    
    const actualVariant = error ? 'error' : variant
    const hasIcons = leftIcon || rightIcon
    
    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label 
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium',
              error ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={inputRef}
            type={type}
            className={cn(
              inputVariants({ variant: actualVariant, size, fullWidth }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              disabled && 'opacity-50 cursor-not-allowed',
              isFocused && 'ring-2 ring-opacity-50',
              className
            )}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-testid={testId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${props.id}-error` : 
              helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />
          
          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {/* Focus Ring Enhancement for Mobile */}
          {isFocused && deviceUtils.isTouchDevice() && (
            <div className="absolute inset-0 rounded-md ring-2 ring-primary-500 ring-opacity-30 pointer-events-none" />
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <p 
            id={`${props.id}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <svg 
              className="w-4 h-4 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {error}
          </p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p 
            id={`${props.id}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<VariantProps<typeof inputVariants>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  resize?: boolean
  'data-testid'?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      fullWidth,
      label,
      error,
      helperText,
      resize = true,
      disabled,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      
      // Scroll into view on mobile
      if (deviceUtils.isMobile()) {
        setTimeout(() => {
          e.target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }, 300)
      }
      
      props.onFocus?.(e)
    }
    
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }
    
    const actualVariant = error ? 'error' : variant
    
    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label 
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium',
              error ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>
        )}
        
        {/* Textarea */}
        <textarea
          ref={ref}
          className={cn(
            'input-base min-h-[80px] py-2',
            inputVariants({ variant: actualVariant, fullWidth }),
            !resize && 'resize-none',
            disabled && 'opacity-50 cursor-not-allowed',
            isFocused && 'ring-2 ring-opacity-50',
            className
          )}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid={testId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${props.id}-error` : 
            helperText ? `${props.id}-helper` : undefined
          }
          {...props}
        />
        
        {/* Error Message */}
        {error && (
          <p 
            id={`${props.id}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <svg 
              className="w-4 h-4 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {error}
          </p>
        )}
        
        {/* Helper Text */}
        {helperText && !error && (
          <p 
            id={`${props.id}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Input, Textarea, inputVariants }