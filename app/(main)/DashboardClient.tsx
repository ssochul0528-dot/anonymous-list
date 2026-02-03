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
import { Trophy, Award } from 'lucide-react'

interface DashboardClientProps {
    clubSlug?: string
}

export default function DashboardClient({ clubSlug }: DashboardClientProps = {}) {
    const { user, isAdmin: isSuperAdmin, isStaff: isAnyStaff, profile, isLoading } = useAuth()
    const router = useRouter()
    const [myClub, setMyClub] = useState<any>(null)
    const [myMemberRole, setMyMemberRole] = useState<string | null>(null)

    // Auth Protection
    // useEffect(() => {
    //     if (!isLoading && !user) {
    //         router.push('/login')
    //     }
    // }, [user, isLoading, router])

    // Fetch My Club Info & My Role in it
    useEffect(() => {
        const fetchMyClub = async () => {
            const supabase = createClient()
            let clubDataResult = null;
            let targetId = null;

            // 1. Get Club Data
            if (clubSlug) {
                const { data } = await supabase.from('clubs').select('*').eq('slug', clubSlug).maybeSingle()
                clubDataResult = data
                targetId = data?.id
            } else {
                const searchParams = new URLSearchParams(window.location.search)
                const paramCid = searchParams.get('cid')
                targetId = paramCid || profile?.club_id

                if (targetId) {
                    const { data } = await supabase.from('clubs').select('*').eq('id', targetId).maybeSingle()
                    clubDataResult = data
                }
            }

            if (clubDataResult) {
                setMyClub(clubDataResult)

                // 2. Get My Role in this specific club
                if (user) {
                    const { data: memberData } = await supabase
                        .from('club_members')
                        .select('role')
                        .eq('club_id', clubDataResult.id)
                        .eq('user_id', user.id)
                        .maybeSingle()

                    if (memberData) {
                        setMyMemberRole(memberData.role)

                        // Sync profile role if different (Self-healing role mismatch)
                        if (targetId === profile?.club_id && memberData.role !== profile?.role) {
                            if (memberData.role === 'PRESIDENT' || memberData.role === 'STAFF') {
                                // Don't await, just background sync
                                supabase.from('profiles').update({ role: memberData.role === 'MEMBER' ? 'USER' : memberData.role }).eq('id', user.id)
                            }
                        }
                    } else {
                        setMyMemberRole(null)
                    }
                }
            }
        }
        fetchMyClub()
    }, [profile?.club_id, clubSlug, user?.id])

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
    const [tournaments, setTournaments] = useState<any[]>([])
    const [memberCount, setMemberCount] = useState(0)
    const [isLoadingData, setIsLoadingData] = useState(true)

    // Data Fetching
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchParams.get('action') === 'attendance') {
            const el = document.getElementById('attendance-section')
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    // Pulse or highlight effect could be added here
                }, 500)
            }
        }
    }, [myClub?.id])

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
                    .select('*, profiles!inner(id, nickname, photo_url)')
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
                const { data: participantMatches } = await supabase
                    .from('match_participants')
                    .select('*, matches!inner(*, weeks!inner(*, seasons!inner(*))), profiles(nickname)')
                    .limit(50)
                    .order('match_id', { ascending: false })

                const filteredMatches = participantMatches?.filter((m: any) => m.weeks?.seasons?.club_id === myClub.id).slice(0, 3) || []
                setRecentMatchesData(filteredMatches)

                // 4. Fetch Tournaments
                const { data: tournamentData } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('club_id', myClub.id)
                    .order('created_at', { ascending: false })
                    .limit(3)

                setTournaments(tournamentData || [])

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

    // Determine if user is a member or global staff/admin
    const isLocalStaff = myMemberRole === 'STAFF' || myMemberRole === 'PRESIDENT'
    const isMember = profile?.club_id === myClub?.id || !!myMemberRole
    const canSeePrivateView = isMember || isAnyStaff || isSuperAdmin
    const hasManagementPower = isLocalStaff || isAnyStaff || isSuperAdmin

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

            {/* Add Management Shortcut for Staff even in public view if they are just visiting */}
            {hasManagementPower && (
                <div className="px-1">
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => router.push('/admin/history')}
                        className="bg-[#CCFF00] text-black font-black"
                    >
                        ADMIN TOOLS ACCESS
                    </Button>
                </div>
            )}
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

        </div>
    )

    if (!canSeePrivateView) return renderPublicView()

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
                    <div className="flex flex-col">
                        <h2 className="text-[14px] font-bold text-[#CCFF00] uppercase tracking-wider">
                            {myClub ? myClub.name : 'LOADING CLUB...'} • {currentWeek}
                        </h2>
                        <div className="flex gap-2 items-center mt-1">
                            <span className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded text-white/40 uppercase">
                                My Role: {myMemberRole || 'GUEST'}
                            </span>
                            {isAnyStaff && <span className="text-[9px] font-black bg-[#CCFF00]/20 px-1.5 py-0.5 rounded text-[#CCFF00] uppercase">Global Staff</span>}
                        </div>
                    </div>
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
                    id="attendance-section"
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
            {/* Tournaments Section */}
            {(tournaments && tournaments.length > 0 || isAnyStaff) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="px-1 mb-10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <h3 className="font-black text-[15px] tracking-tight uppercase italic text-white/90">Club Tournaments</h3>
                        </div>
                        {isAnyStaff && tournaments.length > 0 && (
                            <button
                                onClick={() => router.push('/admin/tournament')}
                                className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-wider bg-[#CCFF00]/10 px-2 py-1 rounded"
                            >
                                + NEW
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {tournaments.length > 0 ? (
                            tournaments.map((t: any) => (
                                <Card key={t.id} className="bg-[#121826]/80 backdrop-blur-xl border-white/5 p-4 hover:border-white/20 transition-all cursor-pointer group" onClick={() => router.push(`/admin/tournament/${t.id}/results`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                                            <Trophy size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[15px] text-white group-hover:text-[#CCFF00] transition-colors">{t.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t.status}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] font-medium text-white/40">{new Date(t.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-white/10 group-hover:text-white transition-all">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            isAnyStaff && (
                                <Card className="bg-white/5 border-dashed border-white/10 p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-white/10 transition-all" onClick={() => router.push('/admin/tournament')}>
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">첫 번째 대회를 만들어보세요!</h4>
                                        <p className="text-white/40 text-[12px] mt-1">대진표 생성부터 인쇄까지 한 번에 가능합니다.</p>
                                    </div>
                                    <Button size="sm" className="mt-2 bg-[#CCFF00] text-black font-bold">대회 생성하러 가기</Button>
                                </Card>
                            )
                        )}
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 gap-3">
                <ActionCard
                    title="SCORE"
                    desc="결과 입력 (매치 등록)"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                    onClick={() => router.push('/score')}
                />
            </div>


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
