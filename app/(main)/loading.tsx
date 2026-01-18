
import React from 'react'

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A0E17]">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[#CCFF00]/20 border-t-[#CCFF00] rounded-full animate-spin mb-4" />
                <h1 className="text-[20px] font-black italic text-white tracking-tighter uppercase animate-pulse">
                    MatchUp <span className="text-[#CCFF00]">Pro</span>
                </h1>
                <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] mt-2 font-black italic">
                    Loading Data...
                </p>
            </div>
        </div>
    )
}
