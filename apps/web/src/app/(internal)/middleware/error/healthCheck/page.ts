'use server'

export default async function HealthCheckPage(props: {
    searchParams?: Promise<{ json?: string }>
}) {
    const searchParams = await props.searchParams
    return searchParams?.json ? searchParams?.json : '{status: "ko"}'
}
