'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import {
    Settings,
    Shield,
    Calendar,
    Trophy,
    Award,
    ClipboardList,
    Dices,
    LayoutDashboard,
    ArrowRight,
    Users
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ClubAdminHubPage() {
    const {
        user,
        profile,
        isLoading: isAuthLoading,
        isStaff,
        isPresident,
        isAdmin: isSuperAdmin
    } = useAuth()

    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [myMemberRole, setMyMemberRole] = useState<string | null>(null)

    useEffect(() => {
        const checkAccess = async () => {
            if (isAuthLoading) return
            if (!user) {
                router.replace('/login')
                return
            }

            const clubId = profile?.club_id
            if (!clubId) {
                setLoading(false)
                return
            }

            const { data: memberData } = await supabase
                .from('club_members')
                .select('role')
                .eq('club_id', clubId)
                .eq('user_id', user.id)
                .maybeSingle()

            setMyMemberRole(memberData?.role || null)
            setLoading(false)
        }
        checkAccess()
    }, [user, profile?.club_id, isAuthLoading])

    const hasAccess = !!(
        myMemberRole === 'STAFF' ||
        myMemberRole === 'PRESIDENT' ||
        isStaff ||
        isSuperAdmin
    )

    if (isAuthLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-[#CCFF00]/20 border-t-[#CCFF00] rounded-full animate-spin" />
                <p className="text-white/40 font-medium tracking-widest text-[10px]">VERIFYING_ADMIN_ACCESS...</p>
            </div>
        )
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                    <Shield size={40} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white uppercase italic">Access Denied</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                        이 페이지는 클럽 운영진 전용 구역입니다.<br />
                        일반 회원은 접근할 수 없습니다.
                    </p>
                </div>
                <Button onClick={() => router.replace('/')}>홈으로 돌아가기</Button>
            </div>
        )
    }

    const adminMenus = [
        {
            title: "클럽 기본 설정",
            items: [
                {
                    label: "클럽 정보/로고 수정",
                    icon: <Settings size={18} />,
                    path: "/admin/settings",
                    desc: "클럽 프로필 및 로고 변경",
                    color: "bg-[#CCFF00] text-black"
                },
                {
                    label: "운영진 채용/해고 관리",
                    icon: <Shield size={18} />,
                    path: "/admin/staff",
                    desc: "운영진 권한 부여 및 해제",
                    color: "bg-white/10 text-white"
                }
            ]
        },
        {
            title: "경기 및 대회 운영",
            items: [
                {
                    label: "경기 스케줄 관리",
                    icon: <Calendar size={18} />,
                    path: "/admin/schedule",
                    desc: "정기 모임 및 경기 일정 생성",
                    color: "bg-blue-500 text-white"
                },
                {
                    label: "대회 관리 (토너먼트)",
                    icon: <Trophy size={18} />,
                    path: "/admin/tournament",
                    desc: "토너먼트 생성 및 자동 대진표",
                    color: "bg-purple-600 text-white"
                },
                {
                    label: "라운드별 대진표 생성",
                    icon: <Dices size={18} />,
                    path: "/admin/tournament", // Shortcut to the generator
                    desc: "수동/랜덤 팀 배정 및 대진표",
                    color: "bg-orange-500 text-white"
                }
            ]
        },
        {
            title: "데이터 및 시상",
            items: [
                {
                    label: "배지 및 시상 관리",
                    icon: <Award size={18} />,
                    path: "/admin/badges",
                    desc: "선수 배지 부여 및 수상 기록",
                    color: "bg-[#D4AF37] text-white"
                },
                {
                    label: "전체 경기 내역 관리",
                    icon: <ClipboardList size={18} />,
                    path: "/admin/history",
                    desc: "경기 결과 수정 및 이력 조회",
                    color: "bg-emerald-600 text-white"
                }
            ]
        }
    ]

    return (
        <div className="pb-20 space-y-8 bg-[#0A0E17] min-h-screen text-white pt-4">
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    <h2 className="text-[24px] font-black italic tracking-tighter uppercase">Admin <span className="text-[#CCFF00]">Hub</span></h2>
                </div>
                <p className="text-white/40 text-[12px] font-medium uppercase tracking-[0.2em]">Club Operations & Control Center</p>
            </header>

            <div className="space-y-10">
                {adminMenus.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-4">
                        <h3 className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">{section.title}</h3>
                        <div className="grid gap-3">
                            {section.items.map((item, iIdx) => (
                                <Card
                                    key={iIdx}
                                    onClick={() => router.push(item.path)}
                                    className="group relative overflow-hidden bg-white/5 border-white/5 p-4 hover:border-[#CCFF00]/30 transition-all cursor-pointer flex items-center gap-4"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[16px] text-white group-hover:text-[#CCFF00] transition-colors">{item.label}</h4>
                                        <p className="text-[12px] text-white/40 mt-0.5">{item.desc}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-white/10 group-hover:text-[#CCFF00] group-hover:translate-x-1 transition-all" />

                                    {/* Hover Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine" />
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Card className="bg-red-500/5 border-red-500/10 p-6 rounded-[30px] border-dashed text-center space-y-3 mt-10">
                <LayoutDashboard size={32} className="mx-auto text-red-500/40" />
                <div className="space-y-1">
                    <p className="text-[13px] font-bold text-red-500/80">운영 데이터 주의</p>
                    <p className="text-[11px] text-white/30 leading-relaxed">
                        모든 수정 내역은 실시간으로 반영되며<br />
                        클럽 멤버 전체에게 영향을 미칩니다. 신중히 조작해주세요.
                    </p>
                </div>
            </Card>
        </div>
    )
}
