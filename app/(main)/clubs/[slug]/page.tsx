'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export default function ClubDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const inviteCodeParam = searchParams.get('code')

    const { user, profile } = useAuth()
    const slug = params.slug as string

    const [club, setClub] = useState<any>(null)
    const [memberCount, setMemberCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [joinLoading, setJoinLoading] = useState(false)
    const [inputCode, setInputCode] = useState(inviteCodeParam || '')

    // Check if current user is owner
    const isOwner = user && club && user.id === club.owner_id
    // Check if current user is already a member
    const isMember = profile?.club_id === club?.id

    useEffect(() => {
        const fetchClubData = async () => {
            const supabase = createClient()
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            // 1. Fetch Club Info
            let query = supabase.from('clubs').select('*').eq('slug', slug).single()
            const { data: clubData, error } = await query

            if (clubData) {
                setClub(clubData)

                // 2. Fetch Member Count
                const { count } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('club_id', clubData.id)

                setMemberCount(count || 0)
            }
            setLoading(false)
        }

        fetchClubData()
    }, [slug])

    const handleCopyInvite = () => {
        const link = `${window.location.origin}/clubs/${slug}?code=${club.invite_code}`
        navigator.clipboard.writeText(link)
        alert('초대 링크가 복사되었습니다!\n클럽 카톡방에 공유하세요.')
    }

    const handleJoin = async () => {
        if (!user) {
            router.push(`/login?redirect=/clubs/${slug}?code=${inputCode}`)
            return
        }

        if (isMember) {
            alert('이미 이 클럽의 멤버입니다.')
            return
        }

        // Verify Code for Instant Join
        if (!inputCode) {
            // For now, enforce code for "instant" join logic, or fallback to request
            // User requested "Master Invites", so code flow is primary.
            const code = prompt('초대 코드를 입력해주세요. (없을 시 가입 승인 대기)')
            if (code === null) return // Cancelled
            setInputCode(code) // Update state for next try if needed, but we use 'code' var below

            if (!code) {
                // Regular Join Request (Not implemented fully in backend yet, so just alert)
                alert('초대 코드가 없으면 관리자 승인이 필요합니다.\n(현재 데모에서는 초대 코드 가입만 지원합니다)')
                return
            }
        }

        setJoinLoading(true)
        const supabase = createClient()

        // 1. Verify Code
        const { data: verifyData } = await supabase
            .from('clubs')
            .select('id')
            .eq('id', club.id)
            .eq('invite_code', inputCode || inviteCodeParam) // Use state or param
            .single()

        if (!verifyData) {
            alert('초대 코드가 올바르지 않습니다.')
            setJoinLoading(false)
            return
        }

        // 2. Update Profile (Join)
        const { error } = await supabase
            .from('profiles')
            .update({ club_id: club.id })
            .eq('id', user.id)

        if (error) {
            console.error(error)
            alert('가입 중 오류가 발생했습니다.')
        } else {
            alert(`환영합니다! ${club.name}에 가입되었습니다.`)
            window.location.reload() // Refresh to update UI state
        }
        setJoinLoading(false)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-[#CCFF00]/20 border-t-[#CCFF00] rounded-full animate-spin" />
            </div>
        )
    }

    if (!club) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <div className="text-[40px]">🤔</div>
                <h2 className="text-xl font-bold text-white">클럽을 찾을 수 없습니다.</h2>
                <Button onClick={() => router.push('/')} variant="outline" size="sm">메인으로 돌아가기</Button>
            </div>
        )
    }

    return (
        <div className="pt-4 pb-20 relative">
            {/* Header Image / Pattern */}
            <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-[#CCFF00]/10 to-[#0A0E17] -z-10" />
            <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[80px] -z-10" />

            {/* Navigation */}
            <div className="flex items-center mb-6 px-1">
                <button onClick={() => router.push('/')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
            </div>

            {/* Status Banner */}
            {club.status === 'PENDING' && (
                <div className="mx-5 mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <div>
                        <h3 className="text-yellow-500 font-bold text-[14px]">심사 진행 중입니다</h3>
                        <p className="text-white/40 text-[11px]">슈퍼 마스터의 승인을 기다리고 있습니다.</p>
                    </div>
                </div>
            )}
            {club.status === 'REJECTED' && (
                <div className="mx-5 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                        <h3 className="text-red-500 font-bold text-[14px]">승인이 거절되었습니다</h3>
                        <p className="text-white/40 text-[11px]">문의사항은 관리자에게 연락바랍니다.</p>
                    </div>
                </div>
            )}

            {/* Club Identity */}
            <div className="flex flex-col items-center text-center mb-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-[32px] bg-[#191F28] border-2 border-white/10 shadow-2xl flex items-center justify-center mb-5 overflow-hidden relative group"
                >
                    {club.logo_url ? (
                        <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[32px] font-black italic text-white/20 group-hover:text-[#CCFF00] transition-colors">
                            {club.name.charAt(0)}
                        </span>
                    )}
                </motion.div>

                <h1 className="text-[28px] font-black italic text-white tracking-tight mb-2">{club.name}</h1>

                <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[11px] font-bold text-white/60 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {club.region || '지역 미설정'}
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[11px] font-bold text-white/60 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        {memberCount} Members
                    </span>
                </div>
            </div>

            {/* OWNER ACTION: Invite Link */}
            {isOwner && (
                <div className="mx-5 mb-8">
                    <Card className="bg-[#191F28] border-[#CCFF00]/30 p-5 relative overflow-hidden">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="text-[#CCFF00] font-black text-[14px] uppercase tracking-wider mb-1">Invite Members</h3>
                                <p className="text-white/60 text-[11px]">초대 코드를 공유하여 멤버를 모으세요.</p>
                            </div>
                            <Button
                                size="sm"
                                className="bg-[#CCFF00] text-black font-bold h-9 text-[12px]"
                                onClick={handleCopyInvite}
                            >
                                링크 복사
                            </Button>
                        </div>
                        <div className="mt-3 p-3 bg-black/20 rounded-xl flex justify-between items-center relative z-10">
                            <code className="text-[16px] font-mono font-bold text-white tracking-wider">{club.invite_code}</code>
                        </div>
                    </Card>
                </div>
            )}

            {/* JOIN ACTION */}
            {!isMember && !isOwner && (
                <div className="w-full max-w-xs mx-auto px-5 mb-8">
                    {/* Show input if code is not in URL but user is trying to interact? No, keep it clean. */}
                    {/* If code is in URL, show "Instant Join" UI */}
                    {inviteCodeParam ? (
                        <div className="text-center mb-3">
                            <p className="text-[#CCFF00] text-[12px] font-bold animate-pulse">✨ 초대 코드가 입력되었습니다</p>
                        </div>
                    ) : null}

                    <Button
                        fullWidth
                        className="h-12 text-[14px] font-bold bg-[#CCFF00] text-black hover:bg-[#b3e600] shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                        onClick={handleJoin}
                        isLoading={joinLoading}
                    >
                        {inviteCodeParam ? '초대 코드로 즉시 가입하기' : '클럽 가입하기'}
                    </Button>
                </div>
            )}

            {/* Member View */}
            {isMember && (
                <div className="w-full max-w-xs mx-auto px-5 mb-8">
                    <Button fullWidth className="h-12 text-[14px] font-bold bg-white/10 text-white/40 cursor-default" disabled>
                        이미 가입된 클럽입니다
                    </Button>
                </div>
            )}

            {/* 🔥 Club Activity Index (New) */}
            <div className="px-5 mb-8">
                <Card className="bg-gradient-to-br from-[#191F28] to-[#0A0E17] border border-white/10 p-6 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#CCFF00]/10 blur-[50px] rounded-full" />

                    <div className="relative z-10 flex flex-col items-center">
                        <h3 className="text-[10px] font-black text-[#CCFF00] uppercase tracking-[0.2em] mb-4">Club Activity Index</h3>

                        {/* Circular Gauge */}
                        <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                            {/* Outer Ring */}
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                                <circle
                                    cx="80" cy="80" r="70"
                                    stroke="#CCFF00"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray="440"
                                    strokeDashoffset="110" // 75% filled mock
                                    strokeLinecap="round"
                                    className="drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                                />
                            </svg>
                            {/* Inner Info */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[32px] font-black italic text-white tracking-tighter">1,240</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase">Total Points</span>
                            </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t border-white/5">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Total Games</p>
                                <p className="text-[14px] font-black text-white">124</p>
                            </div>
                            <div className="text-center mb-1 relative">
                                <div className="absolute inset-y-2 -left-2 w-[1px] bg-white/5" />
                                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Win Rate</p>
                                <p className="text-[14px] font-black text-[#CCFF00]">56%</p>
                                <div className="absolute inset-y-2 -right-2 w-[1px] bg-white/5" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-white/30 uppercase mb-1">Active</p>
                                <p className="text-[14px] font-black text-white">82%</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Club Info Cards */}
            <div className="space-y-4">
                <Card className="bg-[#121826] border-white/5 p-5">
                    <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-3">Club Info</h3>
                    <p className="text-white text-[15px] leading-relaxed">
                        {club.description || '클럽 소개글이 없습니다.'}
                    </p>
                </Card>

                {/* Mock Public Data for Guests */}
                <Card className="bg-[#121826] border-white/5 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">Season Ranking</h3>
                        <span className="text-[10px] bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-0.5 rounded font-bold">TOP 3</span>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((rank) => (
                            <div key={rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`w-5 h-5 flex items-center justify-center text-[12px] font-black italic rounded ${rank === 1 ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white'}`}>
                                        {rank}
                                    </span>
                                    <span className="text-white text-[14px] font-bold">Player_{rank}</span>
                                </div>
                                <span className="text-white/40 text-[12px] font-medium">1,2{rank}0 pts</span>
                            </div>
                        ))}
                        <div className="pt-2 text-center text-[12px] text-white/20">
                            * 가입 후 전체 랭킹을 확인할 수 있습니다.
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
