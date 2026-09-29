import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface LexEmailLayoutProps {
  preview: string
  heading: string
  children: React.ReactNode
  actionLabel?: string
  actionUrl?: string
  footer: string
}

export function LexEmailLayout({
  preview,
  heading,
  children,
  actionLabel,
  actionUrl,
  footer,
}: LexEmailLayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={wordmark}>LEX</Text>
          <Section style={panel}>
            <Text style={eyebrow}>INDIA'S LEGAL COMMUNITY</Text>
            <Heading style={headingStyle}>{heading}</Heading>
            <Section style={content}>{children}</Section>
            {actionLabel && actionUrl ? (
              <Button style={button} href={actionUrl}>
                {actionLabel}
              </Button>
            ) : null}
            <Text style={footerStyle}>{footer}</Text>
          </Section>
          <Text style={signature}>Connect. Learn. Collaborate. Grow.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const paragraph = {
  color: '#b6bdcc',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 18px',
}

export const inlineLink = { color: '#8ea5ff', textDecoration: 'underline' }

export const code = {
  backgroundColor: '#0c0e13',
  border: '1px solid #303747',
  borderRadius: '6px',
  color: '#f3f5fa',
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  margin: '8px 0 24px',
  padding: '18px 20px',
  textAlign: 'center' as const,
}

const main = {
  backgroundColor: '#0c0e13',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: 0,
  padding: '32px 12px',
}
const container = { margin: '0 auto', maxWidth: '560px' }
const wordmark = {
  color: '#f3f5fa',
  fontFamily: 'Georgia, Times New Roman, serif',
  fontSize: '30px',
  letterSpacing: '1px',
  margin: '0 0 20px',
}
const panel = {
  backgroundColor: '#151821',
  border: '1px solid #272d3a',
  borderRadius: '8px',
  padding: '36px 34px',
}
const eyebrow = {
  color: '#7f91d9',
  fontSize: '11px',
  fontWeight: 'bold' as const,
  letterSpacing: '1.5px',
  margin: '0 0 14px',
}
const headingStyle = {
  color: '#f3f5fa',
  fontFamily: 'Georgia, Times New Roman, serif',
  fontSize: '30px',
  fontWeight: 'normal' as const,
  lineHeight: '38px',
  margin: '0 0 20px',
}
const content = { margin: 0 }
const button = {
  backgroundColor: '#5b7cfa',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '8px 0 4px',
  padding: '13px 20px',
  textDecoration: 'none',
}
const footerStyle = {
  borderTop: '1px solid #272d3a',
  color: '#7f8798',
  fontSize: '12px',
  lineHeight: '19px',
  margin: '30px 0 0',
  padding: '22px 0 0',
}
const signature = {
  color: '#666e7d',
  fontSize: '12px',
  margin: '18px 0 0',
  textAlign: 'center' as const,
}