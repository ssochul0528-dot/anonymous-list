
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

        // Shuffle participants for random seeding
        const shuffled = [...participants].sort(() => Math.random() - 0.5)

        // Create Teams (Pairs)
        const teams: string[][] = []
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                teams.push([shuffled[i], shuffled[i + 1]])
            } else {
                // Odd number of players handling (last one gets a random partner or bye)
                teams.push([shuffled[i], 'GUEST'])
            }
        }

        // Generate Tournament Rounds
        // 4 teams -> 2 rounds
        // 8 teams -> 3 rounds
        // etc (Power of 2 check)
        const teamCount = teams.length
        const totalRounds = Math.ceil(Math.log2(teamCount))
        const bracketSize = Math.pow(2, totalRounds)

        // Fill initial bracket with teams and byes
        const rounds = []
        let currentRoundTeams: any[] = [...teams]

        // Fill up with 'BYE' to reach nearest power of 2
        while (currentRoundTeams.length < bracketSize) {
            currentRoundTeams.push('BYE')
        }

        // Generate Round 1 pairs
        const round1Matches = []
        for (let i = 0; i < currentRoundTeams.length; i += 2) {
            round1Matches.push({
                team1: currentRoundTeams[i],
                team2: currentRoundTeams[i + 1],
                score1: null,
                score2: null,
                winner: null
            })
        }
        rounds.push({ label: '16강/8강 (예선)', matches: round1Matches })

        // Generate Subsequent Rounds (Empty placeholders)
        let matchCount = round1Matches.length / 2
        let roundLabelIdx = 0
        const labels = ['준준결승', '준결승', '결승']

        while (matchCount >= 1) {
            const roundMatches = []
            for (let i = 0; i < matchCount; i++) {
                roundMatches.push({
                    team1: null,
                    team2: null,
                    score1: null,
                    score2: null,
                    winner: null
                })
            }
            rounds.push({
                label: matchCount === 1 ? '결승' : (matchCount === 2 ? '준결승' : '준준결승'),
                matches: roundMatches
            })
            matchCount /= 2
        }

        setTournament({ rounds })
    }

    return (
        <div className="pt-2 pb-10 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    &lt; 뒤로
                </Button>
                <h2 className="text-[20px] font-bold">복식 토너먼트 생성</h2>
            </div>

            {!tournament ? (
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-bold mb-4">1. 설정</h3>
                        <div>
                            <label className="block text-[13px] text-[#6B7684] mb-2">사용 가능 코트 수</label>
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
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">2. 참가자 ({participants.length}명)</h3>
                        </div>

                        {allPlayers.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-[13px] text-[#6B7684] mb-3 font-medium text-xs">선수 선택</label>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#F9FAFB] rounded-[16px]">
                                    {allPlayers.map((player) => {
                                        const isSelected = participants.includes(player.name)
                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => togglePlayer(player.name)}
                                                className={`text-[13px] px-4 py-2 rounded-full border transition-all ${isSelected
                                                    ? "bg-[#0064FF] text-white border-[#0064FF] font-semibold"
                                                    : "bg-white text-[#4E5968] border-[#E5E8EB]"
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
                                    className="flex-1 bg-[#F9FAFB] h-11 px-4 rounded-[12px] outline-none"
                                />
                                <Button size="sm" onClick={addPlayer}>추가</Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F2F4F6] mt-4">
                            {participants.map((p, i) => (
                                <div key={i} className="bg-[#E8F3FF] text-[#0064FF] px-3 py-1.5 rounded-full text-[14px] flex items-center gap-1 font-semibold border border-[#D0E5FF]">
                                    {p}
                                    <button onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))}>×</button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Button fullWidth size="lg" onClick={generateTournament} disabled={participants.length < 4}>
                        토너먼트 대진표 생성
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="overflow-x-auto pb-6">
                        <div className="flex gap-8 min-w-max px-4">
                            {tournament.rounds.map((round: any, rIdx: number) => (
                                <div key={rIdx} className="flex flex-col gap-8 w-64">
                                    <h4 className="font-bold text-center text-[#6B7684] bg-[#F2F4F6] py-2 rounded-lg">{round.label}</h4>
                                    <div className="flex flex-col justify-around flex-1 gap-6">
                                        {round.matches.map((match: any, mIdx: number) => (
                                            <div key={mIdx} className="relative">
                                                <div className="bg-white border border-[#E5E8EB] rounded-xl overflow-hidden shadow-sm">
                                                    {/* Team 1 */}
                                                    <div className="p-3 border-b border-[#F2F4F6] flex justify-between items-center h-14">
                                                        <span className="text-[14px] font-medium text-[#333D4B]">
                                                            {Array.isArray(match.team1) ? match.team1.join('·') : (match.team1 || '???')}
                                                        </span>
                                                    </div>
                                                    {/* Team 2 */}
                                                    <div className="p-3 flex justify-between items-center h-14">
                                                        <span className="text-[14px] font-medium text-[#333D4B]">
                                                            {Array.isArray(match.team2) ? match.team2.join('·') : (match.team2 || '???')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Connector Lines (Pure CSS representation) */}
                                                {rIdx < tournament.rounds.length - 1 && (
                                                    <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-[#D1D6DB]" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 sticky bottom-4 px-4">
                        <Button variant="secondary" fullWidth onClick={() => setTournament(null)}>
                            다시 설정하기
                        </Button>
                        <Button fullWidth onClick={() => window.print()}>
                            대진표 출력/저장
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
