import { redirect } from 'next/navigation'
import DashboardClient from '@/app/(main)/DashboardClient'

export default function ClubDashboardPage({ params }: { params: { slug: string } }) {
    if (params.slug === 'non') {
        redirect('/dashboard')
    }
    return <DashboardClient clubSlug={params.slug} />
}
