
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerCard from '@/components/PlayerCard'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Settings2 } from 'lucide-react'

export default function RankingsPage() {
    const { isStaff } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [rankings, setRankings] = useState<any[]>([])
    const [filter, setFilter] = useState<'WEEK' | 'ALL'>('WEEK')
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
    }, [filter])

    const fetchRankings = async () => {
        setLoading(true)
        try {
            // 1. Fetch Profiles
            const { data: profiles, error: pError } = await supabase.from('profiles').select('*')
            if (pError) throw pError

            // 2. Fetch Scores with Week Filtering
            let query = supabase.from('scores').select('*')

            if (filter === 'WEEK') {
                const currentWeekLabel = "1월 1주차" // Same as in ScorePage
                const { data: weekData } = await supabase
                    .from('weeks')
                    .select('id')
                    .eq('label', currentWeekLabel)
                    .single()

                if (weekData) {
                    query = query.eq('week_id', weekData.id)
                }
            }

            const { data: scores, error: sError } = await query
            if (sError) throw sError

            // 3. Aggregate
            const stats: Record<string, any> = {}

            profiles.forEach((p: any) => {
                stats[p.id] = {
                    ...p,
                    points: 0,
                    wins: 0,
                    matches: 0,
                }
            })

            scores?.forEach((s: any) => {
                if (stats[s.user_id]) {
                    stats[s.user_id].points += Number(s.points)
                    stats[s.user_id].matches += 1
                    if (s.result === 'WIN') stats[s.user_id].wins += 1
                }
            })

            // Filter out players with no matches in the current period if desired, 
            // but for now let's keep all and sort. 
            // In WEEK view, maybe we only want to show those who played.
            const statsArray = Object.values(stats)
            const filteredStats = filter === 'WEEK'
                ? statsArray.filter((s: any) => s.matches > 0)
                : statsArray

            const sorted = filteredStats.sort((a: any, b: any) => {
                if (b.points !== a.points) return b.points - a.points
                if (b.wins !== a.wins) return b.wins - a.wins
                if (b.matches !== a.matches) return b.matches - a.matches
                return (a.nickname || '').localeCompare(b.nickname || '')
            })

            setRankings(sorted)

        } catch (e) {
            console.error('Fetch rankings error:', e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-2 pb-6 space-y-6">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-[20px] font-bold">선수 랭킹</h2>
                    {isStaff && (
                        <button
                            onClick={() => router.push('/admin/history')}
                            className="bg-[#F2F4F6] p-2 rounded-full text-[#8B95A1] hover:text-[#0064FF] transition-colors"
                            title="기록 수정 (관리자)"
                        >
                            <Settings2 size={18} />
                        </button>
                    )}
                </div>
                <div className="bg-gray-100 p-1 rounded-lg flex text-[13px] font-medium">
                    <button
                        onClick={() => setFilter('WEEK')}
                        className={`px-3 py-1.5 rounded-md transition-all ${filter === 'WEEK' ? 'bg-white shadow text-[#0064FF]' : 'text-gray-400'}`}
                    >
                        이번주
                    </button>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1.5 rounded-md transition-all ${filter === 'ALL' ? 'bg-white shadow text-[#0064FF]' : 'text-gray-400'}`}
                    >
                        전체
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-[20px] animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {rankings.map((player, index) => (
                        <RankingCard
                            key={player.id}
                            rank={index + 1}
                            player={player}
                            onPhotoClick={() => setSelectedPlayer(player)}
                        />
                    ))}

                    {rankings.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-[14px]">
                            아직 기록된 점수가 없습니다.
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
    const cardColor = player.color || '#D4AF37' // Fallback to gold if no color

    // Mini Game Card Style
    return (
        <div className="relative w-full h-[100px] rounded-[16px] overflow-hidden shadow-md transition-transform active:scale-[0.98]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1c20] to-[#0f1012]" />
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: cardColor }}
            />
            {/* Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />

            <div className="relative h-full flex items-center px-4 gap-4 z-10">
                {/* 1. Rank */}
                <div className="w-8 text-center flex flex-col items-center justify-center">
                    {rank === 1 ? (
                        <span className="text-[24px]">👑</span>
                    ) : (
                        <span className={`text-[20px] font-black italic ${isTop3 ? 'text-white' : 'text-gray-500'}`}>
                            {rank}
                        </span>
                    )}
                </div>

                {/* 2. Photo / Avatar */}
                <div className="relative cursor-pointer group" onClick={onPhotoClick}>
                    <div
                        className="w-14 h-14 rounded-full border-2 overflow-hidden bg-[#333D4B] shadow-lg transition-transform group-hover:scale-105"
                        style={{ borderColor: cardColor }}
                    >
                        {player.photo_url ? (
                            <img src={player.photo_url} alt={player.nickname} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-b from-[#333D4B] to-[#111315]">
                                {player.nickname?.[0]}
                            </div>
                        )}
                    </div>
                    {/* Badge (e.g. KR) - Optional decor */}
                    <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-black border border-[#1a1c20]"
                        style={{ backgroundColor: cardColor }}
                    >
                        KR
                    </div>
                    {/* View Label on hover */}
                    <div className="absolute -top-1 px-1 bg-black/60 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">VIEW</div>
                </div>

                {/* 3. Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-end gap-2 mb-1">
                        <h4 className="font-black text-[18px] text-white tracking-tight truncate leading-none">
                            {player.nickname}
                        </h4>
                        <span className="text-[11px] font-bold text-gray-500 mb-0.5">
                            {player.position || 'ALL'} / {player.pref_side === '포사이드' ? 'FORE' : player.pref_side === '백사이드' ? 'BACK' : 'ALL'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-[12px] font-medium text-gray-400">
                        <div className="flex items-center gap-1">
                            <span style={{ color: cardColor }}>W</span>
                            <span className="text-white">{player.wins}</span>
                        </div>
                        <div className="w-[1px] h-2.5 bg-gray-700" />
                        <div className="flex items-center gap-1">
                            <span style={{ color: cardColor }}>M</span>
                            <span className="text-white">{player.matches}</span>
                        </div>
                        <div className="w-[1px] h-2.5 bg-gray-700" />
                        <div className="flex items-center gap-1">
                            <span>{player.matches ? Math.round((player.wins / player.matches) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>

                {/* 4. Score */}
                <div className="text-right">
                    <div className="text-[11px] font-bold text-gray-500 tracking-wider mb-0.5">PTS</div>
                    <div className="text-[24px] font-black leading-none" style={{ color: cardColor }}>
                        {Number(player.points).toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    )
}
