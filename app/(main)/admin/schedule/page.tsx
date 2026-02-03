'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { getAttendanceTargetDate } from '@/utils/attendance'

// Initial List for manual input or selection (Mock for MVP)
const MOCK_PLAYERS = [
    "수철", "본균", "단우", "효범",
    "요한", "승환", "정우", "종현",
    "호준", "상혁", "민수", "영호"
]

export default function ScheduleGeneratorPage() {
    const router = useRouter()
    // Config State
    const [courtCount, setCourtCount] = useState(2)
    const [roundCount, setRoundCount] = useState(4)
    const [participants, setParticipants] = useState<string[]>([])
    const [allPlayers, setAllPlayers] = useState<{ id: string, name: string, attended?: boolean, preferred_time?: string }[]>([])

    // Input State
    const [newPlayerName, setNewPlayerName] = useState('')

    // Result State
    const [schedule, setSchedule] = useState<any[] | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const targetDate = getAttendanceTargetDate().toISOString().split('T')[0]

            // Fetch all players
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, real_name, nickname')
                .order('real_name', { ascending: true })

            // Fetch attendance for the target date
            const { data: attendance } = await supabase
                .from('attendance')
                .select('user_id, status, preferred_time')
                .eq('target_date', targetDate)

            if (profiles) {
                const attendanceMap = new Map(attendance?.map(a => [a.user_id, a]) || [])

                setAllPlayers(profiles.map((p: any) => ({
                    id: p.id,
                    name: p.real_name || p.nickname || 'Unknown',
                    attended: attendanceMap.get(p.id)?.status === 'ATTEND',
                    preferred_time: attendanceMap.get(p.id)?.preferred_time
                })))
            }
        }
        fetchData()
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
            setParticipants([...participants, newPlayerName.trim()])
            setNewPlayerName('')
        }
    }

    const addMockPlayers = () => {
        setParticipants(MOCK_PLAYERS)
    }

    const generateSchedule = () => {
        if (participants.length < 4) {
            alert('최소 4명의 참가자가 필요합니다.')
            return
        }

        const newSchedule = []
        const playerCountNeededPerRound = courtCount * 4

        // Track partner and opponent history during this generation
        const partnerHistory: Record<string, Set<string>> = {}
        const opponentHistory: Record<string, Set<string>> = {}

        participants.forEach(p => {
            partnerHistory[p] = new Set()
            opponentHistory[p] = new Set()
        })

        for (let r = 1; r <= roundCount; r++) {
            let roundMatches: any[] = []
            let waiting: string[] = []
            let success = false

            // Try shuffling and pairing multiple times to find a good mix
            for (let retry = 0; retry < 100; retry++) {
                const shuffled = [...participants].sort(() => Math.random() - 0.5)
                const playing = shuffled.slice(0, playerCountNeededPerRound)
                const currentWaiting = shuffled.slice(playerCountNeededPerRound)

                const tempMatches = []
                let roundScore = 0
                let hasPartnerRepeat = false

                for (let c = 0; c < courtCount; c++) {
                    if (playing.length < (c * 4) + 4) break;

                    const p = playing.slice(c * 4, c * 4 + 4)
                    const options = [
                        { teamA: [p[0], p[1]], teamB: [p[2], p[3]] },
                        { teamA: [p[0], p[2]], teamB: [p[1], p[3]] },
                        { teamA: [p[0], p[3]], teamB: [p[1], p[2]] }
                    ]

                    const scoredOptions = options.map(opt => {
                        let s = 0
                        if (partnerHistory[opt.teamA[0]].has(opt.teamA[1])) s += 100
                        if (partnerHistory[opt.teamB[0]].has(opt.teamB[1])) s += 100

                        opt.teamA.forEach(ta => opt.teamB.forEach(tb => {
                            if (opponentHistory[ta].has(tb)) s += 1
                        }))
                        return { ...opt, score: s }
                    })

                    scoredOptions.sort((a, b) => a.score - b.score)
                    const best = scoredOptions[0]

                    if (best.score >= 100) hasPartnerRepeat = true
                    roundScore += best.score

                    tempMatches.push({
                        court: String.fromCharCode(65 + c),
                        teamA: best.teamA,
                        teamB: best.teamB
                    })
                }

                // If we found a round with no partner repeats, or we've tried enough
                if (!hasPartnerRepeat || retry === 99) {
                    roundMatches = tempMatches
                    waiting = currentWaiting
                    success = true
                    break
                }
            }

            // Record the matches into history
            roundMatches.forEach(m => {
                partnerHistory[m.teamA[0]].add(m.teamA[1])
                partnerHistory[m.teamA[1]].add(m.teamA[0])
                partnerHistory[m.teamB[0]].add(m.teamB[1])
                partnerHistory[m.teamB[1]].add(m.teamB[0])

                m.teamA.forEach((ta: string) => m.teamB.forEach((tb: string) => {
                    opponentHistory[ta].add(tb); opponentHistory[tb].add(ta);
                }))
            })

            newSchedule.push({ round: r, matches: roundMatches, waiting })
        }

        setSchedule(newSchedule)
    }

    const copyToClipboard = () => {
        if (!schedule) return

        let text = `[금일 경기 스케줄]\n\n`
        schedule.forEach((s) => {
            text += `${s.round}라운드\n`
            s.matches.forEach((m: any) => {
                text += ` ${m.court}코트: ${m.teamA.join('·')} vs ${m.teamB.join('·')}\n`
            })
            if (s.waiting.length > 0) {
                text += ` (대기): ${s.waiting.join(', ')}\n`
            }
            text += `\n`
        })

        navigator.clipboard.writeText(text)
        alert('복사되었습니다!')
    }

    return (
        <div className="pt-2 pb-10 space-y-6 bg-[#0A0E17] min-h-screen px-4 font-sans text-white">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-2 pt-4"
            >
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        &lt; 뒤로
                    </Button>
                    <h2 className="text-[22px] font-black uppercase italic tracking-tight">SCHEDULE BUILDER</h2>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push('/admin/manual')}
                    className="text-[12px] opacity-60"
                >
                    수기입력 &gt;
                </Button>
            </motion.div>

            {!schedule ? (
                <div className="space-y-6">
                    <Card className="bg-[#121826] border-white/5 shadow-sm">
                        <h3 className="font-bold mb-6 text-white">1. 경기 환경 설정</h3>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[12px] font-bold text-white/40 mb-3 uppercase tracking-wider">코트 수</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setCourtCount(Math.max(1, courtCount - 1))}
                                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold text-white active:scale-90 transition-transform border border-white/10"
                                    >-</button>
                                    <span className="text-[24px] font-bold w-10 text-center">{courtCount}</span>
                                    <button
                                        onClick={() => setCourtCount(Math.min(10, courtCount + 1))}
                                        className="w-12 h-12 rounded-2xl bg-[#333D4B] text-white flex items-center justify-center text-xl font-bold active:scale-90 transition-transform shadow-lg"
                                    >+</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-bold text-white/40 mb-3 uppercase tracking-wider">라운드 수</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setRoundCount(Math.max(1, roundCount - 1))}
                                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl font-bold text-white active:scale-90 transition-transform border border-white/10"
                                    >-</button>
                                    <span className="text-[24px] font-bold w-10 text-center">{roundCount}</span>
                                    <button
                                        onClick={() => setRoundCount(Math.min(10, roundCount + 1))}
                                        className="w-12 h-12 rounded-2xl bg-[#333D4B] text-white flex items-center justify-center text-xl font-bold active:scale-90 transition-transform shadow-lg"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#121826] border-white/5 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white">2. 참가 선수 <span className="text-[#CCFF00] ml-1">{participants.length}</span></h3>
                            {allPlayers.length === 0 && (
                                <button onClick={addMockPlayers} className="text-[12px] text-[#0064FF] font-bold">
                                    MOCK 불러오기
                                </button>
                            )}
                        </div>

                        {allPlayers.length > 0 && (
                            <div className="mb-8">
                                <label className="block text-[12px] font-bold text-white/40 mb-4 uppercase tracking-wider">Registered Selection</label>
                                <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto p-5 bg-white/5 rounded-[28px] border border-white/5">
                                    {allPlayers.map((player: any) => {
                                        const isSelected = participants.includes(player.name)
                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => togglePlayer(player.name)}
                                                className={`text-[14px] px-5 py-2.5 rounded-full border transition-all duration-300 flex items-center gap-2 ${isSelected
                                                    ? "bg-[#CCFF00] text-[#0A0E17] border-[#CCFF00] font-black shadow-lg scale-105"
                                                    : "bg-white/5 text-white/60 border-white/10 hover:border-[#CCFF00]/30"
                                                    }`}
                                            >
                                                {player.name}
                                                {player.attended && (
                                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'} animate-pulse`} />
                                                )}
                                                {player.preferred_time && !isSelected && (
                                                    <span className="text-[10px] opacity-50 font-bold ml-1">{player.preferred_time.split(':')[0]}시</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <label className="block text-[12px] font-bold text-white/40 uppercase tracking-wider">Add Guest</label>
                            <div className="flex gap-2">
                                <input
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                                    placeholder="이름 입력"
                                    className="flex-1 bg-white/5 h-14 px-5 rounded-[18px] outline-none border-2 border-transparent focus:border-[#CCFF00] transition-all text-[16px] text-white placeholder:text-white/20"
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
                                        <button onClick={() => setParticipants(participants.filter((_: any, idx: number) => idx !== i))} className="hover:text-red-500">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {participants.length === 0 && (
                                <p className="text-[#8B95A1] text-[14px] italic py-4">참가자를 선택해주세요.</p>
                            )}
                        </div>
                    </Card>

                    <Button fullWidth size="lg" onClick={generateSchedule} disabled={participants.length < 4} className="h-16 text-[18px] rounded-[24px] shadow-xl shadow-blue-500/30">
                        랜덤 스케줄 생성
                    </Button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-[#191F28] rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <h3 className="text-white font-black italic text-[20px]">MATCH DAY</h3>
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-widest animate-pulse">LIVE</div>
                            </div>

                            <div className="grid gap-6">
                                {schedule.map((round: any, rIdx: number) => (
                                    <motion.div
                                        key={round.round}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: rIdx * 0.1 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-blue-500 font-black italic text-[14px]">RD.{round.round}</span>
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                        </div>

                                        <div className="grid gap-3">
                                            {round.matches.map((m: any, idx: number) => (
                                                <div key={idx} className="bg-[#2D3540] rounded-[20px] p-4 flex items-center justify-between border border-white/5 group hover:border-blue-500/50 transition-colors">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-blue-400 font-black text-[10px] uppercase">{m.court} COURT</span>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-white font-bold text-[15px]">{m.teamA.join(' / ')}</span>
                                                            <span className="text-white/20 italic font-black text-[12px]">VS</span>
                                                            <span className="text-white font-bold text-[15px]">{m.teamB.join(' / ')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {round.waiting.length > 0 && (
                                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                                <p className="text-white/40 text-[11px] font-bold uppercase tracking-tighter mb-1 select-none">Waiting Players</p>
                                                <p className="text-white/80 text-[13px] font-medium">{round.waiting.join(', ')}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 sticky bottom-6">
                        <Button variant="secondary" fullWidth onClick={() => setSchedule(null)} className="h-16 rounded-[20px] bg-white border-2 border-[#E5E8EB] text-[#333D4B] font-bold">
                            다시 설정하기
                        </Button>
                        <Button fullWidth onClick={copyToClipboard} className="h-16 rounded-[20px] bg-[#0064FF] text-white font-black shadow-xl shadow-blue-500/30">
                            텍스트 복사
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
