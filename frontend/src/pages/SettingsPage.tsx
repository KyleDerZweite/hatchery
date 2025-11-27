import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={user?.username || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user?.role || ''} disabled className="capitalize" />
          </div>
          <div className="space-y-2">
            <Label>Member Since</Label>
            <Input 
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} 
              disabled 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure external API keys for modpack fetching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CurseForge API Key</Label>
            <Input 
              type="password" 
              placeholder="Configure in server environment" 
              disabled 
            />
            <p className="text-xs text-muted-foreground">
              CurseForge API key is configured on the server via CURSEFORGE_API_KEY environment variable
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
