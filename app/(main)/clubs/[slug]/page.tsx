import { redirect } from 'next/navigation'
import DashboardClient from '@/app/(main)/DashboardClient'

export default function ClubDashboardPage({ params }: { params: { slug: string } }) {
    if (params.slug === 'non') {
        redirect('/my-club')
    }
    return <DashboardClient clubSlug={params.slug} />
}
