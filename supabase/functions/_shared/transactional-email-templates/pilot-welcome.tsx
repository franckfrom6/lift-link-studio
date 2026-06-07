import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '6way'
const APP_URL = 'https://fit.from6agency.com'

interface PilotWelcomeProps {
  firstName?: string
  email?: string
  tempPassword?: string
  role?: string
}

const PilotWelcomeEmail = ({
  firstName,
  email,
  tempPassword,
  role,
}: PilotWelcomeProps) => {
  const roleLabel = role === 'coach' ? 'Coach' : 'Athlète'
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>Bienvenue sur {SITE_NAME} — ton accès est prêt ⚡</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Bienvenue{firstName ? `, ${firstName}` : ''} ! ⚡
          </Heading>
          <Text style={text}>
            Ta demande pour rejoindre le programme pilote de <strong>{SITE_NAME}</strong> a été
            acceptée. Ton compte <strong>{roleLabel}</strong> est prêt.
          </Text>

          <Section style={credentialsBox}>
            <Text style={credLabel}>Email de connexion</Text>
            <Text style={credValue}>{email || '—'}</Text>
            <Hr style={hr} />
            <Text style={credLabel}>Mot de passe temporaire</Text>
            <Text style={credValueMono}>{tempPassword || '—'}</Text>
          </Section>

          <Text style={text}>
            Connecte-toi dès maintenant et change ton mot de passe depuis ton profil.
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={APP_URL} style={button}>
              Me connecter à {SITE_NAME}
            </Button>
          </Section>

          <Text style={footer}>
            On a hâte de te voir progresser. — L'équipe {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PilotWelcomeEmail,
  subject: 'Bienvenue sur 6way — ton accès pilote est prêt ⚡',
  displayName: 'Pilot welcome',
  previewData: {
    firstName: 'Jane',
    email: 'jane@example.com',
    tempPassword: 'Temp-Passw0rd!',
    role: 'student',
  },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px',
}
const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#0a0a0a',
  margin: '0 0 20px',
}
const text: React.CSSProperties = {
  fontSize: '15px',
  color: '#404040',
  lineHeight: 1.6,
  margin: '0 0 16px',
}
const credentialsBox: React.CSSProperties = {
  backgroundColor: '#f5f7ff',
  border: '1px solid #e0e6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}
const credLabel: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#6b7280',
  margin: '0 0 4px',
  fontWeight: 600,
}
const credValue: React.CSSProperties = {
  fontSize: '15px',
  color: '#0a0a0a',
  margin: '0 0 12px',
  fontWeight: 600,
}
const credValueMono: React.CSSProperties = {
  fontSize: '15px',
  color: '#1A3CFF',
  margin: '0',
  fontWeight: 700,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}
const hr: React.CSSProperties = {
  borderColor: '#e0e6ff',
  margin: '12px 0',
}
const button: React.CSSProperties = {
  backgroundColor: '#1A3CFF',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700,
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '32px 0 0',
}