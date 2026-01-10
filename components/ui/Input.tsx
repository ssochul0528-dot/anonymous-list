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
                    <label className="block text-[13px] font-medium text-[#4E5968] mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={cn(
                            'flex w-full rounded-[12px] border border-[#E5E8EB] bg-[#F9FAFB] px-4 py-3.5 text-[15px] text-[#333D4B] transition-colors placeholder:text-[#B0B8C1]',
                            'focus:outline-none focus:border-[#0064FF] focus:bg-white',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            error && 'border-[#F04452] focus:border-[#F04452]',
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
