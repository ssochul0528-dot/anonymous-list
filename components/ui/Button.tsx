
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    isLoading?: boolean
    children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, isLoading = false, children, ...props }, ref) => {

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
            <button ref={ref} className={computedClass} disabled={isLoading || props.disabled} {...props}>
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>LOADING...</span>
                    </div>
                ) : children}
            </button>
        )
    }
)

Button.displayName = 'Button'
