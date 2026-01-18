
'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading, signOut, isStaff } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    /* 
    React.useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])
    */

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F2F4F6]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                </div>
            </div>
        )
    }

    // if (!user) return null

    return (
        <div className="min-h-screen pb-20 max-w-[600px] mx-auto bg-[#0A0E17] min-[600px]:border-x border-white/5 text-white">
            {/* Main Header Area - sticky top */}
            <header className="sticky top-0 z-10 bg-[#0A0E17]/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-white/5">
                <h1 className="text-[22px] font-black italic text-white tracking-tighter uppercase">MatchUp <span className="text-[#CCFF00]">Pro</span></h1>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => signOut()}
                        className="text-[13px] text-[#8B95A1] font-medium px-2 py-1 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        로그아웃
                    </button>
                    {/* Placeholder for notification or profile icon */}
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer" onClick={() => router.push('/profile')}>
                        {/* User Avatar */}
                    </div>
                </div>
            </header>

            <main className="px-5 space-y-4">
                {children}
            </main>

            {/* Bottom Navigation for Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-20 max-w-[600px] mx-auto">
                <NavItem label="홈" icon="home" path="/" active={pathname === '/'} />
                <NavItem label="랭킹" icon="chart" path="/rankings" active={pathname === '/rankings'} />
                <NavItem label="스케줄" icon="calendar" path="/admin/schedule" active={pathname?.startsWith('/admin/schedule')} />
                {isStaff && <NavItem label="정산" icon="wallet" path="/settlement" active={pathname === '/settlement'} />}
                <NavItem label="마이" icon="user" path="/profile" active={pathname === '/profile'} />
            </nav>
        </div>
    )
}

function NavItem({ label, icon, path, active }: { label: string; icon: string; path: string; active: boolean }) {
    const router = useRouter()

    // Simple icon placeholders
    const icons: any = {
        home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>,
        chart: <path d="M12 20V10M18 20V4M6 20v-4"></path>,
        calendar: <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm-2-12h-2v2h2V8zm-4 0h-2v2h2V8zm-4 0H7v2h2V8z"></path>,
        wallet: <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />,
        user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    }

    return (
        <button
            onClick={() => router.push(path)}
            className={`flex flex-col items-center gap-1 min-w-[50px] ${active ? 'text-[#0064FF]' : 'text-[#B0B8C1]'}`}
        >
            <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {icons[icon]}
                {icon === 'user' && <circle cx="12" cy="7" r="4"></circle>}
                {icon === 'wallet' && <line x1="18" y1="12" x2="22" y2="12"></line>}
            </svg>
            <span className="text-[11px] font-medium">{label}</span>
        </button>
    )
}
