
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function TournamentGeneratorPage() {
    const router = useRouter()

    // Config State
    const [courtCount, setCourtCount] = useState(2)
    const [participants, setParticipants] = useState<string[]>([])
    const [allPlayers, setAllPlayers] = useState<{ id: string, name: string }[]>([])
    const [newPlayerName, setNewPlayerName] = useState('')

    // Result State
    const [tournament, setTournament] = useState<any | null>(null)

    useEffect(() => {
        const fetchPlayers = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('profiles')
                .select('id, real_name, nickname')
                .order('real_name', { ascending: true })

            if (!error && data) {
                setAllPlayers(data.map((p: any) => ({
                    id: p.id,
                    name: p.real_name || p.nickname || 'Unknown'
                })))
            }
        }
        fetchPlayers()
    }, [])

    const togglePlayer = (name: string) => {
        if (participants.includes(name)) {
            setParticipants(participants.filter(p => p !== name))
        } else {
            setParticipants([...participants, name])
        }
    }

    const addPlayer = () => {
        if (newPlayerName.trim()) {
            if (!participants.includes(newPlayerName.trim())) {
                setParticipants([...participants, newPlayerName.trim()])
            }
            setNewPlayerName('')
        }
    }

    const generateTournament = () => {
        if (participants.length < 4) {
            alert('복식 경기를 위해 최소 4명의 참가자가 필요합니다.')
            return
        }

        const shuffled = [...participants].sort(() => Math.random() - 0.5)

        const teams: string[][] = []
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                teams.push([shuffled[i], shuffled[i + 1]])
            } else {
                teams.push([shuffled[i], 'GUEST'])
            }
        }

        const teamCount = teams.length
        const totalRounds = Math.ceil(Math.log2(teamCount))
        const bracketSize = Math.pow(2, totalRounds)

        const rounds = []
        let currentRoundTeams: any[] = [...teams]

        while (currentRoundTeams.length < bracketSize) {
            currentRoundTeams.push('BYE')
        }

        const round1Matches = []
        for (let i = 0; i < currentRoundTeams.length; i += 2) {
            round1Matches.push({
                team1: currentRoundTeams[i],
                team2: currentRoundTeams[i + 1]
            })
        }
        rounds.push({ label: 'QUALIFIERS', matches: round1Matches })

        let matchCount = round1Matches.length / 2
        while (matchCount >= 1) {
            const roundMatches = []
            for (let i = 0; i < matchCount; i++) {
                roundMatches.push({
                    team1: null,
                    team2: null
                })
            }
            rounds.push({
                label: matchCount === 1 ? 'FINAL' : (matchCount === 2 ? 'SEMI-FINAL' : 'QUARTER-FINAL'),
                matches: roundMatches
            })
            matchCount /= 2
        }

        setTournament({ rounds })
    }

    return (
        <div className="pt-2 pb-10 space-y-6 bg-[#F2F4F6] min-h-screen px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-2 pt-4"
            >
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    &lt; 뒤로
                </Button>
                <h2 className="text-[22px] font-bold text-[#191F28]">TOURNAMENT BUILDER</h2>
            </motion.div>

            {!tournament ? (
                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <h3 className="font-bold mb-4 text-[#333D4B]">1. 경기 설정</h3>
                        <div>
                            <label className="block text-[13px] text-[#6B7684] mb-3">사용 가능 코트</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCourtCount(Math.max(1, courtCount - 1))}
                                    className="w-12 h-12 rounded-2xl bg-[#F2F4F6] flex items-center justify-center text-xl font-bold text-[#4E5968] active:scale-90 transition-transform"
                                >-</button>
                                <span className="text-[24px] font-bold w-8 text-center text-[#191F28]">{courtCount}</span>
                                <button
                                    onClick={() => setCourtCount(Math.min(10, courtCount + 1))}
                                    className="w-12 h-12 rounded-2xl bg-[#0064FF] text-white flex items-center justify-center text-xl font-bold active:scale-90 transition-transform shadow-lg shadow-blue-500/20"
                                >+</button>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-[#333D4B]">2. 참가자 선택 <span className="text-[#0062FF] ml-1">{participants.length}</span></h3>
                        </div>

                        {allPlayers.length > 0 && (
                            <div className="mb-8">
                                <label className="block text-[12px] font-bold text-[#8B95A1] mb-4 uppercase tracking-wider">Registered Players</label>
                                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-4 bg-[#F9FAFB] rounded-[24px] border border-[#F2F4F6]">
                                    {allPlayers.map((player: any) => {
                                        const isSelected = participants.includes(player.name)
                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => togglePlayer(player.name)}
                                                className={`text-[14px] px-5 py-2.5 rounded-full border transition-all duration-300 ${isSelected
                                                    ? "bg-[#0064FF] text-white border-[#0064FF] font-bold shadow-md scale-105"
                                                    : "bg-white text-[#4E5968] border-[#E5E8EB] hover:border-[#0064FF]/30"
                                                    }`}
                                            >
                                                {player.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <label className="block text-[12px] font-bold text-[#8B95A1] uppercase tracking-wider">Add Guest</label>
                            <div className="flex gap-2">
                                <input
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                                    placeholder="게스트 이름"
                                    className="flex-1 bg-[#F9FAFB] h-14 px-5 rounded-[18px] outline-none border-2 border-transparent focus:border-[#0064FF] transition-all text-[16px]"
                                />
                                <Button size="lg" onClick={addPlayer} className="px-8 rounded-[18px]">추가</Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[#F2F4F6]">
                            <AnimatePresence>
                                {participants.map((p: string, i: number) => (
                                    <motion.div
                                        key={p}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className="bg-[#E8F3FF] text-[#0064FF] px-4 py-2 rounded-xl text-[14px] flex items-center gap-2 font-bold border border-[#D0E5FF]"
                                    >
                                        {p}
                                        <button onClick={() => setParticipants(participants.filter((_, idx: number) => idx !== i))} className="hover:text-red-500">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {participants.length === 0 && (
                                <p className="text-[#8B95A1] text-[14px] italic py-4">선수를 선택하거나 게스트를 추가해주세요.</p>
                            )}
                        </div>
                    </Card>

                    <Button fullWidth size="lg" onClick={generateTournament} disabled={participants.length < 4} className="h-16 text-[18px] rounded-[24px] shadow-xl shadow-blue-500/30">
                        대진표 생성하기
                    </Button>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-[#191F28] rounded-[32px] p-6 md:p-10 overflow-x-auto shadow-2xl relative">
                        {/* Sports Background Pattern */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        <div className="flex gap-12 md:gap-20 min-w-max px-4 relative z-10">
                            {tournament.rounds.map((round: any, rIdx: number) => (
                                <div key={rIdx} className="flex flex-col gap-10 w-72">
                                    <div className="relative">
                                        <h4 className="font-black text-center text-white/40 text-[12px] uppercase tracking-[0.3em] mb-4 italic">
                                            ROUND {rIdx + 1}
                                        </h4>
                                        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-xl font-black text-[14px] shadow-lg border border-white/10 uppercase italic">
                                            {round.label}
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-around flex-1 gap-12">
                                        {round.matches.map((match: any, mIdx: number) => (
                                            <motion.div
                                                key={mIdx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: rIdx * 0.2 + mIdx * 0.05 }}
                                                className="relative group"
                                            >
                                                <div className="bg-[#2D3540] border border-white/5 rounded-[20px] overflow-hidden shadow-2xl hover:border-blue-500/50 transition-colors">
                                                    {/* Team 1 */}
                                                    <div className="p-4 border-b border-white/5 flex justify-between items-center h-16 bg-gradient-to-r from-transparent to-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-[12px]">T1</div>
                                                            <span className="text-[15px] font-bold text-white tracking-tight">
                                                                {Array.isArray(match.team1) ? match.team1.join(' / ') : (match.team1 || 'TBD')}
                                                            </span>
                                                        </div>
                                                        <div className="w-10 h-8 rounded-md bg-black/40 border border-white/10 flex items-center justify-center font-mono text-white/30 text-xs">--</div>
                                                    </div>
                                                    {/* Team 2 */}
                                                    <div className="p-4 flex justify-between items-center h-16">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-[12px]">T2</div>
                                                            <span className="text-[15px] font-bold text-white tracking-tight">
                                                                {Array.isArray(match.team2) ? match.team2.join(' / ') : (match.team2 || 'TBD')}
                                                            </span>
                                                        </div>
                                                        <div className="w-10 h-8 rounded-md bg-black/40 border border-white/10 flex items-center justify-center font-mono text-white/30 text-xs">--</div>
                                                    </div>
                                                </div>

                                                {/* Sophisticated Connector Lines */}
                                                {rIdx < tournament.rounds.length - 1 && (
                                                    <>
                                                        <div className="absolute top-1/2 -right-12 md:-right-20 w-12 md:w-20 h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent group-hover:from-blue-500 transition-all" />
                                                        {/* Vertical bar for pairing */}
                                                        {mIdx % 2 === 0 ? (
                                                            <div className="absolute top-1/2 -right-12 md:-right-20 w-[2px] h-[72px] bg-white/10 group-hover:bg-blue-500/50 transition-all translate-x-12 translate-y-0 md:translate-x-20" />
                                                        ) : (
                                                            <div className="absolute bottom-1/2 -right-12 md:-right-20 w-[2px] h-[72px] bg-white/10 group-hover:bg-blue-500/50 transition-all translate-x-12 translate-y-0 md:translate-x-20" />
                                                        )}
                                                    </>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 sticky bottom-6 px-2">
                        <Button variant="secondary" fullWidth onClick={() => setTournament(null)} className="h-16 rounded-[20px] bg-white border-2 border-[#E5E8EB] text-[#333D4B] font-bold text-[16px]">
                            RESET BRACKET
                        </Button>
                        <Button fullWidth onClick={() => window.print()} className="h-16 rounded-[20px] bg-[#0064FF] text-white font-black text-[16px] shadow-xl shadow-blue-500/30">
                            DOWNLOAD / PRINT
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

