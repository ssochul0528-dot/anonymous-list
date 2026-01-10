
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
            primary: 'bg-[#0064FF] text-white hover:bg-[#0050CC]',
            secondary: 'bg-[#E5E8EB] text-[#333D4B] hover:bg-[#D1D6DB]',
            outline: 'border border-[#B0B8C1] text-[#333D4B] bg-white hover:bg-[#F9FAFB]',
            ghost: 'bg-transparent text-[#333D4B] hover:bg-black/5',
        }

        const sizes = {
            sm: 'text-[13px] px-3 py-2 rounded-[8px]',
            md: 'text-[15px] px-4 py-3 rounded-[12px]',
            lg: 'text-[17px] px-5 py-4 rounded-[16px]',
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
