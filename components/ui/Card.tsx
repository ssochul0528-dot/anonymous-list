
import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, padding = 'md', ...props }, ref) => {
        // Toss-style card: White, rounded-24px, subtle shadow
        // We already defined @utility card in globals, but using inline classes for flexibility here

        const paddings = {
            none: 'p-0',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.02)]',
                    paddings[padding],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'
