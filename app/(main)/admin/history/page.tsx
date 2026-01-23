
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'

interface ScoreRecord {
    id: string
    created_at: string
    points: number
    result: string
    user_id: string
    profiles: {
        real_name: string
        nickname: string
    }
}

export default function AdminHistoryPage() {
    const { user, isStaff, isPresident, profile } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [scores, setScores] = useState<ScoreRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editResult, setEditResult] = useState<string>('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!user) return

        if (!isStaff && !loading) {
            alert('권한이 없습니다.')
            router.push('/')
            return
        }
        if (profile?.club_id) {
            fetchScores()
        }
    }, [user, isStaff, loading, profile?.club_id])

    const fetchScores = async () => {
        setLoading(true)
        if (!profile?.club_id) return

        const { data, error } = await supabase
            .from('scores')
            .select(`
                id,
                created_at,
                points,
                result,
                user_id,
                profiles (
                    real_name,
                    nickname
                )
            `)
            .eq('club_id', profile.club_id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setScores(data as any)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        setLoading(true)
        const { error, count } = await supabase
            .from('scores')
            .delete({ count: 'exact' })
            .eq('id', id)

        if (!error && count && count > 0) {
            alert('기록이 성공적으로 삭제되었습니다.')
            window.location.reload()
        } else if (error) {
            alert('삭제 실패: ' + error.message)
        } else {
            alert('이미 삭제되었거나 삭제할 권한이 없습니다.')
            fetchScores() // Refresh to sync
        }
        setLoading(false)
    }

    const startEdit = (score: ScoreRecord) => {
        setEditingId(score.id)
        setEditResult(score.result)
    }

    const handleUpdate = async (id: string) => {
        let points = 0
        if (editResult === 'WIN') points = 3
        if (editResult === 'DRAW') points = 1
        if (editResult === 'LOSS') points = 0.5

        const { error } = await supabase
            .from('scores')
            .update({
                result: editResult,
                points: points
            })
            .eq('id', id)

        if (!error) {
            setScores(scores.map(s => s.id === id ? { ...s, result: editResult, points: points } : s))
            setEditingId(null)
        } else {
            alert('수정 실패: ' + error.message)
        }
    }

    if (loading) return <div className="p-10 text-center">로딩 중...</div>

    return (
        <div className="space-y-6 pt-4 pb-10">
            <header className="flex flex-col gap-2 px-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
                            &lt; 뒤로
                        </Button>
                        <h2 className="text-[22px] font-bold">경기 결과 관리</h2>
                    </div>
                    {isPresident && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">PRESIDENT</span>
                    )}
                </div>
                <p className="text-[#6B7684] text-[14px]">기록된 승무패 데이터를 수정하거나 삭제할 수 있습니다.</p>
            </header>

            <div className="relative px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#B0B8C1]" size={18} />
                <input
                    type="text"
                    placeholder="선수 이름으로 기록 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border-none rounded-[20px] py-4 pl-12 pr-4 text-[15px] font-medium shadow-sm focus:ring-2 focus:ring-[#0064FF] transition-all outline-none"
                />
            </div>

            <div className="space-y-3 px-2">
                {scores.filter(s =>
                    s.profiles?.nickname?.toLowerCase().includes(search.toLowerCase()) ||
                    s.profiles?.real_name?.toLowerCase().includes(search.toLowerCase())
                ).map((score) => (
                    <Card key={score.id} padding="none" className="overflow-hidden border-none shadow-sm">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-[16px]">
                                        {score.profiles?.real_name || score.profiles?.nickname || 'Unknown'}
                                    </h4>
                                    <p className="text-[12px] text-[#8B95A1]">
                                        {new Date(score.created_at).toLocaleString('ko-KR')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {editingId === score.id ? (
                                        <button
                                            onClick={() => handleUpdate(score.id)}
                                            className="text-[13px] font-bold text-blue-600"
                                        >
                                            저장
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => startEdit(score)}
                                            className="text-[13px] font-bold text-[#6B7684]"
                                        >
                                            수정
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(score.id)}
                                        className="text-[13px] font-bold text-red-500"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>

                            {editingId === score.id ? (
                                <div className="flex gap-2">
                                    {['WIN', 'DRAW', 'LOSS'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setEditResult(r)}
                                            className={`flex-1 h-10 rounded-xl text-[13px] font-bold transition-all ${editResult === r
                                                ? 'bg-[#0064FF] text-white shadow-md'
                                                : 'bg-[#F2F4F6] text-[#4E5968]'
                                                }`}
                                        >
                                            {r === 'WIN' ? '승리' : r === 'DRAW' ? '무승부' : '패배'}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span className={`font-black text-[15px] ${score.result === 'WIN' ? 'text-blue-600' :
                                        score.result === 'DRAW' ? 'text-green-600' : 'text-orange-500'
                                        }`}>
                                        {score.result === 'WIN' ? '승리' : score.result === 'DRAW' ? '무승부' : '패배'}
                                    </span>
                                    <span className="text-[14px] font-bold text-[#333D4B]">
                                        +{score.points.toFixed(1)} P
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}

                {scores.length === 0 && (
                    <div className="py-20 text-center text-[#8B95A1]">
                        입력된 경기 결과가 없습니다.
                    </div>
                )}
            </div>
        </div>
    )
}
