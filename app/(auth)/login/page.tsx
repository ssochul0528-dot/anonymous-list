'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get('redirect') || '/profile'

    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.')
            return
        }

        setLoading(true)
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
                    },
                })
                if (error) throw error

                // If email confirmation is disabled in Supabase, data.session will be present immediately
                if (data.session) {
                    alert('회원가입이 완료되었습니다. 프로필을 설정해주세요.')
                    // Use window.location.href for consistency
                    window.location.href = redirectUrl
                    // Don't set loading to false here, as we are navigating
                } else {
                    alert('인증 메일이 발송되었습니다. 이메일을 확인해주세요.')
                    setIsSignUp(false)
                    setLoading(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                // Use window.location.href to force a full page reload and ensure cookies are sent to server properly
                // This resolves issues where middleware redirects back to login due to stale client state
                window.location.href = redirectUrl
            }
        } catch (err: any) {
            alert(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center p-4 selection:bg-[#CCFF00] selection:text-[#0A0E17]">
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="mb-10 text-center">
                    <h1 className="text-[42px] font-black italic text-white tracking-tighter uppercase mb-2">
                        MatchUp <span className="text-[#CCFF00]">Pro</span>
                    </h1>
                    <div className="space-y-1">
                        <p className="text-[#CCFF00] font-bold text-[14px] uppercase tracking-wider">
                            경기를 관리하면, 동호회가 굴러갑니다
                        </p>
                        <p className="text-white/40 text-[12px] font-medium leading-relaxed max-w-[280px] mx-auto">
                            경기 기록·랭킹·운영을 하나로 관리하는 테니스 경기 관리 앱
                        </p>
                    </div>
                </div>

                <Card className="w-full space-y-6 bg-[#121826] border-white/5 shadow-2xl p-8 rounded-[32px]">
                    {/* Email Login Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="이메일을 입력해주세요"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-14 rounded-2xl focus:border-[#CCFF00]/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Password</label>
                                <Input
                                    type="password"
                                    placeholder="비밀번호를 입력해주세요"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-14 rounded-2xl focus:border-[#CCFF00]/50 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            type="submit"
                            isLoading={loading}
                            className="bg-[#CCFF00] hover:bg-[#AACC00] text-[#0A0E17] font-black text-[15px] h-14 rounded-2xl shadow-[0_8px_20px_rgba(204,255,0,0.2)] transition-all active:scale-95"
                        >
                            {isSignUp ? 'JOIN WITH EMAIL' : 'LOGIN WITH EMAIL'}
                        </Button>
                    </form>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[13px] text-white/40 hover:text-[#CCFF00] font-bold transition-colors"
                        >
                            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 1초 회원가입'}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-[11px] opacity-20 font-medium leading-relaxed">
                            로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
