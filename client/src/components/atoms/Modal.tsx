import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, animations, deviceUtils } from '../../lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  
  // Size variants for different use cases
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  
  // Mobile behavior
  slideFromBottom?: boolean
  showCloseButton?: boolean
  closeOnOutsideClick?: boolean
  
  // Actions
  primaryAction?: {
    label: string
    onClick: () => void
    loading?: boolean
    variant?: 'primary' | 'secondary' | 'destructive'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  
  className?: string
  'data-testid'?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg', 
  xl: 'max-w-xl',
  full: 'max-w-full w-full h-full',
}

const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  slideFromBottom = true,
  showCloseButton = true,
  closeOnOutsideClick = true,
  primaryAction,
  secondaryAction,
  className,
  'data-testid': testId,
}) => {
  const isMobile = deviceUtils.isMobile()
  const shouldSlideFromBottom = slideFromBottom && isMobile
  
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Add safe area padding for iOS
      if (deviceUtils.isIOS()) {
        document.body.style.paddingBottom = 'env(safe-area-inset-bottom)'
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingBottom = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingBottom = ''
    }
  }, [open])
  
  const modalVariants = {
    hidden: shouldSlideFromBottom
      ? { y: '100%', opacity: 0 }
      : { scale: 0.95, opacity: 0 },
    visible: shouldSlideFromBottom
      ? { y: 0, opacity: 1 }
      : { scale: 1, opacity: 1 },
    exit: shouldSlideFromBottom
      ? { y: '100%', opacity: 0 }
      : { scale: 0.95, opacity: 0 },
  }
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.15 }}
                onClick={closeOnOutsideClick ? () => onOpenChange(false) : undefined}
              />
            </Dialog.Overlay>
            
            {/* Content */}
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed z-50 bg-white rounded-lg shadow-xl',
                  // Desktop positioning
                  !shouldSlideFromBottom && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  // Mobile positioning (bottom sheet)
                  shouldSlideFromBottom && 'bottom-0 left-0 right-0 rounded-b-none',
                  // Size classes
                  !shouldSlideFromBottom && sizeClasses[size],
                  // Mobile full width
                  isMobile && size !== 'full' && 'mx-4',
                  // Full size modal
                  size === 'full' && 'inset-0 rounded-none',
                  className
                )}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                data-testid={testId}
              >
                {/* Header */}
                <div className={cn(
                  'flex items-center justify-between p-4 border-b border-gray-200',
                  shouldSlideFromBottom && 'pb-2'
                )}>
                  {/* Mobile handle bar */}
                  {shouldSlideFromBottom && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-12 h-1 bg-gray-300 rounded-full" />
                    </div>
                  )}
                  
                  {/* Title */}
                  <div className={cn(shouldSlideFromBottom && 'mt-4')}>
                    {title && (
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="text-sm text-gray-500 mt-1">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  
                  {/* Close Button */}
                  {showCloseButton && (
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close modal"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" 
                          />
                        </svg>
                      </Button>
                    </Dialog.Close>
                  )}
                </div>
                
                {/* Body */}
                <div className={cn(
                  'p-4',
                  // Scrollable content for mobile
                  shouldSlideFromBottom && 'max-h-[80vh] overflow-y-auto',
                  // Add safe area padding for full modals
                  size === 'full' && 'pb-safe-bottom'
                )}>
                  {children}
                </div>
                
                {/* Actions */}
                {(primaryAction || secondaryAction) && (
                  <div className={cn(
                    'flex gap-3 p-4 border-t border-gray-200',
                    // Stack buttons on mobile for better touch targets
                    isMobile ? 'flex-col-reverse' : 'flex-row justify-end',
                    // Safe area padding
                    shouldSlideFromBottom && 'pb-safe-bottom'
                  )}>
                    {secondaryAction && (
                      <Button
                        variant="secondary"
                        onClick={secondaryAction.onClick}
                        fullWidth={isMobile}
                      >
                        {secondaryAction.label}
                      </Button>
                    )}
                    {primaryAction && (
                      <Button
                        variant={primaryAction.variant || 'primary'}
                        onClick={primaryAction.onClick}
                        loading={primaryAction.loading}
                        fullWidth={isMobile}
                      >
                        {primaryAction.label}
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// Trigger component for opening modals
interface ModalTriggerProps {
  children: React.ReactNode
  className?: string
}

const ModalTrigger: React.FC<ModalTriggerProps> = ({ children, className }) => {
  return (
    <Dialog.Trigger asChild>
      <div className={className}>
        {children}
      </div>
    </Dialog.Trigger>
  )
}

// Confirmation dialog variant
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'default' | 'destructive'
  loading?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onOpenChange(false)
    }
  }
  
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }
  
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      primaryAction={{
        label: confirmLabel,
        onClick: handleConfirm,
        loading,
        variant: variant === 'destructive' ? 'destructive' : 'primary',
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: handleCancel,
      }}
    >
      {/* Additional content can be added here if needed */}
    </Modal>
  )
}

export { Modal, ModalTrigger, ConfirmDialog }
export type { ModalProps, ConfirmDialogProps }