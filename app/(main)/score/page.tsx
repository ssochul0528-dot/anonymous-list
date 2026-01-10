
'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ScorePage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<'WIN' | 'DRAW' | 'LOSS' | null>(null)

    // Mock Current Week for MVP
    const currentWeekLabel = "1월 1주차"

    const handleSave = async () => {
        if (!result) return
        setLoading(true)

        let points = 0
        if (result === 'WIN') points = 3
        if (result === 'DRAW') points = 1
        if (result === 'LOSS') points = 0.5

        try {
            // 1. Ensure Week Exists (Mock logic: In real app, Admin creates weeks)
            // For MVP, we insert a raw score record assuming 'week_id' is simplified 
            // or we just look up a valid week. 
            // To keep MVP SIMPLE and ROBUST without seeding: 
            // We will search for a week named '2026-01-W1', if not exists, create it.

            let weekId = null
            const { data: weeks } = await supabase.from('weeks').select('id').eq('label', currentWeekLabel).single()

            if (weeks) {
                weekId = weeks.id
            } else {
                // Create default season if needed... this gets complex for Client-side.
                // Fallback: Just insert score with null week_id if constraints allow, OR
                // BETTER: Just use a hardcoded UUID for MVP demo or simplistic logic.

                // Let's do the "Find or Create" logic gently.
                // First find season
                const { data: season } = await supabase.from('seasons').select('id').eq('name', '2026-01').maybeSingle()
                let seasonId = season?.id

                if (!seasonId) {
                    const { data: newSeason } = await supabase.from('seasons').insert({ name: '2026-01' }).select().single()
                    seasonId = newSeason?.id
                }

                const { data: newWeek } = await supabase.from('weeks').insert({
                    season_id: seasonId,
                    label: currentWeekLabel
                }).select().single()
                weekId = newWeek?.id
            }

            // 2. Insert Score
            const { error } = await supabase.from('scores').insert({
                week_id: weekId,
                user_id: user?.id,
                result: result,
                points: points
            })

            if (error) throw error

            alert('점수가 저장되었습니다!')
            setResult(null)
            router.refresh()

        } catch (e: any) {
            console.error(e)
            alert('오류가 발생했습니다: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-2 pb-6 space-y-6">
            <h2 className="text-[20px] font-bold">점수 입력</h2>

            <Card className="text-center py-8">
                <p className="text-[#6B7684] mb-2">현재 기록 구간</p>
                <h3 className="text-[24px] font-bold text-[#0064FF] mb-8">{currentWeekLabel}</h3>

                <p className="text-[15px] font-bold mb-4">경기 결과가 어땠나요?</p>

                <div className="flex gap-3 justify-center mb-8 px-4">
                    <ResultBtn
                        label="승리"
                        point="+3.0"
                        active={result === 'WIN'}
                        onClick={() => setResult('WIN')}
                        color="bg-blue-500 hover:bg-blue-600"
                    />
                    <ResultBtn
                        label="무승부"
                        point="+1.0"
                        active={result === 'DRAW'}
                        onClick={() => setResult('DRAW')}
                        color="bg-green-500 hover:bg-green-600"
                    />
                    <ResultBtn
                        label="패배"
                        point="+0.5"
                        active={result === 'LOSS'}
                        onClick={() => setResult('LOSS')}
                        color="bg-orange-400 hover:bg-orange-500"
                    />
                </div>

                <Button
                    fullWidth
                    size="lg"
                    disabled={!result || loading}
                    onClick={handleSave}
                >
                    {loading ? '저장 중...' : '기록 저장하기'}
                </Button>
            </Card>

            {/* Recent History Placeholder */}
            <div className="px-2">
                <h3 className="font-bold text-[16px] mb-3">최근 입력 내역</h3>
                <div className="space-y-3">
                    <div className="bg-white p-4 rounded-[16px] flex justify-between items-center text-[14px]">
                        <span className="text-[#6B7684]">방금 전</span>
                        <span className="font-bold text-[#0064FF]">승리 (+3.0)</span>
                    </div>
                    {/* This would be populated by real data in full version */}
                </div>
            </div>
        </div>
    )
}

function ResultBtn({ label, point, active, onClick, color }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[16px] transition-all ${active ? `${color} text-white scale-105 shadow-lg` : 'bg-[#F2F4F6] text-[#333D4B] hover:bg-gray-200'
                }`}
        >
            <span className="text-[16px] font-bold mb-1">{label}</span>
            <span className={`text-[12px] ${active ? 'text-white/80' : 'text-[#8B95A1]'}`}>{point}</span>
        </button>
    )
}
