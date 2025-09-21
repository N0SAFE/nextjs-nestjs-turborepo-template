import { userSchema } from '@repo/api-contracts/common/user'
import { Card, CardContent } from '@repo/ui/components/shadcn/card'
import { User } from 'lucide-react'
import React from 'react'
import z from 'zod/v4'


type ListItemShowcaseProps = {
    users?: z.infer<typeof userSchema>[]
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
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

export default ListItemShowcase
