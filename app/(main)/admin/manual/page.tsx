'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Profile {
    id: string
    nickname: string
}

export default function ManualMatchPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState<Profile[]>([])

    // Form State
    const [teamA1, setTeamA1] = useState('')
    const [teamA2, setTeamA2] = useState('')
    const [teamB1, setTeamB1] = useState('')
    const [teamB2, setTeamB2] = useState('')
    const [result, setResult] = useState<'A_WIN' | 'B_WIN' | 'DRAW'>('A_WIN')

    useEffect(() => {
        fetchProfiles()
    }, [])

    const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, nickname').order('nickname')
        if (data) setProfiles(data)
    }

    const handleSubmit = async () => {
        if (!teamA1 || !teamA2 || !teamB1 || !teamB2) {
            alert('모든 선수를 선택해주세요.')
            return
        }
        if (new Set([teamA1, teamA2, teamB1, teamB2]).size !== 4) {
            alert('중복된 선수가 있습니다.')
            return
        }

        setLoading(true)
        try {
            // Points Rule: Win=3, Draw=1, Loss=0.5
            const POINTS = {
                WIN: 3,
                DRAW: 1,
                LOSS: 0.5
            }

            const records = []

            // Team A
            records.push({
                user_id: teamA1,
                result: result === 'A_WIN' ? 'WIN' : result === 'DRAW' ? 'DRAW' : 'LOSS',
                points: result === 'A_WIN' ? POINTS.WIN : result === 'DRAW' ? POINTS.DRAW : POINTS.LOSS
            })
            records.push({
                user_id: teamA2,
                result: result === 'A_WIN' ? 'WIN' : result === 'DRAW' ? 'DRAW' : 'LOSS',
                points: result === 'A_WIN' ? POINTS.WIN : result === 'DRAW' ? POINTS.DRAW : POINTS.LOSS
            })

            // Team B
            records.push({
                user_id: teamB1,
                result: result === 'B_WIN' ? 'WIN' : result === 'DRAW' ? 'DRAW' : 'LOSS',
                points: result === 'B_WIN' ? POINTS.WIN : result === 'DRAW' ? POINTS.DRAW : POINTS.LOSS
            })
            records.push({
                user_id: teamB2,
                result: result === 'B_WIN' ? 'WIN' : result === 'DRAW' ? 'DRAW' : 'LOSS',
                points: result === 'B_WIN' ? POINTS.WIN : result === 'DRAW' ? POINTS.DRAW : POINTS.LOSS
            })

            const { error } = await supabase.from('scores').insert(records)
            if (error) throw error

            alert('경기 결과가 저장되었습니다.')
            // Reset form
            setTeamA1('')
            setTeamA2('')
            setTeamB1('')
            setTeamB2('')
            setResult('A_WIN')
        } catch (e: any) {
            console.error(e)
            alert('저장 실패: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-2 pb-20 space-y-6 bg-[#0A0E17] min-h-screen text-white">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    &lt; 뒤로
                </Button>
                <h2 className="text-[20px] font-bold">수기 경기 입력</h2>
            </div>

            <Card className="space-y-6 bg-[#121826] border-white/5 shadow-xl">
                <div>
                    <h3 className="font-bold text-white mb-4 text-center">Team A</h3>
                    <div className="space-y-3">
                        <PlayerSelect
                            value={teamA1}
                            onChange={setTeamA1}
                            profiles={profiles}
                            placeholder="선수 1 선택"
                        />
                        <PlayerSelect
                            value={teamA2}
                            onChange={setTeamA2}
                            profiles={profiles}
                            placeholder="선수 2 선택"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-center py-2 relative">
                    <div className="w-full h-[1px] bg-white/5 absolute" />
                    <span className="bg-[#121826] px-3 relative text-white/40 text-sm font-bold">VS</span>
                </div>

                <div>
                    <h3 className="font-bold text-white mb-4 text-center">Team B</h3>
                    <div className="space-y-3">
                        <PlayerSelect
                            value={teamB1}
                            onChange={setTeamB1}
                            profiles={profiles}
                            placeholder="선수 3 선택"
                        />
                        <PlayerSelect
                            value={teamB2}
                            onChange={setTeamB2}
                            profiles={profiles}
                            placeholder="선수 4 선택"
                        />
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                    <label className="block text-[13px] font-bold text-white/40 text-center">경기 결과</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setResult('A_WIN')}
                            className={`flex-1 py-3 rounded-[12px] font-bold transition-all ${result === 'A_WIN'
                                ? 'bg-[#0064FF] text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white/5 text-white/40'
                                }`}
                        >
                            A팀 승리
                        </button>
                        <button
                            onClick={() => setResult('DRAW')}
                            className={`flex-1 py-3 rounded-[12px] font-bold transition-all ${result === 'DRAW'
                                ? 'bg-white text-[#121826] shadow-lg'
                                : 'bg-white/5 text-white/40'
                                }`}
                        >
                            무승부
                        </button>
                        <button
                            onClick={() => setResult('B_WIN')}
                            className={`flex-1 py-3 rounded-[12px] font-bold transition-all ${result === 'B_WIN'
                                ? 'bg-[#F04452] text-white shadow-lg shadow-red-500/20'
                                : 'bg-white/5 text-white/40'
                                }`}
                        >
                            B팀 승리
                        </button>
                    </div>
                </div>

                <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading} className="mt-4">
                    {loading ? '저장 중...' : '결과 저장하기'}
                </Button>
            </Card>
        </div>
    )
}

function PlayerSelect({ value, onChange, profiles, placeholder }: any) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 bg-white/5 rounded-[12px] border-none outline-none focus:ring-2 focus:ring-[#CCFF00] text-white appearance-none"
        >
            <option value="">{placeholder}</option>
            {profiles.map((p: any) => (
                <option key={p.id} value={p.id}>
                    {p.nickname}
                </option>
            ))}
        </select>
    )
}
