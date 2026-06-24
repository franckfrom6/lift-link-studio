import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const ADMIN_EMAIL = 'franck.berthelot@from6agency.com'

interface PilotRequestAdminNotifyProps {
  email?: string
  role?: string
  firstName?: string
}

const PilotRequestAdminNotifyEmail = ({
  email,
  role,
  firstName,
}: PilotRequestAdminNotifyProps) => {
  const roleLabel = role === 'coach' ? 'Coach' : 'Athlète'
  const displayName = firstName && firstName !== '—' ? firstName : null
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Nouvelle demande pilote — {email}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nouvelle demande pilote 📥</Heading>
          <Section style={infoBox}>
            <Text style={label}>Email</Text>
            <Text style={value}>{email || '—'}</Text>
            <Hr style={hr} />
            <Text style={label}>Rôle</Text>
            <Text style={value}>{roleLabel}</Text>
            {displayName && (
              <>
                <Hr style={hr} />
                <Text style={label}>Prénom</Text>
                <Text style={value}>{displayName}</Text>
              </>
            )}
          </Section>
          <Text style={footer}>
            Connecte-toi à l&apos;admin 6way pour accepter ou refuser cette demande.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PilotRequestAdminNotifyEmail,
  subject: (data: Record<string, any>) =>
    `Nouvelle demande pilote — ${data.email ?? '?'} (${data.role === 'coach' ? 'Coach' : 'Athlète'})`,
  to: ADMIN_EMAIL,
  displayName: 'Pilot request — admin notify',
  previewData: { email: 'jane@example.com', role: 'athlete', firstName: 'Jane' },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '32px 24px',
}
const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#0a0a0a',
  margin: '0 0 24px',
}
const infoBox: React.CSSProperties = {
  backgroundColor: '#f5f7ff',
  border: '1px solid #e0e6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
}
const label: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: '#6b7280',
  margin: '0 0 4px',
  fontWeight: 600,
}
const value: React.CSSProperties = {
  fontSize: '15px',
  color: '#0a0a0a',
  margin: '0 0 12px',
  fontWeight: 600,
}
const hr: React.CSSProperties = {
  borderColor: '#e0e6ff',
  margin: '8px 0 12px',
}
const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '0',
}
