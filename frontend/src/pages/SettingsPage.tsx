import { useAuth } from '@/lib/auth'
import { ExternalLink } from 'lucide-react'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function SettingsPage() {
  const { user, roles, accountUrl } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {accountUrl
            ? 'Your profile is managed by Zitadel.'
            : 'Local development identity. Production signs in through Zitadel.'}
        </p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        <Field label="Name" value={user?.name || '—'} />
        <Field label="Email" value={user?.email || '—'} />
        <Field label="Roles" value={roles.join(', ') || 'None assigned'} />
      </div>

      {accountUrl && (
        <a
          href={accountUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Manage account in Zitadel
        </a>
      )}
    </div>
  )
}
