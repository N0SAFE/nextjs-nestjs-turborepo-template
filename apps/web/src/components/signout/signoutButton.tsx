'use client'

import { signOut } from '@/lib/auth'
import { Button } from '@repo/ui/components/shadcn/button'
import { LogOut } from 'lucide-react'
import { revalidateAllAction } from './revalidateAll.action'

const SignOutButton = () => {
    return (
        <form
            action={async () => {
                await signOut({})
                revalidateAllAction()
            }}
        >
            <Button
                type="submit"
                variant="outline"
                className="flex items-center space-x-2"
            >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
            </Button>
        </form>
    )
}

export default SignOutButton
