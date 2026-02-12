'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { useCreateOrganization } from '@/domains/organization/hooks'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { mutate: createOrganization, isPending } = useCreateOrganization()
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    createOrganization({
      name: formData.name,
      slug: formData.slug,
    }, {
      onSuccess: (organization) => {
        router.push(`/dashboard/organizations/${organization.id}`)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground mt-2">Set up a new organization to manage your team and projects</p>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Acme Corporation"
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">This is your organization&apos;s display name</p>
            </div>

            <div>
              <Label htmlFor="slug">Organization Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="acme-corp"
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">Used in URLs (e.g., /org/acme-corp)</p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What does your organization do?"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">Optional brief description of your organization</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Organization'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { router.back() }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
