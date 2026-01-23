
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, Shield, ShieldCheck, Search, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MemberManagementPage() {
    const { user, profile, isPresident } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // ... (useEffect auth check unchanged)
    useEffect(() => {
        if (!loading && !isPresident) {
            alert('권한이 없습니다.')
            router.replace('/')
        }
    }, [isPresident, loading, router])

    useEffect(() => {
        if (profile?.club_id) {
            fetchMembers()
        }
    }, [profile?.club_id])

    const fetchMembers = async () => {
        setLoading(true)
        if (!profile?.club_id) return

        // Fetch members of THIS club
        const { data, error } = await supabase
            .from('club_members')
            .select(`
                *,
                profiles:user_id (
                    id,
                    nickname,
                    real_name,
                    email,
                    photo_url,
                    club_id
                )
            `)
            .eq('club_id', profile.club_id)
            .order('role', { ascending: true })

        if (data) {
            // Sort: President -> Staff -> User
            const sorted = data.sort((a, b) => {
                const roleOrder: any = { 'PRESIDENT': 0, 'STAFF': 1, 'MEMBER': 2, 'USER': 2 }
                return roleOrder[a.role] - roleOrder[b.role]
            })
            setMembers(sorted)
        }
        setLoading(false)
    }

    const toggleStaff = async (memberId: string, memberUserId: string, currentRole: string) => {
        if (currentRole === 'PRESIDENT') {
            alert('회장 권한은 변경할 수 없습니다.')
            return
        }

        const newRole = currentRole === 'STAFF' ? 'MEMBER' : 'STAFF'
        const oldMembers = [...members]
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))

        try {
            const { error: memberError } = await supabase
                .from('club_members')
                .update({ role: newRole })
                .eq('id', memberId)

            if (memberError) throw memberError

            const targetMember = members.find(m => m.id === memberId)
            const targetProfile = targetMember?.profiles

            if (targetProfile && targetProfile.club_id === profile?.club_id) {
                const profileRole = newRole === 'MEMBER' ? 'USER' : newRole
                await supabase
                    .from('profiles')
                    .update({ role: profileRole })
                    .eq('id', memberUserId)
            }
            alert(`권한이 ${newRole === 'STAFF' ? '부여' : '해제'}되었습니다.`)
        } catch (error: any) {
            console.error('Staff Update Error:', error)
            alert('권한 수정 실패: ' + error.message)
            setMembers(oldMembers)
        }
    }

    const handleKickMember = async (memberId: string, nickname: string) => {
        if (!confirm(`정말로 '${nickname}' 멤버를 클럽에서 추방하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return

        try {
            const { error } = await supabase
                .from('club_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error

            setMembers(prev => prev.filter(m => m.id !== memberId))
            alert(`${nickname}님이 추방되었습니다.`)
        } catch (error: any) {
            console.error('Kick Error:', error)
            alert('추방 실패: ' + error.message)
        }
    }

    const filteredMembers = members.filter(m => {
        const p = m.profiles
        return (
            p?.nickname?.toLowerCase().includes(search.toLowerCase()) ||
            p?.real_name?.toLowerCase().includes(search.toLowerCase())
        )
    })

    if (loading) return <div className="p-10 text-center text-white/50">로딩중...</div>

    return (
        <div className="pb-10 space-y-6 bg-[#0A0E17] min-h-screen text-white pt-4 px-1">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 text-white/60">
                        &lt; 뒤로
                    </Button>
                    <h2 className="text-[22px] font-black tracking-tight uppercase italic">Member Manage</h2>
                </div>
                <p className="text-white/40 text-[14px] font-medium px-1">멤버 관리 및 운영진 설정</p>
            </header>

            <div className="relative px-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                    type="text"
                    placeholder="멤버 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121826] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] font-medium text-white focus:border-[#CCFF00] focus:bg-[#CCFF00]/5 transition-all outline-none placeholder:text-white/20"
                />
            </div>

            <div className="space-y-3 px-1">
                {filteredMembers.length === 0 ? (
                    <div className="py-20 text-center text-white/20 card-dashed rounded-2xl">검색 결과가 없습니다.</div>
                ) : (
                    filteredMembers.map((m) => {
                        const p = m.profiles
                        const isStaff = m.role === 'STAFF' || m.role === 'PRESIDENT'
                        const isPrez = m.role === 'PRESIDENT'

                        return (
                            <Card key={m.id} className="p-4 bg-[#121826] border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center text-white/20">
                                            {p?.photo_url ? (
                                                <img src={p.photo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-[15px]">{p?.nickname || 'Unknown'}</span>
                                                {isStaff && (
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isPrez ? 'bg-[#00D1FF]/10 text-[#00D1FF]' : 'bg-[#CCFF00]/10 text-[#CCFF00]'}`}>
                                                        {m.role}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-white/40 font-medium">{p?.real_name || '실명 미등록'}</p>
                                        </div>
                                    </div>
                                </div>

                                {!isPrez && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => toggleStaff(m.id, m.user_id, m.role)}
                                            className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-[12px] font-bold transition-all ${m.role === 'STAFF'
                                                ? 'bg-white/5 text-white/60 hover:bg-white/10'
                                                : 'bg-[#CCFF00]/10 text-[#CCFF00] hover:bg-[#CCFF00]/20'
                                                }`}
                                        >
                                            {m.role === 'STAFF' ? (
                                                <>
                                                    <Shield size={14} />
                                                    운영진 해제
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={14} />
                                                    운영진 임명
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleKickMember(m.id, p?.nickname || 'Unknown')}
                                            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-[12px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={14} />
                                            추방하기
                                        </button>
                                    </div>
                                )}
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}

