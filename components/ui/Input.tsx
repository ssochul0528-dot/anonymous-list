import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full text-left">
                {label && (
                    <label className="block text-[11px] font-black italic text-white/40 uppercase tracking-[0.2em] mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={cn(
                            'flex w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3.5 text-[15px] font-bold text-white transition-all placeholder:text-white/20',
                            'focus:outline-none focus:border-[#CCFF00]/50 focus:bg-white/10',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            error && 'border-red-500/50 focus:border-red-500',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-[12px] font-medium text-[#F04452] ml-1">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
