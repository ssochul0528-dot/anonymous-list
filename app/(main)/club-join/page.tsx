'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

export default function CreateClubPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        description: '',
        file: null as File | null
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            alert('로그인이 필요한 서비스입니다.')
            // Redirect to login page with explicit redirect back here
            router.push('/login?redirect=/club-join')
            return
        }

        if (!formData.name || !formData.region) {
            alert('클럽명과 활동 지역은 필수입니다.')
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            let logoUrl = null

            // 1. Upload Logo if exists
            if (formData.file) {
                const fileExt = formData.file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('club-logos')
                    .upload(fileName, formData.file)

                if (uploadError) {
                    console.error('Upload Error:', uploadError)
                    alert('로고 업로드 중 오류가 발생했습니다. (버킷 설정을 확인해주세요)')
                    // Continue without logo or stop? standard is stop usually, but let's warn
                } else {
                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('club-logos')
                        .getPublicUrl(fileName)
                    logoUrl = publicUrl
                }
            }

            // 2. Insert Request
            // Generate a slug from name (simple version)
            const slug = formData.name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000)

            const { error: insertError } = await supabase
                .from('clubs')
                .insert({
                    name: formData.name,
                    slug: slug,
                    description: formData.description,
                    region: formData.region,
                    logo_url: logoUrl,
                    owner_id: user.id,
                    status: 'PENDING' // Important: start as Pending
                })

            if (insertError) throw insertError

            alert('신청이 완료되었습니다! 슈퍼 마스터 승인 후 활동이 가능합니다.')
            router.push('/')

        } catch (error: any) {
            console.error('Error creating club:', error)
            alert('신청 중 오류가 발생했습니다: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // Removed the "if (!user) return login_prompt" block to allow public viewing.
    // Auth check is now only on submit.

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white pb-20">
            <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
                <button onClick={() => router.back()} className="text-white/60 hover:text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <h1 className="text-[18px] font-bold">클럽 개설 신청</h1>
            </header>

            <main className="p-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className="text-[24px] font-black italic mb-2">CREATE<br /><span className="text-[#CCFF00]">YOUR CLUB</span></h2>
                    <p className="text-white/40 text-[13px]">
                        나만의 클럽을 만들어보세요.<br />
                        슈퍼 마스터의 승인 후 정식 활동이 가능합니다.
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center">
                        <label className="relative cursor-pointer group">
                            <div className="w-24 h-24 rounded-[32px] bg-[#191F28] border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#CCFF00]/50">
                                {formData.file ? (
                                    <img src={URL.createObjectURL(formData.file)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <svg className="w-8 h-8 text-white/20 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        <span className="text-[10px] text-white/30 font-bold">LOGO</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#CCFF00] rounded-full flex items-center justify-center text-black shadow-lg">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                            </div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-white/60">클럽 이름</label>
                            <input
                                type="text"
                                className="w-full h-12 bg-[#191F28] border border-white/10 rounded-xl px-4 text-white focus:border-[#CCFF00] outline-none transition-colors font-bold placeholder:text-white/20"
                                placeholder="예: 무명 테니스 클럽"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-white/60">활동 지역</label>
                            <select
                                className="w-full h-12 bg-[#191F28] border border-white/10 rounded-xl px-4 text-white focus:border-[#CCFF00] outline-none transition-colors appearance-none font-bold"
                                value={formData.region}
                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                            >
                                <option value="" disabled>지역을 선택해주세요</option>
                                <option value="SEOUL">서울</option>
                                <option value="GYEONGGI">경기</option>
                                <option value="INCHEON">인천</option>
                                <option value="OTHER">기타</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-white/60">클럽 소개 (선택)</label>
                            <textarea
                                className="w-full h-32 bg-[#191F28] border border-white/10 rounded-xl p-4 text-white focus:border-[#CCFF00] outline-none transition-colors resize-none placeholder:text-white/20 text-[14px]"
                                placeholder="클럽의 특징이나 분위기를 소개해주세요."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        className="bg-[#CCFF00] text-black font-black mt-4 h-14 text-[16px] shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                        isLoading={loading}
                    >
                        {loading ? '신청 중...' : (user ? '클럽 개설 신청하기' : '로그인하고 신청하기')}
                    </Button>
                </form>
            </main>
        </div>
    )
}
