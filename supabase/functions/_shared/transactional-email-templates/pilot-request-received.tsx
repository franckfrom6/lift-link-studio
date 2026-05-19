import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'F6GYM'

interface PilotRequestReceivedProps {
  firstName?: string
  role?: string
}

const PilotRequestReceivedEmail = ({ firstName, role }: PilotRequestReceivedProps) => {
  const roleLabel = role === 'coach' ? 'Coach' : 'Athlète'
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>On a bien reçu ta demande pilote {SITE_NAME} ⚡</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Merci{firstName ? `, ${firstName}` : ''} ! ⚡
          </Heading>
          <Text style={text}>
            On a bien reçu ta demande pour rejoindre le programme pilote de{' '}
            <strong>{SITE_NAME}</strong> en tant que <strong>{roleLabel}</strong>.
          </Text>
          <Text style={text}>
            Notre équipe va l'examiner sous peu. Si ta candidature est retenue,
            tu recevras un second email avec tes identifiants de connexion.
          </Text>
          <Text style={footer}>— L'équipe {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PilotRequestReceivedEmail,
  subject: 'Ta demande pilote F6GYM est bien reçue ⚡',
  displayName: 'Pilot request received',
  previewData: { firstName: 'Jane', role: 'athlete' },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
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
const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '32px 0 0',
}