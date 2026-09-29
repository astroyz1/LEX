import * as React from 'react'

import { Text } from '@react-email/components'
import { LexEmailLayout, paragraph } from './email-layout'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <LexEmailLayout preview={`Your secure ${siteName} sign-in link`} heading="Sign in to LEX" actionLabel="Sign in securely" actionUrl={confirmationUrl} footer="If you didn't request this sign-in link, you can safely ignore this email.">
    <Text style={paragraph}>Use the secure link below to enter your professional workspace. This link will expire shortly.</Text>
  </LexEmailLayout>
)

export default MagicLinkEmail

