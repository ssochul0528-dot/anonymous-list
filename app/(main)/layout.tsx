
'use client'

import React, { useEffect } from 'react'
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

    // We now allow public access for Landing Page.
    // Auth protection is handled by specific pages or child components.

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0E17]">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-[#CCFF00]/20 border-t-[#CCFF00] rounded-full animate-spin mb-3" />
                    <p className="text-[10px] text-white/30 font-mono tracking-widest blink">CHECKING_PLATFORM...</p>
                </div>
            </div>
        )
    }

    // Layout renders children (which will decode to Landing or Dashboard)
    return (
        <div className="min-h-screen pb-20 max-w-[600px] mx-auto bg-[#0A0E17] min-[600px]:border-x border-white/5 text-white">
            {/* Header and Nav should condition on user presence? */}
            {/* Let's render Header/Nav ONLY if user is logged in. Landing page has its own header. */}

            {user && (
                <header className="sticky top-0 z-50 bg-[#0A0E17]/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <h1 className="text-[22px] font-black italic text-white tracking-tighter uppercase">MatchUp <span className="text-[#CCFF00]">Pro</span></h1>
                    </div>
                    <div className="flex gap-2 items-center">
                        {pathname !== '/my-club' && (
                            <Button
                                size="sm"
                                className="h-8 px-3 rounded-lg bg-[#CCFF00] text-black font-extrabold text-[11px] hover:bg-[#b3e600] transition-all"
                                onClick={() => router.push('/my-club')}
                                type="button"
                            >
                                MY CLUB
                            </Button>
                        )}
                        <button
                            onClick={() => signOut()}
                            className="text-[10px] text-white/40 font-black uppercase tracking-widest px-2 py-1.5 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
                        >
                            LOGOUT
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#CCFF00]/50 transition-all ml-1" onClick={() => router.push('/profile')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                    </div>
                </header>
            )}

            <main className={user ? "px-5 space-y-4" : ""}>
                {children}
            </main>

            {/* Bottom Navigation for Mobile - Only for Logged In Users */}
            {user && (
                <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0E17]/90 backdrop-blur-xl border-t border-white/5 px-4 py-2 flex justify-between items-center z-20 max-w-[600px] mx-auto pb-safe">
                    <NavItem label="HOME" icon="home" path="/" active={pathname === '/'} />
                    <NavItem label="RANK" icon="chart" path="/rankings" active={pathname === '/rankings'} />
                    <NavItem label="PLAY" icon="calendar" path="/admin/schedule" active={pathname?.startsWith('/admin/schedule')} />
                    {isStaff && <NavItem label="DUES" icon="wallet" path="/settlement" active={pathname === '/settlement'} />}
                    <NavItem label="PRO" icon="user" path="/profile" active={pathname === '/profile'} />
                </nav>
            )}
        </div>
    )
}

import Link from 'next/link'

function NavItem({ label, icon, path, active }: { label: string; icon: string; path: string; active: boolean }) {
    const icons: any = {
        home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>,
        chart: <path d="M12 20V10M18 20V4M6 20v-4"></path>,
        calendar: <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm-2-12h-2v2h2V8zm-4 0h-2v2h2V8zm-4 0H7v2h2V8z"></path>,
        wallet: <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />,
        user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    }

    return (
        <Link
            href={path}
            className={`flex flex-col items-center gap-1 min-w-[60px] py-1 transition-all ${active ? 'text-[#CCFF00]' : 'text-white/20 hover:text-white/40'}`}
        >
            <div className={`p-1 rounded-lg transition-all ${active ? 'bg-[#CCFF00]/10' : ''}`}>
                <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {icons[icon]}
                    {icon === 'user' && <circle cx="12" cy="7" r="4"></circle>}
                    {icon === 'wallet' && <line x1="18" y1="12" x2="22" y2="12"></line>}
                </svg>
            </div>
            <span className="text-[9px] font-black italic tracking-tighter uppercase">{label}</span>
        </Link>
    )
}
