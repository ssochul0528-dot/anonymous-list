
'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
    const router = useRouter()
    // Mock Data
    const currentWeek = "1월 1주차"
    const myRank = 1
    const myPoints = 12.5

    return (
        <div className="space-y-6 pt-2">
            {/* Top Summary */}
            <section>
                <h2 className="text-[24px] font-bold mb-1">이번 주 {currentWeek}</h2>
                <p className="text-[#6B7684]">오늘도 즐거운 테니스 되세요!</p>
            </section>

            {/* My Rank Card */}
            <Card className="bg-[#0064FF] text-white border-none shadow-blue-500/20">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="opacity-80 text-[14px] mb-1">내 랭킹</p>
                        <h3 className="text-[32px] font-bold">{myRank}위</h3>
                    </div>
                    <div className="text-right">
                        <p className="opacity-80 text-[14px] mb-1">누적 포인트</p>
                        <h3 className="text-[24px] font-bold">{myPoints}</h3>
                    </div>
                </div>
                <div className="h-1 bg-white/20 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-white w-[70%] rounded-full" />
                </div>
                <p className="text-[12px] opacity-70 mt-2 text-right">Top 10%</p>
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
            <Card className="flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-[16px]">스케줄 생성</h4>
                    <p className="text-[#6B7684] text-[13px]">관리자 전용 기능</p>
                </div>
                <Button size="sm" onClick={() => router.push('/admin/schedule')}>
                    START
                </Button>
            </Card>

            {/* Recent Matches Feed (Optional Placeholder) */}
            <section>
                <h3 className="font-bold text-[18px] mb-3">최근 경기 결과</h3>
                <Card padding="none" className="divide-y divide-gray-100">
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
        <div onClick={onClick} className={`${color} p-5 rounded-[20px] cursor-pointer active:scale-95 transition-transform`}>
            <h4 className={`font-bold text-[16px] ${textColor} mb-1`}>{title}</h4>
            <p className={`text-[13px] opacity-70 ${textColor}`}>{desc}</p>
        </div>
    )
}

function MatchResultItem({ win }: { win?: boolean }) {
    return (
        <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${win ? 'bg-[#0064FF]' : 'bg-[#E5E8EB]'}`} />
                <div>
                    <p className="font-bold text-[15px]">1라운드 vs 김철수/이영희</p>
                    <p className="text-[13px] text-[#6B7684]">1월 3일 • A코트</p>
                </div>
            </div>
            <span className={`font-bold ${win ? 'text-[#0064FF]' : 'text-[#6B7684]'}`}>
                {win ? '승리 (+3.0)' : '패배 (+0.5)'}
            </span>
        </div>
    )
}
