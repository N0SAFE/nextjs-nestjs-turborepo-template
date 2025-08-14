import { userSchema } from '@repo/api-contracts/common/user'
import { Card, CardContent } from '@repo/ui/components/shadcn/card'
import { User, CheckCircle, XCircle, Clock } from 'lucide-react'
import React from 'react'
import z from 'zod/v4'


type ListItemShowcaseProps = {
    users?: z.infer<typeof userSchema>[]
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'active':
            return <CheckCircle className="h-4 w-4 text-green-500" />
        case 'inactive':
            return <XCircle className="h-4 w-4 text-red-500" />
        case 'pending':
            return <Clock className="h-4 w-4 text-yellow-500" />
        default:
            return <User className="h-4 w-4 text-gray-500" />
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        case 'inactive':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
}

const ListItemShowcase: React.FC<ListItemShowcaseProps> =
    function ListItemShowcase({ users }) {
        if (!users || users.length === 0) {
            return (
                <div className="py-8 text-center">
                    <User className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <h3 className="text-muted-foreground text-lg font-medium">
                        No Users Found
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        There are no users to display at the moment.
                    </p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        API Users ({users.length})
                    </h3>
                    <span className="text-muted-foreground text-sm">
                        Showing {users.length} user
                        {users.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="grid gap-3">
                    {users.map((user) => (
                        <Card
                            key={user.id}
                            className="transition-shadow hover:shadow-md"
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-muted rounded-lg p-2">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {user.name}
                                            </div>
                                            <div className="text-muted-foreground text-sm">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(user.status)}
                                        <span
                                            className={`rounded-md px-2 py-1 text-xs ${getStatusColor(user.status)}`}
                                        >
                                            {user.status}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

export default ListItemShowcase
