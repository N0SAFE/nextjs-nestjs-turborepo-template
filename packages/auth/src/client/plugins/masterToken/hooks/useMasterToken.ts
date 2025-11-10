import { useContext } from "react"
import { MasterTokenContextValue, MasterTokenContext } from "../components/context"

export const useMasterToken = (): MasterTokenContextValue => {
    const ctx = useContext(MasterTokenContext)
    if (!ctx) throw new Error('useMasterToken must be used inside MasterTokenProvider')
    return ctx
}