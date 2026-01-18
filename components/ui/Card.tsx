
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
                    'bg-[#121826] rounded-[24px] shadow-2xl border border-white/5',
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
