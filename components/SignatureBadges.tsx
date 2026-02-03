
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Shield, Zap, HeartHandshake, Waves, Trophy, Target, Medal, Disc } from 'lucide-react'

interface BadgeProps {
    id: string
    label: string
    description: string
    icon: React.ReactNode
    color: string
    borderColor: string
}

const BADGE_TEMPLATES: Record<string, BadgeProps> = {
    tournament_winner: {
        id: 'tournament_winner',
        label: '그랜드슬램 우승',
        description: '오스틴급 트로피를 거머쥔 챔피언',
        icon: <Trophy className="w-4 h-4" />,
        color: 'from-yellow-300 via-yellow-500 to-amber-600',
        borderColor: 'border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
    },
    tournament_runnerup: {
        id: 'tournament_runnerup',
        label: '준우승 은반',
        description: '결승전의 치열한 사투 끝에 쟁취한 은쟁반',
        icon: <Disc className="w-4 h-4" />,
        color: 'from-slate-200 via-slate-400 to-slate-600',
        borderColor: 'border-slate-300/50 shadow-[0_0_10px_rgba(148,163,184,0.3)]'
    },
    big_server: {
        id: 'big_server',
        label: '빅 서버',
        description: '강력한 서브로 코트를 지배하는 자',
        icon: <Flame className="w-4 h-4" />,
        color: 'from-orange-500 to-red-600',
        borderColor: 'border-yellow-500/50'
    },
    court_dog: {
        id: 'court_dog',
        label: '코트 독',
        description: '끝까지 공을 쫓는 불굴의 활동량',
        icon: <Zap className="w-4 h-4" />,
        color: 'from-blue-400 to-blue-600',
        borderColor: 'border-slate-300/50'
    },
    iron_wall: {
        id: 'iron_wall',
        label: '철벽',
        description: '어떤 공격도 받아내는 수비의 핵심',
        icon: <Shield className="w-4 h-4" />,
        color: 'from-amber-700 to-amber-900',
        borderColor: 'border-amber-600/50'
    },
    net_shark: {
        id: 'net_shark',
        label: '네트 샤크',
        description: '전위에서 빠른 반사신경으로 득점',
        icon: <Waves className="w-4 h-4" />,
        color: 'from-cyan-400 to-blue-500',
        borderColor: 'border-cyan-300/50'
    },
    gentleman: {
        id: 'gentleman',
        label: '매너왕',
        description: '모두가 함께 치고 싶어하는 최고의 매너',
        icon: <HeartHandshake className="w-4 h-4" />,
        color: 'from-pink-400 to-rose-500',
        borderColor: 'border-rose-300/50'
    },
    sniper: {
        id: 'sniper',
        label: '스나이퍼',
        description: '정교한 컨트롤로 라인을 타격',
        icon: <Target className="w-4 h-4" />,
        color: 'from-emerald-400 to-teal-600',
        borderColor: 'border-emerald-300/50'
    },
    streak_king: {
        id: 'streak_king',
        label: '연승 군주',
        description: '최근 압도적인 기세를 보여주는 선수',
        icon: <Trophy className="w-4 h-4" />,
        color: 'from-purple-500 to-indigo-700',
        borderColor: 'border-purple-400/50'
    }
}

export default function SignatureBadges({ activeBadgeIds }: { activeBadgeIds: string[] }) {
    // Count occurrences of each badge
    const badgeCounts = activeBadgeIds.reduce((acc: Record<string, number>, id) => {
        acc[id] = (acc[id] || 0) + 1
        return acc
    }, {})

    const uniqueBadgeIds = Array.from(new Set(activeBadgeIds))

    return (
        <div className="flex flex-wrap justify-center gap-2 px-2">
            {uniqueBadgeIds.map((id) => {
                const badge = BADGE_TEMPLATES[id]
                const count = badgeCounts[id]
                if (!badge) return null

                return (
                    <div key={id} className="group relative">
                        <motion.div
                            whileHover={{ scale: 1.1, y: -2 }}
                            className={`
                relative flex items-center gap-1.5 px-2 py-1 rounded-full 
                bg-white/10 backdrop-blur-md border ${badge.borderColor} 
                shadow-lg overflow-hidden cursor-help
              `}
                        >
                            <div className={`p-1 rounded-full bg-gradient-to-br ${badge.color} text-white shadow-inner relative`}>
                                {badge.icon}
                                {count > 1 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm ring-1 ring-red-500/50">
                                        {count}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-white/90 tracking-tighter uppercase whitespace-nowrap">
                                {badge.label}
                            </span>

                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine" />
                        </motion.div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-2 rounded-xl text-center shadow-2xl">
                                <p className="text-[10px] font-bold text-white mb-0.5">{badge.label}</p>
                                <p className="text-[8px] text-white/60 leading-tight">
                                    {count > 1 ? `${count}회 수상: ` : ''}{badge.description}
                                </p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
