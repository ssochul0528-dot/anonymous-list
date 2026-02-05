'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAttendanceTargetDate, formatDate } from '@/utils/attendance'
import NationalTournaments from '@/components/NationalTournaments'

import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const [trendingClubs, setTrendingClubs] = useState<any[]>([])
    const [myActiveClub, setMyActiveClub] = useState<any>(null)
    const [myAttendance, setMyAttendance] = useState<any>(null)
    const [loadingClubs, setLoadingClubs] = useState(true)
    const [isEditingAttendance, setIsEditingAttendance] = useState(false)

    const targetDate = useMemo(() => getAttendanceTargetDate(), [])

    const fetchData = async () => {
        const supabase = createClient()

        // 1. Fetch Trending Clubs
        const { data: trending } = await supabase
            .from('clubs')
            .select('id, name, slug, region, logo_url')
            .eq('status', 'ACTIVE')
            .limit(5)
            .order('created_at', { ascending: false })

        if (trending) setTrendingClubs(trending)

        // 2. Fetch User's Active Club & Attendance if logged in
        if (user && profile?.club_id) {
            const { data: activeClub } = await supabase
                .from('clubs')
                .select('*')
                .eq('id', profile.club_id)
                .maybeSingle()

            if (activeClub) {
                setMyActiveClub(activeClub)

                const { data: att } = await supabase
                    .from('attendance')
                    .select('status, preferred_time')
                    .eq('user_id', user.id)
                    .eq('club_id', activeClub.id)
                    .eq('target_date', targetDate.toISOString().split('T')[0])
                    .maybeSingle()

                setMyAttendance(att)
            }
        }

        setLoadingClubs(false)
    }

    useEffect(() => {
        fetchData()
    }, [user, profile?.club_id])

    const handleAttendance = async (status: string, time?: string) => {
        if (!user || !myActiveClub) return

        const supabase = createClient()
        const targetDateStr = targetDate.toISOString().split('T')[0]

        // Manual Upsert logic
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('user_id', user.id)
            .eq('club_id', myActiveClub.id)
            .eq('target_date', targetDateStr)
            .maybeSingle()

        let error
        if (existing) {
            const { error: updateError } = await supabase
                .from('attendance')
                .update({
                    status,
                    preferred_time: time || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('attendance')
                .insert({
                    user_id: user.id,
                    club_id: myActiveClub.id,
                    target_date: targetDateStr,
                    status,
                    preferred_time: time || null
                })
            error = insertError
        }

        if (!error) {
            setMyAttendance({ status, preferred_time: time || null })
            if (status === 'ABSENT' || (status === 'ATTEND' && time)) {
                setIsEditingAttendance(false)
            }
            if (!time && status === 'ATTEND') {
                setIsEditingAttendance(true)
            }
        } else {
            console.error(error)
            alert('출석 체크 실패: ' + error.message)
        }
    }

    const attendanceOptions = useMemo(() => {
        const defaults = ["08:00", "09:00", "10:00", "11:00", "12:00"]
        if (!myActiveClub?.attendance_options) return defaults
        const opts = myActiveClub.attendance_options
        if (Array.isArray(opts) && opts.length > 0) return opts
        try {
            const parsed = JSON.parse(opts)
            return parsed.length > 0 ? parsed : defaults
        } catch { return defaults }
    }, [myActiveClub])

    const formatTimeOption = (t: string) => {
        if (!t?.includes(':')) return t;
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        if (isNaN(hour)) return t;
        const ampm = hour >= 12 ? '오후' : '오전';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${ampm} ${String(displayHour).padStart(2, '0')}:${m}`;
    }

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#121826] to-transparent z-0" />
            <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-[#CCFF00]/10 rounded-full blur-[100px]" />

            {/* Header */}
            {!user ? (
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
            ) : (
                <header className="relative z-10 px-6 py-6 flex justify-between items-center">
                    <h1 className="text-[20px] font-black italic tracking-tighter uppercase">MatchUp <span className="text-[#CCFF00]">Pro</span></h1>
                    <div
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/10 overflow-hidden cursor-pointer"
                        onClick={() => router.push('/profile')}
                    >
                        {profile?.photo_url ? (
                            <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white/40">
                                {profile?.nickname?.[0] || user.email?.[0]}
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* Main Content Scroll Area */}
            <main className="relative z-10 flex-1 flex flex-col px-6 pt-4 pb-20 overflow-y-auto">
                {/* Deployment Check Banner */}
                <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-3 rounded-2xl z-[9999] text-center font-black shadow-2xl">
                    DEPLOYMENT_VERIFIED_V3
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="inline-block px-3 py-1 bg-[#CCFF00]/10 rounded-full border border-[#CCFF00]/20 mb-3">
                        <span className="text-[#CCFF00] text-[10px] font-black tracking-widest uppercase">BETA • SEASON 2026</span>
                    </div>

                    {/* Quick Access Card for Active Club */}
                    {user && myActiveClub ? (
                        <div className="mb-8 space-y-4">
                            <h2 className="text-[32px] font-black leading-tight tracking-tighter">
                                WELCOME BACK,<br />
                                <span className="text-[#CCFF00] italic">{profile?.nickname || 'PLAYER'}</span>
                            </h2>

                            <div
                                className="bg-[#121826] border border-[#CCFF00]/30 p-5 rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group transition-all"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${myAttendance?.status === 'ATTEND' ? 'bg-[#CCFF00] text-black' : (myAttendance?.status === 'ABSENT' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/40')}`}>
                                        {myAttendance?.status === 'ATTEND' ? 'ATTENDING' : (myAttendance?.status === 'ABSENT' ? 'ABSENT' : 'NOT CHECKED')}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-6 cursor-pointer" onClick={() => router.push(`/clubs/${myActiveClub.slug}`)}>
                                    <div className="w-12 h-12 rounded-2xl bg-[#CCFF00] flex items-center justify-center overflow-hidden">
                                        {myActiveClub.logo_url ? (
                                            <img src={myActiveClub.logo_url} alt={myActiveClub.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-black font-black italic text-xl">{myActiveClub.name[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[18px] text-white tracking-tight uppercase italic">{myActiveClub.name}</h3>
                                        <p className="text-[#CCFF00] text-[11px] font-bold uppercase tracking-widest">{myActiveClub.region} • TENNIS CLUB</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {!isEditingAttendance && myAttendance ? (
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{formatDate(targetDate)} 출석</p>
                                                    <p className="text-[15px] font-black">
                                                        {myAttendance.status === 'ATTEND'
                                                            ? `✅ ${myAttendance.preferred_time ? formatTimeOption(myAttendance.preferred_time) : '시간 미정'} 참석`
                                                            : '❌ 이번 주 참석 불가'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setIsEditingAttendance(true)}
                                                    className="text-[11px] font-black text-[#CCFF00] bg-[#CCFF00]/10 px-3 py-1.5 rounded-lg border border-[#CCFF00]/20"
                                                >
                                                    수정하기
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    className={`h-12 rounded-xl border font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${myAttendance?.status === 'ATTEND' ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                                    onClick={() => handleAttendance('ATTEND')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                    참석하기
                                                </button>
                                                <button
                                                    className={`h-12 rounded-xl border font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${myAttendance?.status === 'ABSENT' ? 'bg-red-500 text-white border-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                                    onClick={() => handleAttendance('ABSENT')}
                                                >
                                                    참석불가
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {isEditingAttendance && myAttendance?.status === 'ATTEND' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-3 gap-2 pt-1">
                                                            {attendanceOptions.map((time: string) => (
                                                                <button
                                                                    key={time}
                                                                    onClick={() => handleAttendance('ATTEND', time)}
                                                                    className={`h-10 rounded-xl text-[12px] font-bold transition-all border-2 ${myAttendance.preferred_time === time
                                                                        ? 'bg-white text-black border-white'
                                                                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                                                                        }`}
                                                                >
                                                                    {formatTimeOption(time)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => setIsEditingAttendance(false)}
                                                            className="w-full text-center text-[11px] font-bold text-white/20 py-2 hover:text-white/40"
                                                        >
                                                            닫기
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}

                                    <div className="grid grid-cols-1 pt-2">
                                        <button
                                            className="h-12 rounded-xl bg-white/5 border border-white/10 font-bold text-[13px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push('/score');
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            점수입력 바로가기
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-center cursor-pointer" onClick={() => router.push(`/clubs/${myActiveClub.slug}`)}>
                                    <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-[#CCFF00] transition-colors">Go to Club Dashboard &gt;</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    className="text-[12px] text-white/30 font-bold hover:text-white transition-colors"
                                    onClick={() => router.push('/select-club')}
                                >
                                    다른 클럽 선택하기
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                    href="/select-club"
                                    className="inline-flex items-center justify-center bg-[#CCFF00] text-black font-black italic tracking-tight rounded-2xl px-8 h-14 text-[16px] hover:bg-[#b3e600] shadow-[0_0_30px_rgba(204,255,0,0.2)] transition-all group relative z-50 pointer-events-auto"
                                >
                                    내 클럽 선택하기
                                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                                </a>
                            )}
                        </>
                    )}

                </motion.div>

                {/* 전국 대회 일정 섹션 */}
                <NationalTournaments />

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

