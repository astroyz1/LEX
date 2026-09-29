import * as React from 'react'
import { Link, Text } from '@react-email/components'
import { LexEmailLayout, inlineLink, paragraph } from './email-layout'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <LexEmailLayout
    preview={`Confirm your email for ${siteName}`}
    heading="Welcome to the founding community"
    actionLabel="Confirm email"
    actionUrl={confirmationUrl}
    footer="If you didn't create a LEX account, you can safely ignore this email."
  >
    <Text style={paragraph}>
      Thank you for joining <Link href={siteUrl} style={inlineLink}>{siteName}</Link>, the professional workspace for India's legal community.
    </Text>
    <Text style={paragraph}>Confirm {recipient} to complete your account and begin setting up your professional profile.</Text>
  </LexEmailLayout>
)

export default SignupEmail

