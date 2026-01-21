
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAttendanceTargetDate, isAttendanceWindowOpen, formatDate } from '@/utils/attendance'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardClient() {
    const { user, isAdmin: isSuperAdmin, isStaff: isAnyStaff } = useAuth()
    const router = useRouter()

    // Dashboard is now rendered only when user exists by parent page.tsx
    // So we don't need redirect logic here.

    // Mock Data
    const currentWeek = "1월 2주차"
    const myRank = 1
    const myPoints = 12.5

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
            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('status, preferred_time')
                .eq('user_id', user.id)
                .eq('target_date', targetDate.toISOString().split('T')[0])
                .maybeSingle()

            if (!attError && attData) {
                setAttendanceStatus(attData.status)
                setSelectedTime(attData.preferred_time)
            }
            setIsLoadingAttendance(false)
        }
        fetchAttendance()
    }, [user, targetDate])

    const handleAttendance = async (status: string, time?: string) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        const { error } = await supabase
            .from('attendance')
            .upsert({
                user_id: user.id,
                target_date: targetDate.toISOString().split('T')[0],
                status,
                preferred_time: time || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,target_date' })

        if (!error) {
            setAttendanceStatus(status)
            if (time) setSelectedTime(time)
            if (status === 'ABSENT') setSelectedTime(null)
        } else {
            console.error('Attendance error:', error)
            alert('출석체크 중 오류가 발생했습니다.')
        }
    }

    return (
        <div className="space-y-6 pt-2">
            {/* Top Summary */}
            <section className="flex flex-col gap-1 px-1">
                <div className="flex justify-between items-start">
                    <h2 className="text-[14px] font-bold text-[#CCFF00] uppercase tracking-wider">PRE-SEASON • {currentWeek}</h2>
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
                    경기를 관리하면,<br />
                    <span className="text-[#CCFF00]">동호회가 굴러갑니다.</span>
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
                                            if (attendanceStatus === 'ATTEND' && selectedTime) {
                                            } else {
                                                setAttendanceStatus('ATTEND');
                                                setSelectedTime(null);
                                            }
                                        }}
                                        className={`h-14 rounded-xl font-black transition-all flex flex-col items-center justify-center border-2 ${attendanceStatus === 'ATTEND'
                                            ? 'bg-[#CCFF00] text-[#0A0E17] border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.4)]'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-[16px]">참석</span>
                                        <span className="text-[10px] opacity-70">JOIN</span>
                                    </button>
                                    <button
                                        onClick={() => handleAttendance('ABSENT')}
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
                                                <button
                                                    onClick={() => handleAttendance('ATTEND', '08:00')}
                                                    className={`h-12 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 border-2 ${selectedTime === '08:00'
                                                        ? 'bg-white text-[#191F28] border-white shadow-lg'
                                                        : 'bg-transparent border-white/10 text-white/60 hover:border-white/30'
                                                        }`}
                                                >
                                                    오전 08:00
                                                </button>
                                                <button
                                                    onClick={() => handleAttendance('ATTEND', '09:00')}
                                                    className={`h-12 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 border-2 ${selectedTime === '09:00'
                                                        ? 'bg-white text-[#191F28] border-white shadow-lg'
                                                        : 'bg-transparent border-white/10 text-white/60 hover:border-white/30'
                                                        }`}
                                                >
                                                    오전 09:00
                                                </button>
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

            <Card className="bg-gradient-to-br from-[#121826] to-[#0A0E17] text-white border border-white/5 shadow-2xl relative overflow-hidden p-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#CCFF00]/10 rounded-full -translate-y-24 translate-x-24 blur-[80px]" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="text-[#CCFF00] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Current Ranking</p>
                        <h3 className="text-[42px] font-black italic tracking-tighter leading-none">{myRank}<span className="text-[18px] ml-1 not-italic opacity-50">ST</span></h3>
                    </div>
                    <div className="text-right">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Points</p>
                        <h3 className="text-[28px] font-bold text-[#00D1FF]">{myPoints.toFixed(1)}</h3>
                    </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full w-full overflow-hidden relative z-10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00]"
                    />
                </div>
                <div className="flex justify-between items-center mt-3 relative z-10">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Global Percentile</p>
                    <p className="text-[11px] text-[#CCFF00] font-black tracking-tighter italic">TOP 10% PRE-SEASON</p>
                </div>
            </Card>

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
                </div>
            )}

            {/* Recent Matches Feed */}
            <section>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-bold text-[18px] text-[#333D4B]">최근 경기 결과</h3>
                    <button className="text-[13px] text-[#8B95A1] font-bold">더보기 &gt;</button>
                </div>
                <Card padding="none" className="divide-y divide-[#F2F4F6] border-none shadow-sm overflow-hidden">
                    <MatchResultItem win />
                    <MatchResultItem />
                    <MatchResultItem />
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

function MatchResultItem({ win }: { win?: boolean }) {
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
