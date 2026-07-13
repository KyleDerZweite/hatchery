import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { ExternalLink } from 'lucide-react'

export function SettingsPage() {
  const { user, roles, accountUrl } = useAuth()

  return (
    <div className="space-y-8">
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-success/10">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {accountUrl
              ? 'Your account information, managed by Zitadel'
              : 'Local development identity'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" value={user?.name ?? ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email ?? ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-roles">Roles</Label>
            <Input id="profile-roles" value={roles.join(', ') || 'No roles assigned'} readOnly />
          </div>
          {accountUrl && (
            <div className="pt-4">
              <a
                href={accountUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Manage account in Zitadel
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Change your password, profile picture, and other account settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
