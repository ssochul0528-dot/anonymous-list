
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, Shield, ShieldCheck, Search } from 'lucide-react'
import { motion } from 'framer-motion'

export default function StaffManagementPage() {
    const { user, isPresident } = useAuth()
    const supabase = createClient()
    const router = useRouter()
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!isPresident && !loading) {
            router.replace('/')
        }
    }, [isPresident, loading, router])

    useEffect(() => {
        fetchProfiles()
    }, [])

    const fetchProfiles = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('nickname', { ascending: true })

        if (data) setProfiles(data)
        setLoading(false)
    }

    const toggleStaff = async (profileId: string, currentRole: string) => {
        const newRole = currentRole === 'STAFF' ? 'USER' : 'STAFF'
        setLoading(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profileId)

            if (error) throw error

            // Success: Update local state
            setProfiles(profiles.map(p => p.id === profileId ? { ...p, role: newRole } : p))
            alert(`운영진 권한이 ${newRole === 'STAFF' ? '부여' : '해제'}되었습니다.`)
        } catch (error: any) {
            console.error('Staff Update Error:', error)
            alert('권한 수정 실패: ' + (error.message || '알 수 없는 오류가 발생했습니다. 회장님 계정인지 다시 확인해주세요.'))

            // If it's a permission issue, the page might need a refresh to sync roles
            if (error.code === '42501' || error.message?.includes('permission')) {
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    const filteredProfiles = profiles.filter(p =>
        (p.nickname?.toLowerCase().includes(search.toLowerCase()) ||
            p.real_name?.toLowerCase().includes(search.toLowerCase())) &&
        p.role !== 'PRESIDENT'
    )

    if (!isPresident && !loading) return null

    return (
        <div className="pb-10 space-y-6 bg-[#0A0E17] min-h-screen text-white">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
                        &lt; 뒤로
                    </Button>
                    <h2 className="text-[22px] font-black tracking-tight">운영진 관리</h2>
                </div>
                <p className="text-white/40 text-[14px] font-medium">선수들에게 운영진 권한을 부여하거나 회수할 수 있습니다.</p>
            </header>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                    type="text"
                    placeholder="선수 이름 또는 닉네임 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border-none rounded-[20px] py-4 pl-12 pr-4 text-[15px] font-medium text-white shadow-sm focus:ring-2 focus:ring-[#CCFF00] transition-all outline-none placeholder:text-white/20"
                />
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 text-center text-gray-400">선수 목록을 불러오는 중...</div>
                ) : filteredProfiles.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">검색 결과가 없습니다.</div>
                ) : (
                    filteredProfiles.map((p) => (
                        <Card key={p.id} className="p-4 flex items-center justify-between hover:shadow-lg transition-all bg-[#121826] border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center text-white/20">
                                    {p.photo_url ? (
                                        <img src={p.photo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{p.nickname}</span>
                                        {p.role === 'STAFF' && (
                                            <span className="bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-black px-1.5 py-0.5 rounded-md">STAFF</span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-white/40 font-medium">{p.real_name || '실명 미등록'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleStaff(p.id, p.role)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-lg ${p.role === 'STAFF'
                                    ? 'bg-red-500 text-white active:scale-95'
                                    : 'bg-[#CCFF00] text-[#0A0E17] active:scale-95'
                                    }`}
                            >
                                {p.role === 'STAFF' ? (
                                    <>
                                        <Shield size={14} />
                                        권한 해제
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={14} />
                                        운영진 추가
                                    </>
                                )}
                            </button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
