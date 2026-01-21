'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export default function ClubDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const slug = params.slug as string
    const [club, setClub] = useState<any>(null)
    const [memberCount, setMemberCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchClubData = async () => {
            const supabase = createClient()

            // 1. Fetch Club Info
            const { data: clubData, error } = await supabase
                .from('clubs')
                .select('*')
                .eq('slug', slug)
                .single()

            if (error || !clubData) {
                // If not found, maybe show 404 or redirect
                // For MVP, if it's "ace" (mock), we hardcode fallback for demo
                if (slug === 'ace') {
                    setClub({
                        name: '에이스 클럽',
                        region: '경기 성남시',
                        description: '실력보다는 매너! 즐겁게 운동하실 분 환영합니다.',
                        status: 'ACTIVE',
                        logo_url: null
                    })
                    setMemberCount(15)
                } else {
                    setClub(null)
                }
            } else {
                setClub(clubData)

                // 2. Fetch Member Count
                const { count } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('club_id', clubData.id)

                setMemberCount(count || 0)
            }
            setLoading(false)
        }

        fetchClubData()
    }, [slug])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-[#CCFF00]/20 border-t-[#CCFF00] rounded-full animate-spin" />
            </div>
        )
    }

    if (!club) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <div className="text-[40px]">🤔</div>
                <h2 className="text-xl font-bold text-white">클럽을 찾을 수 없습니다.</h2>
                <Button onClick={() => router.push('/')} variant="outline" size="sm">메인으로 돌아가기</Button>
            </div>
        )
    }

    return (
        <div className="pt-4 pb-20 relative">
            {/* Header Image / Pattern */}
            <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-[#CCFF00]/10 to-[#0A0E17] -z-10" />
            <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[80px] -z-10" />

            {/* Navigation */}
            <div className="flex items-center mb-6 px-1">
                <button onClick={() => router.push('/')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
            </div>

            {/* Club Identity */}
            <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-[32px] bg-[#191F28] border-2 border-white/10 shadow-2xl flex items-center justify-center mb-5 overflow-hidden relative group"
                >
                    {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[32px] font-black italic text-white/20 group-hover:text-[#CCFF00] transition-colors">
                            {club.name.charAt(0)}
                        </span>
                    )}
                </motion.div>

                <h1 className="text-[28px] font-black italic text-white tracking-tight mb-2">{club.name}</h1>

                <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[11px] font-bold text-white/60 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {club.region || '지역 미설정'}
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[11px] font-bold text-white/60 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        {memberCount} Members
                    </span>
                </div>

                <div className="w-full max-w-xs">
                    {user ? (
                        <Button fullWidth className="h-12 text-[14px] font-bold bg-[#CCFF00] text-black hover:bg-[#b3e600]" disabled>
                            이미 로그인 상태입니다
                        </Button>
                    ) : (
                        <Button
                            fullWidth
                            className="h-12 text-[14px] font-bold bg-[#CCFF00] text-black hover:bg-[#b3e600] shadow-[0_0_20px_rgba(204,255,0,0.3)] animate-pulse"
                            onClick={() => router.push('/login')}
                        >
                            가입 신청하기
                        </Button>
                    )}
                </div>
            </div>

            {/* Club Info Cards */}
            <div className="space-y-4">
                <Card className="bg-[#121826] border-white/5 p-5">
                    <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-3">Club Info</h3>
                    <p className="text-white text-[15px] leading-relaxed">
                        {club.description || '클럽 소개글이 없습니다.'}
                    </p>
                </Card>

                {/* Mock Public Data for Guests */}
                <Card className="bg-[#121826] border-white/5 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Season Ranking</h3>
                        <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-0.5 rounded font-bold">TOP 3</span>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((rank) => (
                            <div key={rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`w-5 h-5 flex items-center justify-center text-[12px] font-black italic rounded ${rank === 1 ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white'}`}>
                                        {rank}
                                    </span>
                                    <span className="text-white text-[14px] font-bold">Player_{rank}</span>
                                </div>
                                <span className="text-white/40 text-[12px] font-medium">1,2{rank}0 pts</span>
                            </div>
                        ))}
                        <div className="pt-2 text-center text-[12px] text-white/20">
                            * 가입 후 전체 랭킹을 확인할 수 있습니다.
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
