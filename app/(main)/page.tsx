
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAttendanceTargetDate, isAttendanceWindowOpen, formatDate } from '@/utils/attendance'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
    const router = useRouter()
    // Mock Data (Static for now, should be fetched from DB)
    const currentWeek = "1월 2주차"
    const myRank = 1
    const myPoints = 12.5

    // Attendance State
    const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null)
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(true)
    const targetDate = getAttendanceTargetDate()
    const isOpen = isAttendanceWindowOpen()

    useEffect(() => {
        const fetchAttendance = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoadingAttendance(false)
                return
            }

            const { data, error } = await supabase
                .from('attendance')
                .select('status')
                .eq('user_id', user.id)
                .eq('target_date', targetDate.toISOString().split('T')[0])
                .maybeSingle()

            if (!error && data) {
                setAttendanceStatus(data.status)
            }
            setIsLoadingAttendance(false)
        }
        fetchAttendance()
    }, [targetDate])

    const handleAttendance = async (status: string) => {
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
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,target_date' })

        if (!error) {
            setAttendanceStatus(status)
        } else {
            console.error('Attendance error:', error)
            alert('출석체크 중 오류가 발생했습니다.')
        }
    }

    return (
        <div className="space-y-6 pt-2">
            {/* Top Summary */}
            <section className="flex justify-between items-end">
                <div>
                    <h2 className="text-[24px] font-bold mb-1">이번 주 {currentWeek}</h2>
                    <p className="text-[#6B7684]">오늘도 즐거운 테니스 되세요!</p>
                </div>
            </section>

            {/* Attendance Section */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="bg-[#191F28] text-white border-none shadow-xl relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <h3 className="font-bold text-[17px] tracking-tight">{formatDate(targetDate)} 출석체크</h3>
                                </div>
                                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest italic">Wednesday 08:00</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleAttendance('ATTEND')}
                                    className={`h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${attendanceStatus === 'ATTEND'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {attendanceStatus === 'ATTEND' && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                    )}
                                    출석
                                </button>
                                <button
                                    onClick={() => handleAttendance('ABSENT')}
                                    className={`h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${attendanceStatus === 'ABSENT'
                                            ? 'bg-red-500/80 text-white shadow-lg shadow-red-500/30 scale-[1.02]'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {attendanceStatus === 'ABSENT' && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    )}
                                    참석불가
                                </button>
                            </div>

                            {attendanceStatus && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-[12px] text-white/40 mt-4 font-medium"
                                >
                                    {attendanceStatus === 'ATTEND' ? '👍 출석이 완료되었습니다!' : '😢 다음에 함께해요!'}
                                </motion.p>
                            )}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* My Rank Card */}
            <Card className="bg-[#0064FF] text-white border-none shadow-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="opacity-80 text-[14px] mb-1">내 랭킹</p>
                        <h3 className="text-[32px] font-black italic">{myRank}위</h3>
                    </div>
                    <div className="text-right">
                        <p className="opacity-80 text-[14px] mb-1">누적 포인트</p>
                        <h3 className="text-[24px] font-bold">{myPoints.toFixed(1)}</h3>
                    </div>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full w-full overflow-hidden relative z-10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-white rounded-full"
                    />
                </div>
                <p className="text-[12px] opacity-70 mt-2 text-right relative z-10 font-bold tracking-tight">TOP 10% PRE-SEASON</p>
            </Card>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-3">
                <ActionCard
                    title="경기 스케줄"
                    desc="오늘의 대진표"
                    color="bg-orange-50"
                    textColor="text-orange-600"
                    onClick={() => router.push('/schedule')}
                />
                <ActionCard
                    title="점수 입력"
                    desc="경기 결과 기록"
                    color="bg-green-50"
                    textColor="text-green-600"
                    onClick={() => router.push('/score')}
                />
                <ActionCard
                    title="선수 랭킹"
                    desc="실시간 순위"
                    color="bg-purple-50"
                    textColor="text-purple-600"
                    onClick={() => router.push('/rankings')}
                />
                <ActionCard
                    title="선수 카드"
                    desc="프로필 관리"
                    color="bg-blue-50"
                    textColor="text-blue-600"
                    onClick={() => router.push('/profile')}
                />
            </div>

            {/* Admin Action */}
            <div className="space-y-3">
                <Card className="flex items-center justify-between border-none shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <h4 className="font-bold text-[16px] text-[#333D4B]">스케줄 생성</h4>
                        <p className="text-[#8B95A1] text-[13px]">라운드별 랜덤 대진표</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => router.push('/admin/schedule')}>
                        START
                    </Button>
                </Card>

                <Card className="flex items-center justify-between border-none shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <h4 className="font-bold text-[16px] text-[#333D4B]">복식 토너먼트</h4>
                        <p className="text-[#8B95A1] text-[13px]">승자 진출방식 대진표</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => router.push('/admin/tournament')}>
                        CREATE
                    </Button>
                </Card>
            </div>

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

function ActionCard({ title, desc, color, textColor, onClick }: any) {
    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${color} p-5 rounded-[24px] cursor-pointer transition-all shadow-sm hover:shadow-md`}
        >
            <h4 className={`font-bold text-[16px] ${textColor} mb-1 tracking-tight`}>{title}</h4>
            <p className={`text-[13px] opacity-70 ${textColor} font-medium`}>{desc}</p>
        </motion.div>
    )
}

function MatchResultItem({ win }: { win?: boolean }) {
    return (
        <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-1.5 h-10 rounded-full ${win ? 'bg-[#0064FF]' : 'bg-[#E5E8EB]'}`} />
                <div>
                    <p className="font-bold text-[15px] text-[#333D4B]">1라운드 vs 김철수/이영희</p>
                    <p className="text-[13px] text-[#8B95A1]">1월 3일 • A코트</p>
                </div>
            </div>
            <span className={`font-black text-[14px] ${win ? 'text-[#0064FF]' : 'text-[#8B95A1]'}`}>
                {win ? '+3.0' : '+0.5'}
            </span>
        </div>
    )
}
