'use client'

import DashboardClient from '@/app/(main)/DashboardClient'

export default function ClubDashboardPage({ params }: { params: { slug: string } }) {
    return <DashboardClient clubSlug={params.slug} />
}
