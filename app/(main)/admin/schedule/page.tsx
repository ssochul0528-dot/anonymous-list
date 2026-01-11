
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    const [allPlayers, setAllPlayers] = useState<{ id: string, name: string }[]>([])

    // Input State
    const [newPlayerName, setNewPlayerName] = useState('')

    // Result State
    const [schedule, setSchedule] = useState<any[] | null>(null)

    useEffect(() => {
        const fetchPlayers = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('profiles')
                .select('id, real_name, nickname')
                .order('real_name', { ascending: true })

            if (!error && data) {
                setAllPlayers(data.map(p => ({
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

        // Simple Random Logic (Stateless per round for MVP, usually you want balanced)
        // For this MVP, we just shuffle and assign.

        for (let r = 1; r <= roundCount; r++) {
            // Shuffle participants
            const shuffled = [...participants].sort(() => Math.random() - 0.5)

            const playing = shuffled.slice(0, playerCountNeededPerRound)
            const waiting = shuffled.slice(playerCountNeededPerRound)

            const matches = []
            for (let c = 0; c < courtCount; c++) {
                if (playing.length < (c * 4) + 4) break; // Safety check

                const p1 = playing[c * 4]
                const p2 = playing[c * 4 + 1]
                const p3 = playing[c * 4 + 2]
                const p4 = playing[c * 4 + 3]

                matches.push({
                    court: String.fromCharCode(65 + c), // 'A', 'B', 'C'
                    teamA: [p1, p2],
                    teamB: [p3, p4]
                })
            }

            newSchedule.push({
                round: r,
                matches,
                waiting
            })
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
        <div className="pt-2 pb-10 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        &lt; 뒤로
                    </Button>
                    <h2 className="text-[20px] font-bold">스케줄 생성 (ADMIN)</h2>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push('/admin/manual')}
                    className="text-[12px]"
                >
                    수기 입력 &gt;
                </Button>
            </div>

            {/* Step 1: Configuration */}
            {!schedule && (
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-bold mb-4">1. 설정</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[13px] text-[#6B7684] mb-2">코트 수 (1~10)</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCourtCount(Math.max(1, courtCount - 1))}
                                        className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center text-lg font-bold"
                                    >-</button>
                                    <span className="text-[20px] font-bold w-8 text-center">{courtCount}</span>
                                    <button
                                        onClick={() => setCourtCount(Math.min(10, courtCount + 1))}
                                        className="w-10 h-10 rounded-full bg-[#333D4B] text-white flex items-center justify-center text-lg font-bold"
                                    >+</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#6B7684] mb-2">라운드 수 (1~10)</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setRoundCount(Math.max(1, roundCount - 1))}
                                        className="w-10 h-10 rounded-full bg-[#F2F4F6] flex items-center justify-center text-lg font-bold"
                                    >-</button>
                                    <span className="text-[20px] font-bold w-8 text-center">{roundCount}</span>
                                    <button
                                        onClick={() => setRoundCount(Math.min(10, roundCount + 1))}
                                        className="w-10 h-10 rounded-full bg-[#333D4B] text-white flex items-center justify-center text-lg font-bold"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">2. 참가자 ({participants.length}명)</h3>
                            {allPlayers.length === 0 && (
                                <button onClick={addMockPlayers} className="text-[12px] text-[#0064FF] underline">
                                    기본 명단 불러오기
                                </button>
                            )}
                        </div>

                        {/* Registered Players Selection */}
                        {allPlayers.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-[13px] text-[#6B7684] mb-3 font-medium text-xs">등록된 선수 선택 (클릭하여 추가/제외)</label>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#F9FAFB] rounded-[16px] border border-[#F2F4F6]">
                                    {allPlayers.map((player) => {
                                        const isSelected = participants.includes(player.name)
                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => togglePlayer(player.name)}
                                                className={`text-[13px] px-4 py-2 rounded-full border transition-all duration-200 ${isSelected
                                                    ? "bg-[#0064FF] text-white border-[#0064FF] font-semibold shadow-sm"
                                                    : "bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]"
                                                    }`}
                                            >
                                                {player.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="block text-[13px] text-[#6B7684] font-medium text-xs">직접 입력 (게스트)</label>
                            <div className="flex gap-2">
                                <input
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                                    placeholder="이름 입력"
                                    className="flex-1 bg-[#F9FAFB] h-11 px-4 rounded-[12px] outline-none border border-transparent focus:border-[#0064FF] transition-all text-[15px]"
                                />
                                <Button size="sm" onClick={addPlayer} className="h-11 px-6">추가</Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F2F4F6] mt-4 capitalize">
                            <span className="w-full text-[12px] text-[#8B95A1] mb-1">현재 명단:</span>
                            {participants.map((p, i) => (
                                <div key={i} className="bg-[#E8F3FF] text-[#0064FF] px-3 py-1.5 rounded-full text-[14px] flex items-center gap-1 font-semibold border border-[#D0E5FF]">
                                    {p}
                                    <button onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors ml-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            {participants.length === 0 && (
                                <p className="text-[#8B95A1] text-[13px] py-2 italic">참가자를 선택하거나 이름을 직접 추가해주세요.</p>
                            )}
                        </div>
                    </Card>

                    <Button fullWidth size="lg" onClick={generateSchedule} disabled={participants.length < 4}>
                        스케줄 생성하기
                    </Button>
                </div>
            )}

            {/* Step 2: Result */}
            {schedule && (
                <div className="space-y-4">
                    <Card className="bg-[#FFF9E5] border-none">
                        <p className="text-[14px] text-center font-bold text-orange-800">
                            🔥 총 {roundCount}라운드 / 코트 {courtCount}면
                        </p>
                    </Card>

                    {schedule.map((round: any) => (
                        <Card key={round.round} padding="sm" className="relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#0064FF]" />
                            <h4 className="font-bold text-[16px] mb-3 ml-2">{round.round}라운드</h4>

                            <div className="space-y-2 ml-2">
                                {round.matches.map((m: any, idx: number) => (
                                    <div key={idx} className="flex items-center text-[15px]">
                                        <span className="w-14 font-bold text-[#333D4B]">{m.court}코트</span>
                                        <span className="flex-1">
                                            <span className="font-medium text-black">{m.teamA[0]}·{m.teamA[1]}</span>
                                            <span className="mx-2 text-gray-400">vs</span>
                                            <span className="font-medium text-black">{m.teamB[0]}·{m.teamB[1]}</span>
                                        </span>
                                    </div>
                                ))}
                                {round.waiting.length > 0 && (
                                    <div className="mt-3 text-[13px] text-[#8B95A1] pt-2 border-t border-gray-100">
                                        (대기) {round.waiting.join(', ')}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}

                    <div className="flex gap-2 sticky bottom-4">
                        <Button variant="secondary" fullWidth onClick={() => setSchedule(null)}>
                            다시하기
                        </Button>
                        <Button fullWidth onClick={copyToClipboard}>
                            텍스트 복사
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
