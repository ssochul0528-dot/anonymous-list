
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerCard from '@/components/PlayerCard'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function RankingsPage() {
    const { isStaff } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [rankings, setRankings] = useState<any[]>([])
    const [filter, setFilter] = useState<'MONTH' | 'ALL'>('ALL')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
    const [playerHistory, setPlayerHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    useEffect(() => {
        if (selectedPlayer) {
            fetchPlayerHistory(selectedPlayer.id)
        }
    }, [selectedPlayer])

    const fetchPlayerHistory = async (userId: string) => {
        setHistoryLoading(true)
        try {
            const { data, error } = await supabase
                .from('scores')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5)
            if (error) throw error
            setPlayerHistory(data || [])
        } catch (e) {
            console.error(e)
        } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        fetchRankings()
    }, [filter, selectedDate])

    const fetchRankings = async () => {
        setLoading(true)
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            const { data: myProfile } = await supabase
                .from('profiles')
                .select('club_id')
                .eq('id', authUser.id)
                .single()

            const targetClubId = myProfile?.club_id
            if (!targetClubId) {
                setLoading(false)
                return
            }

            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('club_id', targetClubId)

            if (pError) throw pError
            if (!profiles || profiles.length === 0) {
                setRankings([])
                setLoading(false)
                return
            }

            const clubUserIds = profiles.map(p => p.id)
            let scoresQuery = supabase.from('scores').select('*').in('user_id', clubUserIds)

            if (filter === 'MONTH') {
                const year = selectedDate.getFullYear()
                const month = selectedDate.getMonth()
                const start = new Date(year, month, 1).toISOString()
                const end = new Date(year, month + 1, 1).toISOString()
                scoresQuery = scoresQuery.gte('created_at', start).lt('created_at', end)
            }

            const { data: scores, error: sError } = await scoresQuery
            if (sError) throw sError

            const stats = new Map()
            profiles.forEach(p => stats.set(p.id, { ...p, points: 0, wins: 0, draws: 0, losses: 0, matches: 0 }))

            scores?.forEach(s => {
                const p = stats.get(s.user_id)
                if (p) {
                    p.points += Number(s.points || 0)
                    // Count everything with a result as a match for W-D-L stats
                    if (s.result) {
                        p.matches += 1
                        if (s.result === 'WIN') p.wins += 1
                        else if (s.result === 'DRAW') p.draws += 1
                        else if (s.result === 'LOSE') p.losses += 1
                    }
                }
            })

            const sorted = Array.from(stats.values())
                .filter(s => s.points > 0 || filter === 'ALL')
                .sort((a, b) => b.points - a.points)

            setRankings(sorted)

        } catch (e) {
            console.error('Fetch rankings error:', e)
        } finally {
            setLoading(false)
        }
    }

    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedDate)
        newDate.setMonth(newDate.getMonth() + offset)
        setSelectedDate(newDate)
    }

    return (
        <div className="pt-6 pb-20 space-y-8 bg-[#0A0E17] min-h-screen px-4">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-[28px] font-black italic tracking-tighter text-white uppercase leading-none">
                            Player <span className="text-[#CCFF00]">Ranking</span>
                        </h2>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">
                            선수 개인 랭킹 (기록 기반 합계)
                        </p>
                    </div>
                    {isStaff && (
                        <button
                            onClick={() => router.push('/admin/history')}
                            className="bg-white/5 p-2.5 rounded-xl text-white/40 hover:text-[#CCFF00] hover:bg-white/10 transition-all border border-white/5"
                            title="기록 수정 (관리자)"
                        >
                            <Settings2 size={20} />
                        </button>
                    )}
                </div>

                <div className="bg-white/5 p-1 rounded-xl flex text-[13px] font-black border border-white/5">
                    <button
                        onClick={() => setFilter('MONTH')}
                        className={`flex-1 py-2.5 rounded-lg transition-all ${filter === 'MONTH' ? 'bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.2)]' : 'text-white/40 hover:text-white/60'}`}
                    >
                        월간 랭킹
                    </button>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`flex-1 py-2.5 rounded-lg transition-all ${filter === 'ALL' ? 'bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.2)]' : 'text-white/40 hover:text-white/60'}`}
                    >
                        전체 랭킹
                    </button>
                </div>

                {/* Month Selector UI */}
                <AnimatePresence>
                    {filter === 'MONTH' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => changeMonth(-1)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                <div className="text-center">
                                    <span className="text-[18px] font-black italic text-white tracking-tighter uppercase">
                                        {selectedDate.getFullYear()}Y {selectedDate.getMonth() + 1}M
                                    </span>
                                </div>

                                <button
                                    onClick={() => changeMonth(1)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-[100px] bg-white/5 rounded-2xl border border-white/5 animate-pulse flex items-center px-4 gap-4">
                            <div className="w-8 h-8 bg-white/10 rounded-lg" />
                            <div className="w-14 h-14 bg-white/10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-white/10 rounded w-1/3" />
                                <div className="h-3 bg-white/10 rounded w-1/4" />
                            </div>
                            <div className="w-12 h-6 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3 pb-10">
                    <AnimatePresence mode="popLayout">
                        {rankings.map((player, index) => (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <RankingCard
                                    rank={index + 1}
                                    player={player}
                                    onPhotoClick={() => setSelectedPlayer(player)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {rankings.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                                <Settings2 size={32} />
                            </div>
                            <p className="text-white/20 text-[14px] font-bold italic uppercase tracking-widest leading-relaxed">
                                아직 기록된 데이터가 없습니다.<br />
                                <span className="text-[10px] opacity-50 font-normal">다른 날짜를 선택하거나 경기를 시작해보세요!</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedPlayer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPlayer(null)}
                            className="absolute inset-0"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-[320px] my-auto"
                        >
                            <div className="space-y-4 pt-10 pb-6">
                                <PlayerCard profile={selectedPlayer} />

                                {/* Mini History Card */}
                                <div className="bg-[#1a1c20]/90 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
                                    <div className="px-5 py-4 border-b border-white/5">
                                        <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            최근 경기 기록
                                        </h4>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {historyLoading ? (
                                            <div className="py-8 flex justify-center">
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : playerHistory.length > 0 ? (
                                            playerHistory.map((h) => (
                                                <div key={h.id} className="bg-white/5 rounded-xl p-3 flex justify-between items-center transition-colors hover:bg-white/10">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[13px] font-black ${h.result === 'WIN' ? 'text-blue-400' :
                                                            h.result === 'DRAW' ? 'text-green-400' : 'text-orange-400'
                                                            }`}>
                                                            {h.result === 'WIN' ? '승리' : h.result === 'DRAW' ? '무승부' : '패배'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-medium">
                                                            {new Date(h.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[13px] font-bold text-white">+{Number(h.points).toFixed(1)}</span>
                                                        <span className="text-[10px] text-gray-500 block">POINTS</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-gray-500 text-[12px] font-medium">
                                                아직 기록된 경기가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedPlayer(null)}
                                className="absolute -top-4 right-0 text-white/60 hover:text-white flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md transition-all active:scale-95"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function RankingCard({ rank, player, onPhotoClick }: any) {
    const isTop3 = rank <= 3
    const cardColor = rank === 1 ? '#CCFF00' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#333D4B'

    return (
        <div className="relative w-full h-[100px] rounded-[24px] overflow-hidden transition-all active:scale-[0.98] border border-white/5 group bg-[#121826]/50 backdrop-blur-sm shadow-xl">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

            {/* Rank Border Accent */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: isTop3 ? cardColor : 'rgba(255,255,255,0.05)' }}
            />

            <div className="relative h-full flex items-center px-5 gap-4 z-10">
                {/* 1. Rank Display */}
                <div className="w-10 flex flex-col items-center justify-center">
                    {rank === 1 ? (
                        <div className="relative">
                            <span className="text-[24px] absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_#CCFF00]">👑</span>
                            <span className="text-[22px] font-black italic text-[#CCFF00] tracking-tighter">1</span>
                        </div>
                    ) : (
                        <span className={`text-[18px] font-black italic ${isTop3 ? 'text-white' : 'text-white/20'} tracking-tighter`}>
                            {rank}
                        </span>
                    )}
                </div>

                {/* 2. Avatar with Glow */}
                <div className="relative cursor-pointer" onClick={onPhotoClick}>
                    <div
                        className={`w-14 h-14 rounded-full border-2 overflow-hidden bg-[#0A0E17] transition-all group-hover:scale-105 ${isTop3 ? 'shadow-[0_0_15px_rgba(204,255,0,0.15)]' : ''}`}
                        style={{ borderColor: isTop3 ? cardColor : 'rgba(255,255,255,0.1)' }}
                    >
                        {player.photo_url ? (
                            <img src={player.photo_url} alt={player.nickname} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-black text-white bg-gradient-to-b from-white/10 to-transparent">
                                {player.nickname?.[0]}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Info Panel */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-black text-[17px] tracking-tight truncate leading-none ${isTop3 ? 'text-white' : 'text-white/80'}`}>
                            {player.nickname}
                        </h4>
                        {rank === 1 && <span className="text-[10px] bg-[#CCFF00] text-black font-black px-1.5 py-0.5 rounded italic shadow-[0_0_10px_#CCFF00]/50">CHAMP</span>}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 truncate">
                        <div className="flex items-center gap-1">
                            <span className="text-white/80">{player.wins || 0}W</span>
                            <span className="text-white/80">{player.draws || 0}D</span>
                            <span className="text-white/80">{player.losses || 0}L</span>
                        </div>
                        <div className="w-[1px] h-2 bg-white/10" />
                        <div className="flex items-center gap-1">
                            <span className={player.matches ? 'text-[#CCFF00]' : ''}>
                                {player.matches ? Math.round((player.wins / player.matches) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Points Section */}
                <div className="text-right flex flex-col items-end shrink-0 ml-auto">
                    <span className="text-[9px] font-black text-white/10 tracking-widest uppercase mb-0.5">Points</span>
                    <div className={`text-[20px] font-black italic leading-none tracking-tighter ${rank === 1 ? 'text-[#CCFF00] drop-shadow-[0_0_5px_rgba(204,255,0,0.3)]' : 'text-white'}`}>
                        {Number(player.points || 0).toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
        </div>
    )
}
