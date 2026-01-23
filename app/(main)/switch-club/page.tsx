'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Plus, Check, ArrowRight, Shield } from 'lucide-react'

export default function SwitchClubPage() {
    const { user, profile } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [memberships, setMemberships] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [switching, setSwitching] = useState(false)

    useEffect(() => {
        const fetchClubs = async () => {
            if (!user) return
            const { data, error } = await supabase
                .from('club_members')
                .select('*, clubs(*)')
                .eq('user_id', user.id)

            if (data) setMemberships(data)
            setLoading(false)
        }
        fetchClubs()
    }, [user])

    const handleSwitch = async (clubId: string, role: string) => {
        if (switching) return
        setSwitching(true)

        try {
            // Map 'MEMBER' role to 'USER' for profile compatibility if needed 
            // (Assuming profiles use 'USER' for standard members)
            // But let's keep STAFF/PRESIDENT as is.
            const profileRole = role === 'MEMBER' ? 'USER' : role

            const { error } = await supabase
                .from('profiles')
                .update({
                    club_id: clubId,
                    role: profileRole
                })
                .eq('id', user?.id)

            if (error) throw error

            // Use assign for a hard navigation to ensure context is refreshed.
            window.location.assign('/my-club')
        } catch (e: any) {
            console.error(e)
            alert('클럽 전환 실패: ' + e.message)
            setSwitching(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-white/50">로딩중...</div>

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white p-5 pb-20">
            <header className="mb-8">
                <Link href="/" className="text-white/40 hover:text-white mb-4 block">&lt; 메인으로</Link>
                <h1 className="text-[28px] font-black italic tracking-tighter uppercase">My Clubs</h1>
                <p className="text-white/40 text-[14px]">활동 중인 클럽을 선택하세요.</p>
            </header>

            <div className="space-y-4">
                {memberships.map((m) => {
                    const isActive = profile?.club_id === m.club_id
                    const club = m.clubs
                    return (
                        <Card
                            key={m.id}
                            className={`p-5 border flex items-center justify-between transition-all cursor-pointer ${isActive
                                ? 'border-[#CCFF00] bg-[#CCFF00]/5 shadow-[0_0_20px_rgba(204,255,0,0.1)]'
                                : 'border-white/10 bg-[#121826] hover:border-white/30'
                                }`}
                            onClick={() => handleSwitch(m.club_id, m.role)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[20px] uppercase ${isActive ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white/40'
                                    }`}>
                                    {club.name.substring(0, 1)}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-[16px] ${isActive ? 'text-white' : 'text-white/80'}`}>
                                        {club.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[12px] text-white/40 font-mono tracking-wider">
                                            {m.role}
                                        </span>
                                        {isActive && (
                                            <span className="text-[10px] text-[#CCFF00] font-bold border border-[#CCFF00]/30 px-1.5 rounded">
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isActive ? (
                                <Check className="text-[#CCFF00]" />
                            ) : (
                                <ArrowRight className="text-white/20" />
                            )}
                        </Card>
                    )
                })}

                <Link href="/clubs">
                    <div className="border border-dashed border-white/20 rounded-2xl p-5 flex items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer h-20">
                        <Plus size={20} />
                        <span className="font-bold">새 클럽 가입하기</span>
                    </div>
                </Link>
            </div>
        </div>
    )
}
