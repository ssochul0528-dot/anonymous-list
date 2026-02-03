'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Trophy, ArrowLeft, Save } from 'lucide-react'

export default function TournamentResultsPage() {
    const { id } = useParams()
    const router = useRouter()
    const { profile } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [tournament, setTournament] = useState<any | null>(null)
    const [bracket, setBracket] = useState<any | null>(null)
    const [allMembers, setAllMembers] = useState<any[]>([])
    const [winner1, setWinner1] = useState<string>('')
    const [winner2, setWinner2] = useState<string>('')
    const [awarding, setAwarding] = useState(false)

    useEffect(() => {
        const fetchTournament = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setTournament(data)
                setBracket(data.bracket_data)

                // Fetch members of this club
                const { data: members } = await supabase
                    .from('club_members')
                    .select('*, profiles(*)')
                    .eq('club_id', data.club_id)

                if (members) {
                    setAllMembers(members.map(m => ({
                        id: m.user_id,
                        name: m.profiles?.nickname || m.profiles?.real_name || 'Unknown'
                    })))
                }
            }
            setLoading(false)
        }
        if (id) fetchTournament()
    }, [id])

    const updateScore = (roundIdx: number, matchIdx: number, team: 'score1' | 'score2', value: string) => {
        const newBracket = { ...bracket }
        newBracket.rounds[roundIdx].matches[matchIdx][team] = value
        setBracket(newBracket)
    }

    const handleSaveResults = async () => {
        setSaving(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('tournaments')
            .update({ bracket_data: bracket })
            .eq('id', id)

        if (!error) {
            alert('경기 결과가 저장되었습니다.')
        } else {
            alert('저장 실패: ' + error.message)
        }
        setSaving(false)
    }

    const handleAward = async () => {
        if (!winner1 && !winner2) {
            alert('수상자를 선택해주세요.')
            return
        }
        setAwarding(true)
        const supabase = createClient()

        try {
            if (winner1) {
                const { data: p } = await supabase.from('profiles').select('badges').eq('id', winner1).single()
                const newBadges = [...(p?.badges || []), 'tournament_winner']
                await supabase.from('profiles').update({ badges: newBadges }).eq('id', winner1)
            }
            if (winner2) {
                const { data: p } = await supabase.from('profiles').select('badges').eq('id', winner2).single()
                const newBadges = [...(p?.badges || []), 'tournament_runnerup']
                await supabase.from('profiles').update({ badges: newBadges }).eq('id', winner2)
            }
            alert('시상이 완료되었습니다! 선수 카드에서 배지를 확인하실 수 있습니다.')
        } catch (err: any) {
            alert('시상 중 오류 발생: ' + err.message)
        } finally {
            setAwarding(false)
        }
    }

    if (loading) return <div className="p-10 text-center">Loading...</div>
    if (!tournament) return <div className="p-10 text-center">Tournament not found.</div>

    return (
        <div className="pt-2 pb-20 space-y-6 bg-[#F2F4F6] min-h-screen px-4">
            <header className="flex items-center justify-between pt-4 mb-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft size={18} />
                    </Button>
                    <h2 className="text-[20px] font-bold text-[#191F28] uppercase">Results: {tournament.name}</h2>
                </div>
                <Button onClick={handleSaveResults} isLoading={saving} size="sm" className="bg-[#0064FF] text-white rounded-full px-5">
                    <Save size={16} className="mr-2" /> 저장
                </Button>
            </header>

            <div className="space-y-8 overflow-x-auto pb-10">
                <div className="flex gap-10 min-w-max p-4">
                    {bracket.rounds.map((round: any, rIdx: number) => (
                        <div key={rIdx} className="w-72 flex flex-col gap-8">
                            <h4 className="text-center font-black text-[#8B95A1] text-[12px] tracking-widest italic">{round.label}</h4>

                            <div className="flex flex-col justify-around flex-1 gap-10">
                                {round.matches.map((match: any, mIdx: number) => (
                                    <div key={mIdx} className="bg-white rounded-[24px] shadow-sm border border-[#E5E8EB] overflow-hidden">
                                        {/* Team 1 */}
                                        <div className="p-4 border-b border-[#F2F4F6] flex justify-between items-center bg-[#F9FAFB]/50">
                                            <span className="text-[14px] font-bold text-[#333D4B] truncate mr-2">
                                                {Array.isArray(match.team1) ? match.team1.join(' / ') : (match.team1 || 'TBD')}
                                            </span>
                                            <input
                                                type="number"
                                                value={match.score1 || ''}
                                                onChange={(e) => updateScore(rIdx, mIdx, 'score1', e.target.value)}
                                                className="w-12 h-10 bg-white border border-[#E5E8EB] rounded-xl text-center font-black text-[16px] focus:border-[#0064FF] outline-none"
                                                placeholder="-"
                                            />
                                        </div>
                                        {/* Team 2 */}
                                        <div className="p-4 flex justify-between items-center">
                                            <span className="text-[14px] font-bold text-[#333D4B] truncate mr-2">
                                                {Array.isArray(match.team2) ? match.team2.join(' / ') : (match.team2 || 'TBD')}
                                            </span>
                                            <input
                                                type="number"
                                                value={match.score2 || ''}
                                                onChange={(e) => updateScore(rIdx, mIdx, 'score2', e.target.value)}
                                                className="w-12 h-10 bg-white border border-[#E5E8EB] rounded-xl text-center font-black text-[16px] focus:border-[#0064FF] outline-none"
                                                placeholder="-"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="space-y-6 pt-10 border-t border-[#E5E8EB]">
                <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} className="text-[#D4AF37]" />
                    <h3 className="font-bold text-[#191F28] uppercase italic tracking-tighter">Tournament Honors</h3>
                </div>

                <Card className="bg-white border-none shadow-sm space-y-4 p-6 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-wider">🥇 1st Place (Winner)</label>
                            <select
                                value={winner1}
                                onChange={(e) => setWinner1(e.target.value)}
                                className="w-full h-14 bg-[#F2F4F6] rounded-2xl px-4 outline-none border-2 border-transparent focus:border-[#D4AF37] font-bold text-[#191F28] appearance-none"
                            >
                                <option value="">선수 선택</option>
                                {allMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-wider">🥈 2nd Place (Runner-up)</label>
                            <select
                                value={winner2}
                                onChange={(e) => setWinner2(e.target.value)}
                                className="w-full h-14 bg-[#F2F4F6] rounded-2xl px-4 outline-none border-2 border-transparent focus:border-slate-400 font-bold text-[#191F28] appearance-none"
                            >
                                <option value="">선수 선택</option>
                                {allMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            fullWidth
                            onClick={handleAward}
                            isLoading={awarding}
                            disabled={!winner1 && !winner2}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-black py-4 rounded-2xl shadow-lg border-none"
                        >
                            우승/준우승 배정 및 배지 수여
                        </Button>
                        <p className="text-center text-[11px] text-[#8B95A1] mt-3 font-medium">배지를 수여하면 해당 선수의 카드에 영구적으로 표시됩니다.</p>
                    </div>
                </Card>
            </div>

            <div className="fixed bottom-6 left-4 right-4 z-50">
                <Button fullWidth onClick={handleSaveResults} isLoading={saving} className="h-14 rounded-[20px] bg-[#191F28] text-white font-bold text-[16px] shadow-xl">
                    경기 결과 최종 저장하기
                </Button>
            </div>
        </div>
    )
}
