'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Trophy, User, Plus, ClipboardCheck, X, Menu, Users } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function FloatingHome() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const { user, profile } = useAuth()
    const [myClubSlug, setMyClubSlug] = useState<string | null>(null)

    React.useEffect(() => {
        const fetchSlug = async () => {
            if (user && profile?.club_id) {
                const supabase = createClient()
                const { data } = await supabase.from('clubs').select('slug').eq('id', profile.club_id).maybeSingle()
                if (data) setMyClubSlug(data.slug)
            }
        }
        fetchSlug()
    }, [user, profile?.club_id])

    if (!user) return null

    const toggleMenu = () => setIsOpen(!isOpen)

    const actions = [
        {
            id: 'home',
            icon: <Home size={20} />,
            label: '메인',
            path: '/',
            color: 'bg-white/10 text-white'
        },
        {
            id: 'my-club',
            icon: <Users size={20} />,
            label: '내 클럽',
            path: myClubSlug ? `/clubs/${myClubSlug}` : '/select-club',
            color: 'bg-[#CCFF00] text-black'
        },
        {
            id: 'score',
            icon: <Plus size={20} />,
            label: '점수입력',
            path: '/score',
            color: 'bg-blue-500 text-white'
        },
        {
            id: 'ranking',
            icon: <Trophy size={20} />,
            label: '선수 랭킹',
            path: '/rankings',
            color: 'bg-orange-500 text-white'
        },
    ]

    // Add Admin actions if privileged
    if (profile?.role === 'PRESIDENT' || profile?.role === 'STAFF') {
        actions.push({
            id: 'tournament',
            icon: <Plus size={20} />,
            label: '대회 생성',
            path: '/admin/tournament',
            color: 'bg-purple-600 text-white'
        })
        actions.push({
            id: 'admin-settings',
            icon: <Menu size={20} />,
            label: '환경 설정',
            path: '/admin/settings',
            color: 'bg-gray-700 text-white'
        })
    }

    // Special logic for My Club path if we have slug
    // (In a real app, we might need to fetch the slug if only ID exists, 
    // but for now let's use the ID/Slug from profile if available)

    const handleNavigate = (path: string) => {
        router.push(path)
        setIsOpen(false)
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 pointer-events-none z-[9998]">
                        {actions.map((action, index) => {
                            // Calculate angle for radial/rainbow layout
                            // We want items to spread from 210 degrees to -30 degrees (arc above)
                            const total = actions.length;
                            const startAngle = 210;
                            const endAngle = -30;
                            const angleStep = total > 1 ? (startAngle - endAngle) / (total - 1) : 0;
                            const angle = startAngle - (index * angleStep);
                            const radian = (angle * Math.PI) / 180;
                            const radius = 110; // Distance from center

                            const x = radius * Math.cos(radian);
                            const y = radius * Math.sin(radian) * -1; // Negative because Y grows downwards in CSS

                            return (
                                <motion.button
                                    key={action.id}
                                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        x: x,
                                        y: y,
                                        transition: { delay: index * 0.03, type: 'spring', stiffness: 200, damping: 15 }
                                    }}
                                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                    onClick={() => handleNavigate(action.path)}
                                    className="fixed left-1/2 bottom-[60px] -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1 group z-[9999]"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 ${action.color} group-hover:scale-110 active:scale-95 transition-all`}>
                                        {action.icon}
                                    </div>
                                    <span className="text-white text-[9px] font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                        {action.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                onClick={toggleMenu}
                className={`pointer-events-auto w-16 h-16 rounded-[24px] shadow-[0_15px_35px_rgba(204,255,0,0.3)] border-4 flex items-center justify-center transition-all z-[10000] ${isOpen
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-[#CCFF00] border-[#0A0E17] text-black scale-110'
                    }`}
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: isOpen ? 90 : 0 }}
            >
                {isOpen ? <X size={32} strokeWidth={3} /> : <Plus size={32} strokeWidth={4} />}
            </motion.button>

            {/* Backdrop Blur when open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-[#0A0E17]/60 backdrop-blur-sm z-[-1] pointer-events-auto"
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
