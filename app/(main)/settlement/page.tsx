
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
    Settings,
    User as UserIcon,
    Calendar,
    CreditCard,
    Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SettlementPage() {
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
    const [balance, setBalance] = useState(0)
    const [settlements, setSettlements] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'status' | 'history' | 'expenses'>('status')

    useEffect(() => {
        // Removed aggressive redirect to prevent race conditions for President
        if (!isAuthLoading && user && !isStaff) {
            console.log('Warning: Not a staff member.')
        }
    }, [user, isStaff, isAuthLoading])

    useEffect(() => {
        fetchData()
    }, [user])

    const fetchData = async () => {
        if (!user || !isStaff) return
        setLoading(true)
        try {
            // 1. Fetch Settlements (Simplified for now)
            const { data: stlData } = await supabase
                .from('settlements')
                .select(`
                    *,
                    profiles:user_id (nickname, photo_url)
                `)
                .order('created_at', { ascending: false })
            setSettlements(stlData || [])

            // 2. Calculate Balance (Sum of all PAID settlements - Sum of all expenses)
            const { data: paidSums } = await supabase
                .from('settlements')
                .select('amount')
                .eq('status', 'PAID')

            const { data: expSums } = await supabase
                .from('expenses')
                .select('amount')

            const totalIncome = paidSums?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
            const totalExpense = expSums?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
            setBalance(totalIncome - totalExpense)

        } catch (error) {
            console.error('Error fetching settlement data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (isAuthLoading || (isStaff && loading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 font-medium">권한 확인 및 데이터를 불러오는 중...</p>
            </div>
        )
    }

    if (!isStaff) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <Shield size={40} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[#333D4B]">접근 권한이 없습니다</h3>
                    <p className="text-[#8B95A1] text-sm leading-relaxed">
                        이 페이지는 운영진 전용 구역입니다.<br />
                        회장님 계정임에도 이 메시지가 보인다면<br />
                        로그아웃 후 다시 로그인해 주세요.
                    </p>
                </div>
                <Button onClick={() => router.replace('/')}>홈으로 돌아가기</Button>
                {/* Visual debug for nickname */}
                <p className="text-[10px] text-gray-300">Nickname: {profile?.nickname}</p>
            </div>
        )
    }

    const handleApprove = async (id: string) => {
        const { error } = await supabase
            .from('settlements')
            .update({
                status: 'PAID',
                confirmed_at: new Date().toISOString(),
                confirmed_by: user?.id
            })
            .eq('id', id)

        if (!error) fetchData()
    }

    return (
        <div className="pb-10 space-y-6 bg-[#0A0E17] min-h-screen text-white">
            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0064FF] to-[#00D1FF] p-8 text-white shadow-2xl shadow-blue-500/30"
            >
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <p className="text-blue-100 text-sm font-medium mb-1">이번 달 정산 잔액</p>
                    <h2 className="text-[36px] font-black tracking-tight mb-6">
                        {balance.toLocaleString()}원
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { /* Opene Expense Modal (Not implemented yet) */ }}
                            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-2xl transition-all font-bold text-sm"
                        >
                            <Plus size={18} />
                            지출 등록
                        </button>
                        <button
                            onClick={() => router.push('/admin/history')}
                            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-2xl transition-all font-bold text-sm"
                        >
                            <Calendar size={18} />
                            경기 기록 관리
                        </button>
                        {isPresident && (
                            <button
                                onClick={() => router.push('/admin/staff')}
                                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 rounded-2xl transition-all font-bold text-sm col-span-2"
                            >
                                <Shield size={18} />
                                운영진 채용/해고 관리
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions / Tabs */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                {(['status', 'history', 'expenses'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === tab
                            ? 'bg-[#CCFF00] text-[#0A0E17] shadow-sm'
                            : 'text-white/40'
                            }`}
                    >
                        {tab === 'status' ? '결제 현황' : tab === 'history' ? '수입 내역' : '지출 내역'}
                    </button>
                ))}
            </div>

            {/* Recording Form (Simplified) */}
            <AnimatePresence>
                {isStaff && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <Card className="p-6 space-y-4 border-2 border-white/10 bg-[#121826]">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Plus size={18} className="text-[#CCFF00]" />
                                정산 내역 추가
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <input id="p_name" placeholder="이름 (또는 입금자명)" className="p-3 bg-white/5 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#CCFF00] text-white placeholder:text-white/20" />
                                <input id="p_amount" type="number" placeholder="금액" className="p-3 bg-white/5 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#CCFF00] text-white placeholder:text-white/20" />
                            </div>
                            <div className="flex gap-2">
                                <select id="p_type" className="flex-1 p-3 bg-white/5 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#CCFF00] font-medium text-white">
                                    <option value="GUEST">게스트비</option>
                                    <option value="DUES">월납/연납 회비</option>
                                    <option value="OTHER">기타 수입</option>
                                </select>
                                <select id="p_method" className="flex-1 p-3 bg-white/5 rounded-xl text-sm border-none focus:ring-2 focus:ring-[#CCFF00] font-medium text-white">
                                    <option value="CASH">현금 수납</option>
                                    <option value="TRANSFER">계좌 이체</option>
                                </select>
                            </div>
                            <Button
                                fullWidth
                                onClick={async () => {
                                    const name = (document.getElementById('p_name') as HTMLInputElement).value
                                    const amount = (document.getElementById('p_amount') as HTMLInputElement).value
                                    const type = (document.getElementById('p_type') as HTMLSelectElement).value
                                    const method = (document.getElementById('p_method') as HTMLSelectElement).value

                                    if (!name || !amount) return alert('정보를 입력해주세요.')

                                    const { error } = await supabase.from('settlements').insert({
                                        payer_name: name,
                                        amount: Number(amount),
                                        type,
                                        method,
                                        status: method === 'CASH' ? 'PAID' : 'PENDING',
                                        confirmed_at: method === 'CASH' ? new Date().toISOString() : null,
                                        confirmed_by: method === 'CASH' ? user?.id : null
                                    })

                                    if (!error) {
                                        alert('등록되었습니다.')
                                        fetchData()
                                            ; (document.getElementById('p_name') as HTMLInputElement).value = ''
                                            ; (document.getElementById('p_amount') as HTMLInputElement).value = ''
                                    }
                                }}
                            >
                                기록 저장하기
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Content */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-white">오늘의 정산 내역</h3>
                    <span className="text-[12px] text-[#CCFF00] font-bold bg-[#CCFF00]/10 px-2 py-1 rounded-lg">전체 {settlements.length}건</span>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400">데이터를 불러오는 중...</div>
                ) : settlements.length === 0 ? (
                    <Card className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <Wallet size={48} className="opacity-20" />
                        <p className="text-sm">정산 내역이 없습니다.</p>
                    </Card>
                ) : (
                    settlements.map((item) => (
                        <Card key={item.id} className="p-4 flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer bg-[#121826] border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                                    {item.profiles?.photo_url ? (
                                        <img src={item.profiles.photo_url} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <UserIcon size={24} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{item.payer_name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${item.method === 'CASH' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                                            }`}>
                                            {item.method === 'CASH' ? '현금' : '이체'}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-[#8B95A1] font-medium">
                                        {item.type === 'DUES' ? '정기회비' : item.type === 'GUEST' ? '게스트비' : '기타'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1">
                                <span className="font-black text-white">
                                    {Number(item.amount).toLocaleString()}원
                                </span>
                                {item.status === 'PAID' ? (
                                    <div className="flex items-center gap-1 text-emerald-500">
                                        <CheckCircle2 size={12} />
                                        <span className="text-[11px] font-bold">완납</span>
                                    </div>
                                ) : item.status === 'PENDING' ? (
                                    isStaff ? (
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            className="bg-[#CCFF00] text-[#0A0E17] text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg active:scale-95 transition-all"
                                        >
                                            승인하기
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Clock size={12} />
                                            <span className="text-[11px] font-bold">확인중</span>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-center gap-1 text-rose-500">
                                        <XCircle size={12} />
                                        <span className="text-[11px] font-bold">미납</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Quick Membership Summary (For Admin) */}
            {isStaff && (
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-5 space-y-2 border-l-4 border-[#CCFF00] bg-[#121826] border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-white/40">연납 회원</span>
                            <CreditCard size={16} className="text-[#CCFF00]" />
                        </div>
                        <p className="text-2xl font-black text-white">12명</p>
                    </Card>
                    <Card className="p-5 space-y-2 border-l-4 border-[#00D1FF] bg-[#121826] border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-white/40">월납 회원</span>
                            <Calendar size={16} className="text-[#00D1FF]" />
                        </div>
                        <p className="text-2xl font-black text-white">48명</p>
                    </Card>
                </div>
            )}
        </div>
    )
}
