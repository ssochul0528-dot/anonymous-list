
'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import PlayerRadarChart from './PlayerRadarChart'
import SignatureBadges from './SignatureBadges'

interface PlayerCardProps {
    profile: any
}

export default function PlayerCard({ profile }: PlayerCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)

    // Badge Logic (Same as in ProfilePage)
    const getActiveBadges = (p: any) => {
        const badges = []
        if (p.skill_serve >= 80) badges.push('big_server')
        if (p.skill_stamina >= 80) badges.push('court_dog')
        if (p.style === '수비' && p.skill_stamina >= 70) badges.push('iron_wall')
        if ((p.position === '전위(네트)' || p.position === '무관') && p.skill_volley >= 75) badges.push('net_shark')
        if (p.skill_manner >= 90) badges.push('gentleman')
        if (p.skill_forehand >= 85 || p.skill_backhand >= 85) badges.push('sniper')
        if (p.skill_serve >= 70 && p.skill_forehand >= 70 && p.skill_backhand >= 70) badges.push('streak_king')
        return badges
    }

    const cardColor = profile.color || '#D4AF37'
    const initials = profile.nickname ? profile.nickname.substring(0, 2).toUpperCase() : '??'
    const activeBadges = getActiveBadges(profile)

    return (
        <div className="flex flex-col items-center perspective-1000">
            <motion.div
                className="relative w-[300px] h-[480px] cursor-pointer preserve-3d"
                onClick={() => setIsFlipped(!isFlipped)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* Front Side */}
                <div
                    className="absolute inset-0 backface-hidden rounded-[24px] overflow-hidden shadow-2xl group/card isolate"
                    style={{
                        transform: 'translateZ(1px)',
                        WebkitTransform: 'translateZ(1px)',
                        zIndex: isFlipped ? 0 : 10
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c20] via-[#0f1012] to-[#000000]" />
                    <div className="absolute inset-[4px] rounded-[20px] border-2 bg-gradient-to-br from-[#2a2d33] to-[#151618] z-0" style={{ borderColor: `${cardColor}4D` }} />

                    {/* Holographic Overlay */}
                    <div className="absolute inset-0 opacity-[0.15] mix-blend-color-dodge z-10 pointer-events-none group-hover/card:opacity-30 transition-opacity duration-500 animate-hologram"
                        style={{
                            background: `linear-gradient(110deg, 
                                transparent 20%, 
                                #ff00ff 30%, 
                                #00ffff 40%, 
                                #ffff00 50%, 
                                #00ffff 60%, 
                                #ff00ff 70%, 
                                transparent 80%)`,
                            backgroundSize: '200% 200%'
                        }}
                    />

                    {/* Texture & Patterns */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay z-10" />

                    <div className="absolute top-6 left-6 z-20">
                        <div className="font-black text-[32px] leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ color: cardColor }}>
                            {profile.style === '공격' ? '92' : profile.style === '수비' ? '88' : '90'}
                        </div>
                        <div className="text-white/60 text-[14px] font-bold tracking-widest mt-1 uppercase">
                            {profile.position === '전위(네트)' ? 'NET' : profile.position === '후위(베이스)' ? 'BAS' : 'ALL'}
                        </div>
                    </div>

                    <div className="absolute top-4 right-6 z-20">
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg bg-black/20" style={{ borderColor: cardColor }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                                <span className="text-[10px] font-bold text-black italic">TEN</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] z-20">
                        <div className="w-full h-full rounded-full border-4 shadow-2xl overflow-hidden bg-[#333D4B] relative" style={{ borderColor: cardColor, boxShadow: `0 0 40px ${cardColor}44` }}>
                            {profile.photo_url ? (
                                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-b from-[#333D4B] to-[#111315]" style={{ color: cardColor }}>
                                    {initials}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-20 text-center">
                        {/* Signature Badges System */}
                        <div className="mb-4">
                            <SignatureBadges activeBadgeIds={activeBadges} />
                        </div>

                        <h2 className="text-[28px] font-black text-white uppercase tracking-tight drop-shadow-lg mb-1">{profile.nickname || 'PLAYER'}</h2>
                        <div className="h-[2px] w-12 mx-auto mb-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundColor: cardColor }} />
                        <div className="grid grid-cols-3 gap-2 text-center text-white">
                            <div>
                                <div className="text-[11px] font-bold tracking-wider opacity-80" style={{ color: cardColor }}>STYLE</div>
                                <div className="text-[14px] font-bold mt-0.5">{profile.style || '무관'}</div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold tracking-wider opacity-80" style={{ color: cardColor }}>HAND</div>
                                <div className="text-[14px] font-bold mt-0.5">{profile.hand || 'R'}</div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold tracking-wider opacity-80" style={{ color: cardColor }}>POS</div>
                                <div className="text-[14px] font-bold mt-0.5">
                                    {profile.position === '무관' ? 'ALL' : (profile.position ? profile.position.substring(0, 2) : 'ALL')}
                                </div>
                            </div>
                        </div>
                        <p className="text-[12px] text-gray-400 mt-4 line-clamp-2 px-2 font-medium italic opacity-70">
                            {profile.bio || "Elite Tennis Player"}
                        </p>
                    </div>
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] overflow-hidden shadow-2xl isolate"
                    style={{
                        transform: 'rotateY(180deg) translateZ(1px)',
                        WebkitTransform: 'rotateY(180deg) translateZ(1px)',
                        zIndex: isFlipped ? 10 : 0
                    }}
                >
                    <div className="absolute inset-0 bg-[#0A0B0D]" />
                    <div className="absolute inset-[4px] rounded-[20px] border-2 bg-gradient-to-br from-[#1a1c20] to-[#0a0b0d]" style={{ borderColor: cardColor }} />

                    {/* Back Holographic Accents */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/5 to-transparent z-0" />

                    <div className="absolute inset-0 z-10 flex flex-col pt-10 pb-6">
                        <h3 className="text-[14px] font-bold tracking-[0.2em] mb-2 text-center" style={{ color: cardColor }}>PLAYER ABILITY</h3>

                        <div className="w-full flex-1 min-h-[280px] flex items-center justify-center -mt-4">
                            <PlayerRadarChart skills={{
                                serve: profile.skill_serve || 50,
                                forehand: profile.skill_forehand || 50,
                                backhand: profile.skill_backhand || 50,
                                volley: profile.skill_volley || 50,
                                stamina: profile.skill_stamina || 50,
                                manner: profile.skill_manner || 50
                            }} />
                        </div>

                        <div className="px-8 mt-2 space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-4">
                                <div>
                                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Equipment</p>
                                    <p className="text-[12px] font-bold text-white truncate">{profile.racket || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Schedule</p>
                                    <p className="text-[12px] font-bold text-white truncate">{profile.pref_time_days || '무관'} / {profile.pref_time_slots || '아침'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pb-4 flex flex-col items-center">
                            <div className="text-[9px] font-black tracking-[0.3em] text-white/10 italic relative">
                                PRO ANALYTICS
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-shimmer pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            <p className="mt-4 text-[12px] text-[#6B7684] font-medium flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 11 3 3 3-3" /><path d="m22 13-3-3-3 3" /><path d="M5 14v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1" /></svg>
                카드를 클릭하여 뒤집기
            </p>
        </div>
    )
}
