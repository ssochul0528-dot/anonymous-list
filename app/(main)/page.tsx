
'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardClient from './DashboardClient'
import LandingPage from './LandingPage'

export default function Page() {
    const { user, isLoading } = useAuth()

    // While purely loading, maybe show nothing or skeleton?
    // But AuthContext handles initial loading well now.

    // If we want a flashy landing page, we should check user presence.
    // NOTE: This runs on client. Since we relaxed middleware, unauth users reach here.

    if (isLoading) {
        return null // or a minimal loading spinner if needed, but layout handles it
    }

    if (!user) {
        return <LandingPage />
    }

    return <DashboardClient />
}
