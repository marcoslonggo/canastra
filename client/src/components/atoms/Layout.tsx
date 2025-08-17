import React from 'react'
import { cn, deviceUtils } from '../../lib/utils'
import { useUIStore } from '../../stores/uiStore'

interface LayoutProps {
  children: React.ReactNode
  variant?: 'game' | 'lobby' | 'auth' | 'full'
  className?: string
  'data-testid'?: string
}

// Main layout container
const Layout: React.FC<LayoutProps> = ({
  children,
  variant = 'full',
  className,
  'data-testid': testId,
}) => {
  const isMobile = useUIStore(state => state.isMobile)
  
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        // Game layout - felt background
        variant === 'game' && 'game-felt',
        // Lobby layout - clean background
        variant === 'lobby' && 'bg-gray-50',
        // Auth layout - centered content
        variant === 'auth' && 'bg-gray-50 flex items-center justify-center',
        // Safe area support
        'safe-area',
        className
      )}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

// Container with responsive padding and max-width
interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  padding = true,
  className,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  }
  
  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

// Grid system for responsive layouts
interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 1 | 2 | 3 | 4 | 6 | 8
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12
    md?: 1 | 2 | 3 | 4 | 6 | 12
    lg?: 1 | 2 | 3 | 4 | 6 | 12
  }
  className?: string
}

const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 4,
  responsive,
  className,
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  }
  
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }
  
  const responsiveClasses = responsive ? [
    responsive.sm && `sm:grid-cols-${responsive.sm}`,
    responsive.md && `md:grid-cols-${responsive.md}`,
    responsive.lg && `lg:grid-cols-${responsive.lg}`,
  ].filter(Boolean).join(' ') : ''
  
  return (
    <div
      className={cn(
        'grid',
        colsClasses[cols],
        gapClasses[gap],
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  )
}

// Flex utilities
interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  gap?: 1 | 2 | 3 | 4 | 6 | 8
  className?: string
}

const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  gap = 2,
  className,
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  }
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }
  
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }
  
  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Stack component for consistent vertical spacing
interface StackProps {
  children: React.ReactNode
  spacing?: 1 | 2 | 3 | 4 | 6 | 8
  className?: string
}

const Stack: React.FC<StackProps> = ({
  children,
  spacing = 4,
  className,
}) => {
  const spacingClasses = {
    1: 'space-y-1',
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    6: 'space-y-6',
    8: 'space-y-8',
  }
  
  return (
    <div className={cn('flex flex-col', spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

// Game-specific layout components
interface GameBoardLayoutProps {
  children: React.ReactNode
  playerHand: React.ReactNode
  opponentInfo: React.ReactNode
  gameActions: React.ReactNode
  className?: string
}

const GameBoardLayout: React.FC<GameBoardLayoutProps> = ({
  children,
  playerHand,
  opponentInfo,
  gameActions,
  className,
}) => {
  const isMobile = useUIStore(state => state.isMobile)
  
  if (isMobile) {
    // Mobile layout: stack vertically
    return (
      <Layout variant="game" className={className}>
        <div className="flex flex-col h-full min-h-screen">
          {/* Opponent info at top */}
          <div className="p-2 border-b border-white/20">
            {opponentInfo}
          </div>
          
          {/* Game board - flexible space */}
          <div className="flex-1 p-2 overflow-hidden">
            {children}
          </div>
          
          {/* Game actions */}
          <div className="p-2 border-t border-white/20">
            {gameActions}
          </div>
          
          {/* Player hand at bottom */}
          <div className="p-2 bg-white/10 backdrop-blur-sm">
            {playerHand}
          </div>
        </div>
      </Layout>
    )
  }
  
  // Desktop layout: use CSS Grid
  return (
    <Layout variant="game" className={className}>
      <div className="grid grid-cols-12 grid-rows-12 h-screen gap-2 p-4">
        {/* Opponent info */}
        <div className="col-span-12 row-span-2">
          {opponentInfo}
        </div>
        
        {/* Game board */}
        <div className="col-span-8 row-span-8">
          {children}
        </div>
        
        {/* Game actions */}
        <div className="col-span-4 row-span-8">
          {gameActions}
        </div>
        
        {/* Player hand */}
        <div className="col-span-12 row-span-2">
          {playerHand}
        </div>
      </div>
    </Layout>
  )
}

// Responsive card layout for mobile optimization
interface ResponsiveCardGridProps {
  children: React.ReactNode
  cardSize?: 'sm' | 'md' | 'lg'
  maxColumns?: number
  className?: string
}

const ResponsiveCardGrid: React.FC<ResponsiveCardGridProps> = ({
  children,
  cardSize = 'md',
  maxColumns = 7,
  className,
}) => {
  const isMobile = useUIStore(state => state.isMobile)
  
  // Adjust columns based on screen size and card size
  const getColumns = () => {
    if (isMobile) {
      return cardSize === 'sm' ? 7 : cardSize === 'md' ? 5 : 3
    }
    return Math.min(maxColumns, 13) // Desktop can show more cards
  }
  
  return (
    <div
      className={cn(
        'grid gap-1 sm:gap-2 justify-items-center',
        `grid-cols-${getColumns()}`,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, minmax(0, 1fr))`
      }}
    >
      {children}
    </div>
  )
}

export { 
  Layout, 
  Container, 
  Grid, 
  Flex, 
  Stack, 
  GameBoardLayout, 
  ResponsiveCardGrid 
}

export type { 
  LayoutProps, 
  ContainerProps, 
  GridProps, 
  FlexProps, 
  StackProps,
  GameBoardLayoutProps,
  ResponsiveCardGridProps
}