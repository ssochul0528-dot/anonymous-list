
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [scores, setScores] = useState<ScoreRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editResult, setEditResult] = useState<string>('')

    const SUPER_ADMIN_EMAIL = 'ssochul@naver.com'

    useEffect(() => {
        if (!user) return

        // Final check: Only super admin or ADMIN role
        const checkAdmin = async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (user.email !== SUPER_ADMIN_EMAIL && profile?.role !== 'ADMIN') {
                alert('권한이 없습니다.')
                router.push('/')
                return
            }
            fetchScores()
        }

        checkAdmin()
    }, [user])

    const fetchScores = async () => {
        setLoading(true)
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
            .order('created_at', { ascending: false })

        if (!error && data) {
            setScores(data as any)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        const { error } = await supabase
            .from('scores')
            .delete()
            .eq('id', id)

        if (!error) {
            setScores(scores.filter(s => s.id !== id))
        } else {
            alert('삭제 실패: ' + error.message)
        }
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
            <header className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-[22px] font-bold">경기 결과 관리</h2>
                    <p className="text-[#6B7684] text-[14px]">모든 선수의 점수를 수정하거나 삭제할 수 있습니다.</p>
                </div>
                {user?.email === SUPER_ADMIN_EMAIL && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">CHIEF ADMIN</span>
                )}
            </header>

            <div className="space-y-3">
                {scores.map((score) => (
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
