'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [trendingClubs, setTrendingClubs] = useState<any[]>([])
    const [loadingClubs, setLoadingClubs] = useState(true)

    useEffect(() => {
        const fetchTrending = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('clubs')
                .select('id, name, slug, region, logo_url')
                .eq('status', 'ACTIVE')
                .limit(5)
                .order('created_at', { ascending: false }) // Just latest for now

            if (data) setTrendingClubs(data)
            setLoadingClubs(false)
        }
        fetchTrending()
    }, [])

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#121826] to-transparent z-0" />
            <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-[#CCFF00]/10 rounded-full blur-[100px]" />

            {/* Header - Only show for Guest */}
            {!user && (
                <header className="relative z-10 px-6 py-6 flex justify-between items-center">
                    <h1 className="text-[20px] font-black italic tracking-tighter uppercase">MatchUp <span className="text-[#CCFF00]">Pro</span></h1>
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-5 text-[12px] font-bold border-white/20 hover:bg-white/10"
                        onClick={() => router.push('/login')}
                    >
                        LOGIN
                    </Button>
                </header>
            )}

            {/* Main Content Scroll Area */}
            <main className="relative z-10 flex-1 flex flex-col px-6 pt-4 pb-12 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="inline-block px-3 py-1 bg-[#CCFF00]/10 rounded-full border border-[#CCFF00]/20 mb-3">
                        <span className="text-[#CCFF00] text-[10px] font-black tracking-widest uppercase">BETA • SEASON 2026</span>
                    </div>
                    <h2 className="text-[42px] font-black leading-[0.95] tracking-tighter mb-3">
                        UNLEASH<br />
                        YOUR<br />
                        <span className="text-[#CCFF00] italic">COURT.</span>
                    </h2>
                    <p className="text-white/40 font-medium text-[14px] leading-relaxed max-w-[280px] mb-6">
                        테니스 동호회 운영의 모든 것.<br />
                        경기 기록부터 랭킹까지 한번에.
                    </p>
                    {user && (
                        <a
                            href="/my-clubs"
                            className="inline-flex items-center justify-center bg-[#CCFF00] text-black font-black italic tracking-tight rounded-2xl px-8 h-14 text-[16px] hover:bg-[#b3e600] shadow-[0_0_30px_rgba(204,255,0,0.2)] transition-all group relative z-50 pointer-events-auto"
                        >
                            내 클럽으로 이동
                            <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                        </a>
                    )}
                </motion.div>

                {/* Club List Carousel */}
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="font-bold text-[16px]">Trending Clubs 🔥</h3>
                        <span
                            className="text-[12px] text-white/40 font-bold cursor-pointer hover:text-[#CCFF00]"
                            onClick={() => router.push('/clubs')}
                        >
                            ALL CLUBS &gt;
                        </span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar -mx-6 px-6">
                        {loadingClubs ? (
                            <div className="flex gap-4 px-1">
                                {[1, 2].map(i => (
                                    <div key={i} className="min-w-[260px] h-[160px] bg-white/5 rounded-[24px] animate-pulse" />
                                ))}
                            </div>
                        ) : trendingClubs.length > 0 ? (
                            trendingClubs.map(club => (
                                <div key={club.id} className="min-w-[260px] snap-center bg-[#191F28] p-5 rounded-[24px] border border-white/5 relative overflow-hidden group shadow-lg">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-4 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            {club.logo_url ? (
                                                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-black italic text-xl text-white/50">{club.name[0]}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-[15px] text-white truncate">{club.name}</h4>
                                            <p className="text-[11px] text-white/40">{club.region}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mb-4 relative z-10">
                                        <span className="px-2 py-1 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold rounded">#인기</span>
                                        <span className="px-2 py-1 bg-white/5 text-white/40 text-[10px] font-bold rounded">#모집중</span>
                                    </div>
                                    <Button
                                        fullWidth
                                        size="sm"
                                        className="relative z-10 bg-white/10 hover:bg-[#CCFF00] hover:text-black hover:font-black font-bold h-10 rounded-xl transition-all border border-white/5"
                                        onClick={() => router.push(`/clubs/${club.slug}`)}
                                    >
                                        둘러보기
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center text-white/20 py-4 text-[12px]">
                                등록된 클럽이 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 text-center">
                    <p className="text-[11px] text-white/30 font-medium">
                        운영진이신가요? <span className="text-white underline cursor-pointer hover:text-[#CCFF00]" onClick={() => router.push('/club-join')}>클럽 등록 신청하기</span>
                    </p>
                </div>
            </main>
        </div>
    )
}
