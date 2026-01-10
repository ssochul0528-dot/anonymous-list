
'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()
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
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                })
                if (error) throw error

                // If email confirmation is disabled in Supabase, data.session will be present immediately
                if (data.session) {
                    alert('회원가입이 완료되었습니다. 프로필을 설정해주세요.')
                    router.push('/profile')
                } else {
                    alert('인증 메일이 발송되었습니다. 이메일을 확인해주세요.')
                    setIsSignUp(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push('/profile')
            }
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-4">
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="mb-8 text-center">
                    <h1 className="text-[28px] font-bold text-[#333D4B] mb-2">무명리스트</h1>
                    <p className="text-[#6B7684]">테니스 클럽 운영의 새로운 기준</p>
                </div>

                <Card className="w-full space-y-6">
                    {/* Email Login Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="이메일을 입력해주세요"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <Input
                                type="password"
                                placeholder="비밀번호를 입력해주세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? '처리중...' : (isSignUp ? '이메일로 회원가입' : '이메일로 로그인')}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[14px] text-[#4E5968] hover:text-[#333D4B] underline underline-offset-4"
                        >
                            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-[13px] text-[#8B95A1]">
                            로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
