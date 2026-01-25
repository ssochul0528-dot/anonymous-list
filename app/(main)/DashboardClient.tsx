
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAttendanceTargetDate, isAttendanceWindowOpen, formatDate } from '@/utils/attendance'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardClientProps {
    clubSlug?: string
}

export default function DashboardClient({ clubSlug }: DashboardClientProps = {}) {
    const { user, isAdmin: isSuperAdmin, isStaff: isAnyStaff, profile, isLoading } = useAuth()
    const router = useRouter()
    const [myClub, setMyClub] = useState<any>(null)

    // Auth Protection
    // useEffect(() => {
    //     if (!isLoading && !user) {
    //         router.push('/login')
    //     }
    // }, [user, isLoading, router])

    // Fetch My Club Info
    useEffect(() => {
        const fetchMyClub = async () => {
            const supabase = createClient()
            let data = null;

            // Priority 1: Direct Slug Prop (from /clubs/[slug])
            if (clubSlug) {
                const { data: clubData } = await supabase.from('clubs').select('*').eq('slug', clubSlug).maybeSingle()
                data = clubData
            }
            // Priority 2: URL Param (cid)
            else {
                const searchParams = new URLSearchParams(window.location.search)
                const paramCid = searchParams.get('cid')
                const targetId = paramCid || profile?.club_id

                if (targetId) {
                    const { data: clubData } = await supabase.from('clubs').select('*').eq('id', targetId).maybeSingle()
                    data = clubData
                }
            }

            if (data) {
                setMyClub(data)
            }
        }
        fetchMyClub()
    }, [profile?.club_id, clubSlug])

    const handleCopyInvite = () => {
        if (!myClub) return
        const link = `${window.location.origin}/clubs/${myClub.slug}?code=${myClub.invite_code}`
        navigator.clipboard.writeText(link)
        alert('초대 링크가 복사되었습니다!\n클럽 카톡방에 공유하세요.')
    }

    // Dashboard is now rendered only when user exists by parent page.tsx
    // So we don't need redirect logic here.

    // Real Data States
    const [topRankings, setTopRankings] = useState<any[]>([])
    const [recentMatchesData, setRecentMatchesData] = useState<any[]>([])
    const [memberCount, setMemberCount] = useState(0)
    const [isLoadingData, setIsLoadingData] = useState(true)

    // Data Fetching
    useEffect(() => {
        const fetchClubData = async () => {
            if (!myClub?.id) {
                setIsLoadingData(false)
                return
            }
            setIsLoadingData(true)
            const supabase = createClient()

            try {
                // 1. Fetch Member Count
                const { count } = await supabase
                    .from('club_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('club_id', myClub.id)
                setMemberCount(count || 0)

                // 2. Fetch Rankings (Top 3)
                const { data: scores } = await supabase
                    .from('scores')
                    .select('*, profiles(id, nickname, photo_url)')
                    .eq('club_id', myClub.id)

                if (scores) {
                    const stats = new Map()
                    scores.forEach(s => {
                        const pid = s.profiles?.id
                        if (!pid) return
                        if (!stats.has(pid)) {
                            stats.set(pid, { ...s.profiles, points: 0 })
                        }
                        stats.get(pid).points += Number(s.points)
                    })
                    const sorted = Array.from(stats.values())
                        .sort((a: any, b: any) => b.points - a.points)
                        .slice(0, 3)
                    setTopRankings(sorted)
                }

                // 3. Fetch Recent Matches
                const { data: matches } = await supabase
                    .from('matches')
                    .select(`
                        id, 
                        round_number, 
                        court_label, 
                        created_at,
                        weeks (
                            id, 
                            label,
                            seasons (id, club_id)
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(10)

                const filteredMatches = matches?.filter((m: any) => m.weeks?.seasons?.club_id === myClub.id).slice(0, 3) || []
                setRecentMatchesData(filteredMatches)

            } catch (e) {
                console.error("Error fetching club data:", e)
            } finally {
                setIsLoadingData(false)
            }
        }
        fetchClubData()
    }, [myClub?.id])

    // Mock Data (Legacy)
    const currentWeek = "1월 2주차"

    // Attendance State
    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(true)
    const targetDate = getAttendanceTargetDate()
    const isOpen = isAttendanceWindowOpen()

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user) {
                setIsLoadingAttendance(false)
                return
            }

            const supabase = createClient()
            if (!myClub?.id) return

            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('status, preferred_time')
                .eq('user_id', user.id)
                .eq('target_date', targetDate.toISOString().split('T')[0])
                .eq('club_id', myClub.id)
                .maybeSingle()

            if (!attError && attData) {
                setAttendanceStatus(attData.status)
                setSelectedTime(attData.preferred_time)
            } else {
                // Reset if no data found for this club/date
                setAttendanceStatus(null)
                setSelectedTime(null)
            }
            setIsLoadingAttendance(false)
        }
        if (myClub?.id) fetchAttendance()
    }, [user, targetDate, myClub?.id])

    const handleAttendance = async (status: string, time?: string) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        if (!myClub?.id) {
            alert('클럽 정보를 불러오지 못했습니다.')
            return
        }

        // Manual Upsert to avoid Constraint issues
        // 1. Check if exists
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('user_id', user.id)
            .eq('target_date', targetDate.toISOString().split('T')[0])
            .eq('club_id', myClub.id)
            .maybeSingle()

        let error
        if (existing) {
            // 2. Update
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
            // 3. Insert
            const { error: insertError } = await supabase
                .from('attendance')
                .insert({
                    user_id: user.id,
                    target_date: targetDate.toISOString().split('T')[0],
                    club_id: myClub.id,
                    status,
                    preferred_time: time || null
                })
            error = insertError
        }

        if (!error) {
            setAttendanceStatus(status)
            if (status === 'ATTEND' && time) {
                setSelectedTime(time)
            } else if (status === 'ABSENT') {
                setSelectedTime(null)
            }
        } else {
            console.error('Attendance error:', error)
            alert('출석체크 실패 [V4]: ' + (error.message || JSON.stringify(error)))
        }
    }

    const attendanceOptions = React.useMemo(() => {
        const defaults = ["08:00", "09:00", "10:00", "11:00", "12:00"]
        if (!myClub) return defaults
        if (!myClub.attendance_options) return defaults

        const opts = myClub.attendance_options
        if (Array.isArray(opts) && opts.length > 0) return opts
        try {
            const parsed = JSON.parse(opts)
            return parsed.length > 0 ? parsed : defaults
        } catch { return defaults }
    }, [myClub])

    const formatTimeOption = (t: string) => {
        if (!t.includes(':')) return t;
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        if (isNaN(hour)) return t;
        const ampm = hour >= 12 ? '오후' : '오전';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${ampm} ${String(displayHour).padStart(2, '0')}:${m}`;
    }

    // Determine if user is a member of this club
    const isMember = profile?.club_id === myClub?.id || isSuperAdmin

    if (!myClub && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <p className="text-white/20 font-bold">🤔 클럽 정보를 찾을 수 없습니다.</p>
                <Button size="sm" onClick={() => router.push('/')}>메인으로 돌아가기</Button>
            </div>
        )
    }

    // Public Showcase View for Non-Members
    const renderPublicView = () => (
        <div className="space-y-8 pt-24 pb-20 relative z-0">
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-1 mb-6 relative z-50 pointer-events-auto">
                <a
                    href="/clubs"
                    className="h-10 pl-2 pr-4 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 flex items-center gap-2 transition-all group pointer-events-auto z-50 relative"
                >
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#CCFF00] group-hover:text-black transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
                    </div>
                    <span className="font-bold text-[13px]">클럽 마켓</span>
                </a>
            </div>

            {/* Showcase Hero */}
            <section className="flex flex-col items-center text-center px-4 gap-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-[32px] bg-[#121826] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl"
                >
                    {myClub?.logo_url ? (
                        <img src={myClub.logo_url} alt={myClub.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[40px] font-black italic text-white/10">{myClub?.name?.[0]}</span>
                    )}
                </motion.div>
                <div className="space-y-1">
                    <h1 className="text-[32px] font-black tracking-tighter uppercase italic">{myClub?.name}</h1>
                    <p className="text-[#CCFF00] font-bold text-[13px] tracking-widest">{myClub?.region} • TENNIS CLUB</p>
                </div>
                <p className="text-white/40 text-[14px] leading-relaxed max-w-[300px]">
                    {myClub?.description || "함께 성장하는 즐거운 테니스 클럽입니다. 지금 바로 참여하세요!"}
                </p>

                <Button
                    size="lg"
                    className="mt-4 h-14 px-10 rounded-2xl bg-[#CCFF00] text-[#0A0E17] font-black text-[16px] hover:bg-[#b3e600] shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all active:scale-95 flex items-center gap-3"
                    onClick={() => router.push(`/club-join?cid=${myClub?.id}`)}
                >
                    클럽 가입하기
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                </Button>
            </section>

            {/* Club Stats Preview */}
            <div className="grid grid-cols-2 gap-3 px-1">
                <Card className="bg-[#121826]/50 border-white/5 p-5 text-center">
                    <p className="text-white/30 text-[10px] font-black mb-1 uppercase tracking-widest">Members</p>
                    <p className="text-[24px] font-black italic text-white">
                        {isLoadingData ? "..." : `${memberCount}+`}
                    </p>
                </Card>
                <Card className="bg-[#121826]/50 border-white/5 p-5 text-center">
                    <p className="text-white/30 text-[10px] font-black mb-1 uppercase tracking-widest">Active Level</p>
                    <p className="text-[24px] font-black italic text-[#CCFF00]">
                        {myClub?.level || "MID"}
                    </p>
                </Card>
            </div>

            {/* Public Ranking Section */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-bold text-[18px] text-white italic tracking-tighter">CLUB RANKING</h3>
                    <button className="text-[12px] text-white/40 font-bold" onClick={() => router.push('/rankings')}>VIEW ALL &gt;</button>
                </div>
                <Card className="bg-[#121826] border-white/5 overflow-hidden">
                    {isLoadingData ? (
                        <div className="p-8 text-center text-white/10 italic font-bold">LOADING...</div>
                    ) : topRankings.length > 0 ? (
                        topRankings.map((player, i) => (
                            <div key={player.id} className={`p-4 flex items-center justify-between ${i !== topRankings.length - 1 ? 'border-b border-white/5' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className="font-black italic text-[#CCFF00] w-4 text-[16px]">{i + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                        {player.photo_url ? (
                                            <img src={player.photo_url} alt={player.nickname} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{player.nickname[0]}</div>
                                        )}
                                    </div>
                                    <span className="font-bold text-[14px]">{player.nickname}</span>
                                </div>
                                <span className="text-[13px] font-black italic text-white/40">{Number(player.points).toFixed(1)} Pts</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-white/20 text-[13px] italic font-bold uppercase tracking-widest">
                            No rankings recorded yet
                        </div>
                    )}
                </Card>
            </section>

            {/* Recent Match Feed */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-bold text-[18px] text-white italic tracking-tighter">RECENT MATCHES</h3>
                </div>
                <Card padding="none" className="divide-y divide-white/5 border-none shadow-sm overflow-hidden bg-[#121826]/30">
                    {isLoadingData ? (
                        <div className="p-8 text-center text-white/10 italic">LOADING...</div>
                    ) : recentMatchesData.length > 0 ? (
                        recentMatchesData.map(m => (
                            <MatchResultItem key={m.id} match={m} />
                        ))
                    ) : (
                        <div className="p-8 text-center text-white/20 text-[13px] font-bold italic uppercase tracking-widest">
                            No match history
                        </div>
                    )}
                </Card>
            </section>
        </div>
    )

    if (!isMember) return renderPublicView()

    return (
        <div className="space-y-6 pt-24 pb-20 relative z-0">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between px-1 mb-6 relative z-50 pointer-events-auto">
                <div className="flex gap-2">
                    <a
                        href="/"
                        className="h-10 pl-2 pr-4 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 flex items-center gap-2 transition-all group pointer-events-auto z-50 relative"
                    >
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#CCFF00] group-hover:text-black transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
                        </div>
                        <span className="font-bold text-[13px]">메인으로</span>
                    </a>

                    <a
                        href="/select-club"
                        className="h-10 w-10 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 flex items-center justify-center transition-all group pointer-events-auto z-50 relative"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-[#CCFF00]"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                    </a>
                </div>

                {myClub && (
                    <Button
                        size="sm"
                        className="h-10 px-4 rounded-full bg-[#CCFF00] text-black font-bold text-[12px] hover:bg-[#b3e600] flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] animate-pulse"
                        onClick={handleCopyInvite}
                    >
                        <span>🔗 초대 링크 복사</span>
                    </Button>
                )}
            </div>

            {/* Top Summary */}
            <section className="flex flex-col gap-1 px-1">
                <div className="flex justify-between items-start">
                    <h2 className="text-[14px] font-bold text-[#CCFF00] uppercase tracking-wider">
                        {myClub ? myClub.name : 'LOADING CLUB...'} • {currentWeek}
                    </h2>
                    {isSuperAdmin && (
                        <Button
                            size="sm"
                            variant="primary"
                            className="h-7 px-3 text-[10px] font-black bg-white/10 hover:bg-[#CCFF00] hover:text-black border border-white/10"
                            onClick={() => router.push('/super')}
                        >
                            SUPER MASTER
                        </Button>
                    )}
                </div>
                <h1 className="text-[28px] font-black leading-tight tracking-tighter">
                    {myClub ? (
                        <>
                            {myClub.name}에서<br />
                            <span className="text-[#CCFF00]">테니스 한 게임?</span>
                        </>
                    ) : (
                        <>
                            선택된 클럽이 없습니다.<br />
                            <span className="text-[#CCFF00] cursor-pointer hover:underline" onClick={() => router.push('/select-club')}>클럽을 선택해주세요 &gt;</span>
                        </>
                    )}
                </h1>
                <p className="text-white/40 text-[12px] font-medium leading-relaxed mt-1">
                    경기 기록·랭킹·운영을 하나로 관리하는 테니스 경기 관리 앱
                </p>
            </section>

            {/* Attendance Section */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="bg-[#121826]/80 backdrop-blur-xl border border-white/5 text-white shadow-2xl relative overflow-hidden group">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#CCFF00]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                                    <h3 className="font-black text-[15px] tracking-tight uppercase italic">{formatDate(targetDate)} ATTENDANCE</h3>
                                </div>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">D-DAY</span>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            // Optimistic update
                                            if (attendanceStatus !== 'ATTEND') {
                                                setSelectedTime(null);
                                            }
                                            setAttendanceStatus('ATTEND');

                                            // Persist to DB immediately (Intention to Attend)
                                            // This fixes the issue where switching from Absent -> Attend didn't save
                                            // until a time was picked.
                                            handleAttendance('ATTEND');
                                        }}
                                        type="button"
                                        className={`h-14 rounded-xl font-black transition-all flex flex-col items-center justify-center border-2 ${attendanceStatus === 'ATTEND'
                                            ? 'bg-[#CCFF00] text-[#0A0E17] border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.4)]'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-[16px]">참석</span>
                                        <span className="text-[10px] opacity-70">JOIN</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedTime(null)
                                            handleAttendance('ABSENT')
                                        }}
                                        className={`h-14 rounded-xl font-black transition-all flex flex-col items-center justify-center border-2 ${attendanceStatus === 'ABSENT'
                                            ? 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-[16px]">참석불가</span>
                                        <span className="text-[10px] opacity-70">SKIP</span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {attendanceStatus === 'ATTEND' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 grid grid-cols-2 gap-3 border-t border-white/5 mt-2">
                                                {attendanceOptions.map((time: string) => (
                                                    <button
                                                        key={time}
                                                        onClick={() => {
                                                            setSelectedTime(time)
                                                            handleAttendance('ATTEND', time)
                                                        }}
                                                        className={`h-12 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 border-2 ${selectedTime === time
                                                            ? 'bg-white text-[#191F28] border-white shadow-lg'
                                                            : 'bg-transparent border-white/10 text-white/60 hover:border-white/30'
                                                            }`}
                                                    >
                                                        {formatTimeOption(time)}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {attendanceStatus && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-[12px] text-white/40 mt-4 font-bold uppercase"
                                >
                                    {attendanceStatus === 'ATTEND'
                                        ? (selectedTime ? `✅ ${selectedTime} 출석 완료!` : '⏰ 시간을 선택해주세요')
                                        : '❌ 이번 주는 참석불가'}
                                </motion.p>
                            )}
                        </div>
                    </Card>
                </motion.div>
            )}



            <div className="grid grid-cols-2 gap-3">
                <ActionCard
                    title="SCHEDULE"
                    desc="경기 스케줄"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                    onClick={() => router.push('/admin/schedule')}
                />
                <ActionCard
                    title="SCORE"
                    desc="결과 입력"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                    onClick={() => router.push('/score')}
                />
                <ActionCard
                    title="RANKING"
                    desc="실시간 순위"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>}
                    onClick={() => router.push('/rankings')}
                />
                <ActionCard
                    title="PROFILE"
                    desc="플레이어 카드"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                    onClick={() => router.push('/profile')}
                />
            </div>

            {isAnyStaff && (
                <div className="space-y-3">
                    <h3 className="font-black text-[14px] px-1 text-white/40 tracking-[0.2em] uppercase">Club Management</h3>

                    <Card className="flex items-center justify-between border border-white/5 shadow-sm hover:border-[#CCFF00]/30 transition-all bg-[#121826] text-white p-4">
                        <div>
                            <h4 className="font-black text-[15px] uppercase italic">Match History</h4>
                            <p className="text-white/40 text-[12px]">전체 경기 내역 기록 및 수정</p>
                        </div>
                        <Button size="sm" className="bg-white/10 hover:bg-[#CCFF00] hover:text-[#0A0E17] font-black text-[11px] rounded transition-colors" onClick={() => router.push('/admin/history')}>
                            MANAGE
                        </Button>
                    </Card>

                    <Card className="flex items-center justify-between border border-white/5 shadow-sm hover:border-[#CCFF00]/30 transition-all bg-[#121826] text-white p-4">
                        <div>
                            <h4 className="font-black text-[15px] uppercase italic">Season Schedule</h4>
                            <p className="text-white/40 text-[12px]">라운드별 대진표 랜덤 생성</p>
                        </div>
                        <Button size="sm" className="bg-white/10 hover:bg-[#CCFF00] hover:text-[#0A0E17] font-black text-[11px] rounded transition-colors" onClick={() => router.push('/admin/schedule')}>
                            START
                        </Button>
                    </Card>

                    <Card className="flex items-center justify-between border border-white/5 shadow-sm hover:border-[#CCFF00]/30 transition-all bg-[#121826] text-white p-4">
                        <div>
                            <h4 className="font-black text-[15px] uppercase italic">Club Settings</h4>
                            <p className="text-white/40 text-[12px]">출석 시간 및 클럽 설정 관리</p>
                        </div>
                        <Button size="sm" className="bg-white/10 hover:bg-[#CCFF00] hover:text-[#0A0E17] font-black text-[11px] rounded transition-colors" onClick={() => router.push('/admin/settings')}>
                            SETUP
                        </Button>
                    </Card>
                </div>
            )}

            {/* Recent Matches Feed */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-bold text-[18px] text-[#333D4B]">최근 경기 결과</h3>
                    <button className="text-[13px] text-[#8B95A1] font-bold">더보기 &gt;</button>
                </div>
                <Card padding="none" className="divide-y divide-[#F2F4F6] border-none shadow-sm overflow-hidden bg-white/5">
                    {isLoadingData ? (
                        <div className="p-8 text-center text-white/10 italic font-bold">LOADING MATCHES...</div>
                    ) : recentMatchesData.length > 0 ? (
                        recentMatchesData.map(m => (
                            <MatchResultItem key={m.id} match={m} />
                        ))
                    ) : (
                        <div className="p-8 text-center text-white/20 text-[13px] font-bold italic uppercase tracking-widest leading-relaxed">
                            아직 진행된 경기가 없습니다.<br />
                            <span className="text-[10px] opacity-50">스케줄을 생성하고 기록을 시작하세요!</span>
                        </div>
                    )}
                </Card>
            </section>
        </div>
    )
}

function ActionCard({ title, desc, icon, onClick }: any) {
    return (
        <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="bg-[#121826] border border-white/5 p-5 rounded-2xl cursor-pointer transition-all shadow-xl hover:border-[#CCFF00]/30 group"
        >
            <div className="mb-4 text-[#CCFF00] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h4 className="font-black text-[14px] text-white tracking-widest uppercase italic">{title}</h4>
            <p className="text-[11px] text-white/40 font-bold mt-1">{desc}</p>
        </motion.div>
    )
}

function MatchResultItem({ match, win }: { match?: any, win?: boolean }) {
    if (!match) {
        return (
            <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-4">
                    <div className={`w-1 h-8 rounded-full ${win ? 'bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]' : 'bg-white/10'}`} />
                    <div>
                        <p className="font-black text-[14px] text-white italic uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">1R • VS RED STORM</p>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">JAN 18 • COURT A</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`font-black text-[16px] italic ${win ? 'text-[#00D1FF]' : 'text-white/20'}`}>
                        {win ? '+3.0' : '+0.5'}
                    </span>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Match Pts</p>
                </div>
            </div>
        )
    }

    const dateStr = new Date(match.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }).toUpperCase()

    return (
        <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-4">
                <div className={`w-1 h-8 rounded-full bg-[#CCFF00]/40 shadow-[0_0_10px_#CCFF00]/20`} />
                <div>
                    <p className="font-black text-[14px] text-white italic uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">
                        {match.weeks?.label || `${match.round_number}R`} • COURT {match.court_label}
                    </p>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{dateStr}</p>
                </div>
            </div>
            <div className="text-right">
                <span className="font-black text-[12px] italic text-[#CCFF00] uppercase tracking-tighter">
                    Completed
                </span>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Status</p>
            </div>
        </div>
    )
}
