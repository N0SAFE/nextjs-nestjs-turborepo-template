import { Session } from '@/lib/auth/index'
import { create, StoreApi } from 'zustand'
// import { devtools, persist } from 'zustand/middleware' // add to the useSession store

interface SessionState {
    session: Session | null
    setSession: (session: Session | null) => void
}

const useSession = create<SessionState>()((set) => ({
    session: null,
    setSession: (session: Session | null) => set({ session }),
}))

export const subscribeToUserSession = (
    listener: (
        state: typeof useSession extends StoreApi<infer T> ? T : never,
        prevState: typeof useSession extends StoreApi<infer T> ? T : never
    ) => void
) => {
    return useSession.subscribe(listener)
}

export const getSession = () => useSession.getState().session

export const setSession = (session: Session | null) =>
    useSession.getState().setSession(session)
