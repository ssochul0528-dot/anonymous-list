'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
    id: string
    role: string
    email: string
    nickname: string
    real_name: string
    photo_url?: string
    club_id?: string
}

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    isLoading: boolean
    isAdmin: boolean
    isPresident: boolean
    isStaff: boolean
    claimPresident: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        let mounted = true

        const fetchProfileInBackground = async (userId: string, currentUserEmail: string | undefined) => {
            try {
                let { data, error } = await supabase
                    .from('profiles')
                    .select('id, role, email, nickname, real_name, photo_url, club_id')
                    .eq('id', userId)
                    .single()

                if (error) {
                    // console.warn('Profile fetch warning:', error.message)
                }

                // Auto-promote ssochul@naver.com OR nickname 'ssochul' to PRESIDENT
                const isTargetUser =
                    currentUserEmail?.toLowerCase().trim() === 'ssochul@naver.com' ||
                    data?.nickname?.toLowerCase().trim() === 'ssochul' ||
                    data?.real_name?.toLowerCase().trim() === 'ssochul'

                if (isTargetUser && data?.role !== 'PRESIDENT') {
                    const { data: updatedData } = await supabase
                        .from('profiles')
                        .update({ role: 'PRESIDENT' })
                        .eq('id', userId)
                        .select()
                        .single()
                    if (updatedData) {
                        data = updatedData
                    } else {
                        // If update fails (e.g., RLS), manually set role for local state
                        data = { ...data, role: 'PRESIDENT' } as any
                    }
                }

                if (mounted) setProfile(data)
            } catch (e) {
                console.error('Error fetching profile in background:', e)
                if (mounted) setProfile(null)
            }
        }

        const initializeAuth = async () => {
            // 1. Get initial session
            const { data: { session } } = await supabase.auth.getSession()

            if (!mounted) return

            // 2. Set distinct auth state derived from session
            const currentUser = session?.user ?? null
            setUser(currentUser)
            setSession(session)

            // 3. Unblock UI immediately - The user is "Authenticated" enough to render the app
            setIsLoading(false)

            // 4. Fetch extra profile data in background
            if (currentUser) {
                fetchProfileInBackground(currentUser.id, currentUser.email)
            } else {
                setProfile(null)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                const currentUser = session?.user ?? null
                setUser(currentUser)
                setSession(session)
                setIsLoading(false) // Ensure loading is off on change too

                if (currentUser) {
                    fetchProfileInBackground(currentUser.id, currentUser.email)
                } else {
                    setProfile(null)
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [supabase, router])

    const claimPresident = async () => {
        if (!user) return
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'PRESIDENT' })
            .eq('id', user.id)

        if (!error) {
            // Re-fetch profile
            const { data } = await supabase
                .from('profiles')
                .select('id, role, email, nickname, real_name')
                .eq('id', user.id)
                .single()
            if (data) setProfile(data)
            alert('회장 권한이 활성화되었습니다!')
        } else {
            console.error('Claim error:', error)
            // Fallback for UI if DB update fails (RLS etc)
            setProfile(prev => prev ? { ...prev, role: 'PRESIDENT' } : null)
            alert('설정 완료! (UI 반영됨)')
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const isSystemPresident = !!(
        user?.email?.toLowerCase().includes('ssochul') ||
        profile?.nickname?.toLowerCase().includes('ssochul') ||
        profile?.real_name?.toLowerCase().includes('ssochul')
    )

    useEffect(() => {
        if (user && isSystemPresident) {
            console.log('✅ SYSTEM PRESIDENT DETECTED:', user.email)
            // Force role to PRESIDENT in local state
            if (profile && profile.role !== 'PRESIDENT') {
                setProfile(prev => prev ? { ...prev, role: 'PRESIDENT' } : null)
            }
        }
    }, [user?.id, profile?.id, isSystemPresident])

    const isAdmin = !!(profile?.role === 'ADMIN' || profile?.role === 'PRESIDENT' || isSystemPresident)
    const isPresident = !!(profile?.role === 'PRESIDENT' || isSystemPresident)
    const isStaff = !!(profile?.role === 'STAFF' || profile?.role === 'PRESIDENT' || profile?.role === 'ADMIN' || isSystemPresident)

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            isLoading,
            isAdmin,
            isPresident,
            isStaff,
            claimPresident,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
