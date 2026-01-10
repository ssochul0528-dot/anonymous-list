
'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export default function RankingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [rankings, setRankings] = useState<any[]>([])
    const [filter, setFilter] = useState<'WEEK' | 'ALL'>('WEEK')

    useEffect(() => {
        fetchRankings()
    }, [filter])

    const fetchRankings = async () => {
        setLoading(true)
        try {
            // 1. Fetch Profiles
            const { data: profiles, error: pError } = await supabase.from('profiles').select('*')
            if (pError) throw pError

            // 2. Fetch Scores
            // In a real app, filtering by date/week would happen here
            const { data: scores, error: sError } = await supabase.from('scores').select('*')
            if (sError) throw sError

            // 3. Aggregate
            const stats: Record<string, any> = {}

            profiles.forEach((p: any) => {
                stats[p.id] = {
                    id: p.id,
                    nickname: p.nickname || '무명',
                    photoUrl: p.photo_url,
                    level: p.level,
                    points: 0,
                    wins: 0,
                    matches: 0,
                    // losses/draws if needed
                }
            })

            scores.forEach((s: any) => {
                if (stats[s.user_id]) {
                    stats[s.user_id].points += Number(s.points)
                    stats[s.user_id].matches += 1
                    if (s.result === 'WIN') stats[s.user_id].wins += 1
                }
            })

            // 4. Sort (Points > Wins > Matches > Name)
            const sorted = Object.values(stats).sort((a: any, b: any) => {
                if (b.points !== a.points) return b.points - a.points
                if (b.wins !== a.wins) return b.wins - a.wins
                if (b.matches !== a.matches) return b.matches - a.matches
                return a.nickname.localeCompare(b.nickname)
            })

            setRankings(sorted)

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-2 pb-6 space-y-6">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-[20px] font-bold">선수 랭킹</h2>
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
                        />
                    ))}

                    {rankings.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-[14px]">
                            아직 기록된 점수가 없습니다.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function RankingCard({ rank, player }: any) {
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
                <div className="relative">
                    <div
                        className="w-14 h-14 rounded-full border-2 overflow-hidden bg-[#333D4B] shadow-lg"
                        style={{ borderColor: cardColor }}
                    >
                        {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.nickname} className="w-full h-full object-cover" />
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
                </div>

                {/* 3. Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-end gap-2 mb-1">
                        <h4 className="font-black text-[18px] text-white tracking-tight truncate leading-none">
                            {player.nickname}
                        </h4>
                        <span className="text-[11px] font-bold text-gray-500 mb-0.5">
                            {player.position || 'ALL'}
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
