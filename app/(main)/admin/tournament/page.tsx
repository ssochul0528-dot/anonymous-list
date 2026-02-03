'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getAttendanceTargetDate } from '@/utils/attendance'

export default function TournamentGeneratorPage() {
    const router = useRouter()
    const { profile } = useAuth()
    const [saving, setSaving] = useState(false)
    const [tournamentName, setTournamentName] = useState('')
    const [myClubSlug, setMyClubSlug] = useState<string | null>(null)

    // Config State
    const [courtCount, setCourtCount] = useState(2)
    const [gameType, setGameType] = useState<'SINGLES' | 'DOUBLES'>('DOUBLES')
    const [assignmentMode, setAssignmentMode] = useState<'RANDOM' | 'MANUAL'>('RANDOM')
    const [manualTeams, setManualTeams] = useState<any[]>([])

    const [participants, setParticipants] = useState<string[]>([])
    const [currentTeamBuilding, setCurrentTeamBuilding] = useState<string[]>([])

    const toggleManualTeam = (name: string) => {
        if (gameType === 'SINGLES') {
            if (manualTeams.includes(name)) {
                setManualTeams(manualTeams.filter(t => t !== name))
            } else {
                setManualTeams([...manualTeams, name])
            }
        } else {
            if (currentTeamBuilding.includes(name)) {
                setCurrentTeamBuilding(currentTeamBuilding.filter(n => n !== name))
            } else if (manualTeams.some(t => t.includes(name))) {
                setManualTeams(manualTeams.filter(t => !t.includes(name)))
            } else {
                if (currentTeamBuilding.length === 1) {
                    setManualTeams([...manualTeams, [currentTeamBuilding[0], name]])
                    setCurrentTeamBuilding([])
                } else {
                    setCurrentTeamBuilding([name])
                }
            }
        }
    }

    const [allPlayers, setAllPlayers] = useState<{ id: string, name: string, attended?: boolean, preferred_time?: string }[]>([])
    const [newPlayerName, setNewPlayerName] = useState('')

    useEffect(() => {
        setManualTeams([])
        setCurrentTeamBuilding([])
    }, [gameType, assignmentMode])

    // Result State
    const [tournament, setTournament] = useState<any | null>(null)

    useEffect(() => {
        const fetchClub = async () => {
            if (profile?.club_id) {
                const supabase = createClient()
                const { data } = await supabase.from('clubs').select('slug').eq('id', profile.club_id).maybeSingle()
                if (data) setMyClubSlug(data.slug)
            }
        }
        fetchClub()
    }, [profile?.club_id])

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
            if (!participants.includes(newPlayerName.trim())) {
                setParticipants([...participants, newPlayerName.trim()])
            }
            setNewPlayerName('')
        }
    }

    const generateTournament = () => {
        const minParticipants = gameType === 'SINGLES' ? 2 : 4
        if (participants.length < minParticipants) {
            alert(`${gameType === 'SINGLES' ? '단식' : '복식'} 경기를 위해 최소 ${minParticipants}명의 참가자가 필요합니다.`)
            return
        }

        let teams: any[] = []

        if (assignmentMode === 'RANDOM') {
            const shuffled = [...participants].sort(() => Math.random() - 0.5)
            if (gameType === 'SINGLES') {
                teams = shuffled.map(p => p)
            } else {
                for (let i = 0; i < shuffled.length; i += 2) {
                    if (i + 1 < shuffled.length) {
                        teams.push([shuffled[i], shuffled[i + 1]])
                    } else {
                        teams.push([shuffled[i], 'GUEST'])
                    }
                }
            }
        } else {
            // MANUAL mode
            if (manualTeams.length === 0) {
                alert('수동 배정에서는 팀을 먼저 구성해야 합니다.')
                return
            }
            teams = [...manualTeams]
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

    const handleSave = async () => {
        if (!tournamentName) {
            alert('대회 이름을 입력해주세요.')
            return
        }
        if (!profile?.club_id) {
            alert('클럽 정보를 찾을 수 없습니다. 다시 시도해주세요.')
            console.log('Profile missing club_id:', profile)
            return
        }

        setSaving(true)
        const supabase = createClient()
        console.log('Attempting to save tournament:', {
            club_id: profile.club_id,
            name: tournamentName
        })

        try {
            const { error } = await supabase.from('tournaments').insert({
                club_id: profile.club_id,
                name: tournamentName,
                bracket_data: tournament
            })

            if (!error) {
                alert('대회가 성공적으로 저장되었습니다!')
                router.push(`/clubs/${myClubSlug || profile.club_id}`)
            } else {
                console.error('Save error:', error)
                if (error.code === '42P01') {
                    alert('데이터베이스에 tournaments 테이블이 존재하지 않습니다. 마이그레이션을 실행해주세요.')
                } else if (error.code === '42501') {
                    alert('권한이 없습니다. 클럽 관리자 계정인지 확인해주세요. (RLS 오류)')
                } else {
                    alert(`저장 실패 (${error.code}): ${error.message}`)
                }
            }
        } catch (err: any) {
            console.error('Unexpected error:', err)
            alert('저장 중 알 수 없는 오류가 발생했습니다: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="pt-2 pb-10 space-y-6 bg-[#F2F4F6] min-h-screen px-4">
            <style jsx global>{`
                @media print {
                    .no-print, header, nav, .sticky { display: none !important; }
                    body, .bg-[#F2F4F6], .min-h-screen { background: white !important; color: black !important; padding: 0 !important; }
                    .bg-[#191F28] { background: white !important; border: 2px solid #000 !important; border-radius: 0 !important; padding: 0 !important; width: 100% !important; }
                    .text-white { color: black !important; }
                    .text-white\/40, .text-white\/30 { color: #666 !important; }
                    .bg-[#2D3540] { background: white !important; border: 1px solid #ddd !important; border-radius: 8px !important; }
                    .border-white\/5 { border-color: #eee !important; }
                    .bg-blue-500\/20, .bg-indigo-500\/20 { background: #f0f0f0 !important; border: 1px solid #ccc !important; }
                    .text-blue-400, .text-indigo-400 { color: black !important; font-weight: 900 !important; }
                    .shadow-2xl, .shadow-xl { shadow: none !important; box-shadow: none !important; }
                    .bg-gradient-to-r { background: #eee !important; }
                    .rounded-\[32px\], .rounded-\[20px\] { border-radius: 8px !important; }
                }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-2 pt-4 no-print"
            >
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[#191F28] hover:bg-black/5">
                    &lt; 뒤로
                </Button>
                <h2 className="text-[22px] font-black tracking-tighter text-[#191F28] italic">TOURNAMENT <span className="text-[#0064FF]">BUILDER</span></h2>
            </motion.div>

            {!tournament ? (
                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <h3 className="font-bold mb-4 text-[#333D4B]">0. 대회 정보</h3>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-[#8B95A1] uppercase">Tournament Name</label>
                            <input
                                type="text"
                                value={tournamentName}
                                onChange={(e) => setTournamentName(e.target.value)}
                                placeholder="예: 2026 부천테니스 월례대회"
                                className="w-full bg-[#F9FAFB] h-14 px-5 rounded-[18px] outline-none border-2 border-transparent focus:border-[#0064FF] transition-all text-[16px] text-[#191F28] font-bold"
                            />
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm space-y-6">
                        <h3 className="font-bold mb-4 text-[#333D4B]">1. 경기 설정</h3>

                        <div className="space-y-3">
                            <label className="block text-[13px] text-[#6B7684]">경기 방식</label>
                            <div className="grid grid-cols-2 gap-2 bg-[#F2F4F6] p-1 rounded-2xl">
                                <button
                                    onClick={() => setGameType('SINGLES')}
                                    className={`py-3 rounded-xl font-bold text-[14px] transition-all ${gameType === 'SINGLES' ? 'bg-white shadow-sm text-[#0064FF]' : 'text-[#8B95A1]'}`}
                                >개인전 (단식)</button>
                                <button
                                    onClick={() => setGameType('DOUBLES')}
                                    className={`py-3 rounded-xl font-bold text-[14px] transition-all ${gameType === 'DOUBLES' ? 'bg-white shadow-sm text-[#0064FF]' : 'text-[#8B95A1]'}`}
                                >팀전 (복식)</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[13px] text-[#6B7684]">대진 방식</label>
                            <div className="grid grid-cols-2 gap-2 bg-[#F2F4F6] p-1 rounded-2xl">
                                <button
                                    onClick={() => setAssignmentMode('RANDOM')}
                                    className={`py-3 rounded-xl font-bold text-[14px] transition-all ${assignmentMode === 'RANDOM' ? 'bg-white shadow-sm text-[#0064FF]' : 'text-[#8B95A1]'}`}
                                >랜덤 배정</button>
                                <button
                                    onClick={() => setAssignmentMode('MANUAL')}
                                    className={`py-3 rounded-xl font-bold text-[14px] transition-all ${assignmentMode === 'MANUAL' ? 'bg-white shadow-sm text-[#0064FF]' : 'text-[#8B95A1]'}`}
                                >수동 배정/시드</button>
                            </div>
                        </div>

                        <div className="pt-2">
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
                                <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto p-5 bg-[#F9FAFB] rounded-[28px] border border-[#F2F4F6]">
                                    {allPlayers.map((player: any) => {
                                        const isSelected = participants.includes(player.name)
                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setParticipants(participants.filter(p => p !== player.name))
                                                        // Sync manual teams
                                                        setManualTeams(manualTeams.filter(t => Array.isArray(t) ? !t.includes(player.name) : t !== player.name))
                                                        setCurrentTeamBuilding(currentTeamBuilding.filter(n => n !== player.name))
                                                    } else {
                                                        setParticipants([...participants, player.name])
                                                    }
                                                }}
                                                className={`text-[14px] px-5 py-2.5 rounded-full border transition-all duration-300 flex items-center gap-2 ${isSelected
                                                    ? "bg-[#0064FF] text-white border-[#0064FF] font-black shadow-lg scale-105"
                                                    : "bg-white text-[#4E5968] border-[#E5E8EB] hover:border-[#0064FF]/30"
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
                            <label className="block text-[12px] font-bold text-[#8B95A1] uppercase tracking-wider">Add Guest</label>
                            <div className="flex gap-2">
                                <input
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                                    placeholder="게스트 이름"
                                    className="flex-1 bg-[#F9FAFB] h-14 px-5 rounded-[18px] outline-none border-2 border-transparent focus:border-[#0064FF] transition-all text-[16px] text-[#191F28] font-bold"
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
                                        <button onClick={() => {
                                            setParticipants(participants.filter((_, idx: number) => idx !== i))
                                            setManualTeams(manualTeams.filter(t => Array.isArray(t) ? !t.includes(p) : t !== p))
                                            setCurrentTeamBuilding(currentTeamBuilding.filter(n => n !== p))
                                        }} className="hover:text-red-500">
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

                    {assignmentMode === 'MANUAL' && participants.length > 0 && (
                        <Card className="border-2 border-[#0064FF]/20 bg-[#F0F7FF] shadow-none space-y-4">
                            <h3 className="font-bold text-[#0064FF]">3. 팀 구성 (수동 배정)</h3>
                            <p className="text-[12px] text-[#6B7684]">
                                {gameType === 'SINGLES'
                                    ? '선수를 클릭하여 대진표에 참여시킬 팀(1인)으로 확정하세요.'
                                    : '두 명의 선수를 차례로 클릭하여 한 팀으로 묶으세요.'}
                            </p>

                            {currentTeamBuilding.length > 0 && (
                                <div className="p-3 bg-white rounded-xl border border-[#0064FF]/30 flex items-center justify-between">
                                    <span className="text-[14px] font-bold text-[#0064FF]">구성 중인 팀: {currentTeamBuilding.join(' & ')}</span>
                                    <button onClick={() => setCurrentTeamBuilding([])} className="text-[#8B95A1] text-[12px] underline">취소</button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {participants.map(name => {
                                    const isInTeam = manualTeams.some(t => Array.isArray(t) ? t.includes(name) : t === name)
                                    const isBeingBuilt = currentTeamBuilding.includes(name)

                                    return (
                                        <button
                                            key={name}
                                            disabled={isInTeam}
                                            onClick={() => toggleManualTeam(name)}
                                            className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all ${isInTeam ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50' :
                                                isBeingBuilt ? 'bg-[#0064FF] text-white border-[#0064FF] shadow-sm' :
                                                    'bg-white text-[#4E5968] border-[#E5E8EB] hover:border-[#0064FF]'
                                                }`}
                                        >
                                            {name}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="pt-4 border-t border-[#0064FF]/10">
                                <label className="text-[11px] font-bold text-[#8B95A1] uppercase mb-2 block">구성된 팀/선수 목록 ({manualTeams.length})</label>
                                {manualTeams.length === 0 && <p className="text-[12px] italic text-[#8B95A1] py-2">아직 구성된 팀이 없습니다.</p>}
                                <div className="grid grid-cols-2 gap-2">
                                    {manualTeams.map((team, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-[#E5E8EB] flex justify-between items-center shadow-sm">
                                            <span className="text-[13px] font-bold text-[#333D4B]">
                                                {Array.isArray(team) ? team.join(' / ') : team}
                                            </span>
                                            <button onClick={() => {
                                                if (Array.isArray(team)) {
                                                    setManualTeams(manualTeams.filter((_, i) => i !== idx))
                                                } else {
                                                    setManualTeams(manualTeams.filter((_, i) => i !== idx))
                                                }
                                            }} className="text-red-400 p-1 hover:bg-red-50 rounded-lg">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    <Button
                        fullWidth
                        size="lg"
                        onClick={generateTournament}
                        disabled={participants.length < (gameType === 'SINGLES' ? 2 : 4)}
                        className="h-16 text-[18px] rounded-[24px] shadow-xl shadow-blue-500/30"
                    >
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

                    <div className="flex flex-col gap-3 sticky bottom-6 px-2">
                        <Button fullWidth onClick={handleSave} isLoading={saving} className="h-16 rounded-[20px] bg-[#CCFF00] text-black font-black text-[18px] shadow-xl shadow-[#CCFF00]/20">
                            대회 저장 및 공지하기
                        </Button>
                        <div className="flex gap-3 no-print">
                            <button
                                onClick={() => setTournament(null)}
                                className="h-14 flex-1 rounded-[20px] bg-white border-2 border-[#191F28] text-[#191F28] font-black text-[16px] shadow-sm hover:bg-gray-100 active:scale-95 transition-all"
                            >
                                RESET
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="h-14 flex-1 rounded-[20px] bg-[#0064FF] text-white font-black text-[16px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                PRINT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
