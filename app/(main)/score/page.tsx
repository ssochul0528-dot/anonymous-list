'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Trash2, Edit2 } from 'lucide-react'

interface ScoreRecord {
    id: string
    created_at: string
    points: number
    result: 'WIN' | 'DRAW' | 'LOSS'
    week_id: string
}

export default function ScorePage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(true)
    const [result, setResult] = useState<'WIN' | 'DRAW' | 'LOSS' | null>(null)
    const [history, setHistory] = useState<ScoreRecord[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)

    // Mock Current Week for MVP
    const currentWeekLabel = "1월 1주차"

    useEffect(() => {
        if (user) {
            fetchHistory()
        }
    }, [user])

    const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
            const { data, error } = await supabase
                .from('scores')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            setHistory(data || [])
        } catch (e) {
            console.error('Error fetching history:', e)
        } finally {
            setHistoryLoading(false)
        }
    }

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

            if (editingId) {
                // Update existing record
                const { error } = await supabase
                    .from('scores')
                    .update({
                        result: result,
                        points: points,
                        week_id: weekId
                    })
                    .eq('id', editingId)
                    .eq('user_id', user?.id) // Extra safety check
                if (error) throw error
                setEditingId(null)
                alert('점수가 성공적으로 수정되었습니다! 랭킹에서 확인해보세요.')
                router.push('/rankings') // Redirect to rankings to see the change
            } else {
                // Insert new record
                const { error } = await supabase.from('scores').insert({
                    week_id: weekId,
                    user_id: user?.id,
                    result: result,
                    points: points
                })
                if (error) throw error
                alert('점수가 저장되었습니다!')
            }

            setResult(null)
            fetchHistory()
            router.refresh()
        } catch (e: any) {
            console.error(e)
            alert('오류가 발생했습니다: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        try {
            setLoading(true)
            console.log('Attempting to delete score:', id, 'for user:', user?.id)

            const { error, count } = await supabase
                .from('scores')
                .delete({ count: 'exact' })
                .eq('id', id)
                .eq('user_id', user?.id)

            if (error) {
                console.error('Supabase delete error:', error)
                throw error
            }

            console.log('Delete result count:', count)

            if (count === 0) {
                alert(`삭제 실패: 기록을 찾을 수 없거나 삭제 권한이 없습니다. (이미 삭제되었을 수 있습니다)`)
                await fetchHistory()
            } else {
                alert('기록이 성공적으로 삭제되었습니다.')
                // Force a full page reload to ensure all caches are cleared
                window.location.reload()
            }
        } catch (e: any) {
            console.error('Delete execution error:', e)
            alert('삭제 과정 중 오류가 발생했습니다: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (record: ScoreRecord) => {
        setEditingId(record.id)
        setResult(record.result)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setResult(null)
    }

    return (
        <div className="pt-2 pb-10 space-y-6">
            <header className="flex justify-between items-center mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                    <span className="font-bold text-[14px]">뒤로가기</span>
                </button>
                <h2 className="text-[18px] font-black italic tracking-tight uppercase">Enter Score</h2>
            </header>

            <Card className="text-center py-8 relative">
                {editingId && (
                    <button
                        onClick={cancelEdit}
                        className="absolute top-4 right-4 text-[13px] text-[#8B95A1] font-medium"
                    >
                        수정 취소
                    </button>
                )}
                <p className="text-[#6B7684] mb-2">{editingId ? '기록 수정 중' : '현재 기록 구간'}</p>
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

                <div className="px-4">
                    <Button
                        fullWidth
                        size="lg"
                        disabled={!result || loading}
                        onClick={handleSave}
                    >
                        {loading ? '저장 중...' : editingId ? '수정 완료하기' : '기록 저장하기'}
                    </Button>
                </div>
            </Card>

            <div className="px-1">
                <h3 className="font-bold text-[16px] mb-4">내 최근 기록</h3>
                {historyLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-[16px] animate-pulse" />)}
                    </div>
                ) : history.length > 0 ? (
                    <div className="space-y-3">
                        {history.map((record) => (
                            <div key={record.id} className="bg-white p-4 rounded-[20px] shadow-sm flex justify-between items-center transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-bold mb-0.5">
                                        {record.result === 'WIN' ? (
                                            <span className="text-[#0064FF]">승리 (+3.0)</span>
                                        ) : record.result === 'DRAW' ? (
                                            <span className="text-[#2DB400]">무승부 (+1.0)</span>
                                        ) : (
                                            <span className="text-[#FF6B00]">패배 (+0.5)</span>
                                        )}
                                    </span>
                                    <span className="text-[11px] text-[#8B95A1]">
                                        {new Date(record.created_at).toLocaleString('ko-KR', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEdit(record)}
                                        className="p-2 text-[#8B95A1] hover:text-[#0064FF] transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-2 text-[#8B95A1] hover:text-[#F04452] transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#F9FAFB] py-10 rounded-[20px] text-center border-2 border-dashed border-gray-100">
                        <p className="text-[#8B95A1] text-[14px]">아직 입력한 기록이 없습니다.</p>
                    </div>
                )}
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
