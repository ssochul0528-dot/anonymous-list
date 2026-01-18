
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {

        // Toss-style button variants
        const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none'

        const variants = {
            primary: 'bg-[#CCFF00] text-[#0A0E17] hover:bg-[#AACC00] shadow-[0_4px_14px_rgba(204,255,0,0.2)]',
            secondary: 'bg-white/10 text-white hover:bg-white/20',
            outline: 'border border-white/20 text-white bg-transparent hover:bg-white/5',
            ghost: 'bg-transparent text-white/60 hover:text-white',
        }

        const sizes = {
            sm: 'text-[12px] px-3 py-1.5 rounded-lg font-black italic tracking-tighter uppercase',
            md: 'text-[14px] px-4 py-2.5 rounded-xl font-black italic tracking-tighter uppercase',
            lg: 'text-[16px] px-5 py-3.5 rounded-2xl font-black italic tracking-tighter uppercase',
        }

        const widthClass = fullWidth ? 'w-full' : ''

        const computedClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`

        return (
            <button ref={ref} className={computedClass} {...props}>
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'
