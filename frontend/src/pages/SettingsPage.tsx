import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { ExternalLink } from 'lucide-react'

export function SettingsPage() {
  const { user, openSettings, roles } = useAuth()

  return (
    <div className="space-y-8">
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-success/10">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Card className="card-vine">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account information (managed by Kylehub)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ''} disabled className="bg-black/20 border-success/10" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-black/20 border-success/10" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={roles.join(', ') || 'No roles assigned'} disabled className="capitalize bg-black/20 border-success/10" />
          </div>
          <div className="pt-4">
            <Button onClick={openSettings} variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Manage Account in Kylehub
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Change your password, profile picture, and other account settings
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-vine">
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
              className="bg-black/20 border-success/10"
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
