import * as React from 'react'

import { Text } from '@react-email/components'
import { LexEmailLayout, paragraph } from './email-layout'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <LexEmailLayout preview={`Reset your ${siteName} password`} heading="Reset your password" actionLabel="Reset password" actionUrl={confirmationUrl} footer="If you didn't request this, you can safely ignore the email. Your password will not change.">
    <Text style={paragraph}>We received a request to reset your {siteName} password. Use the secure link below to choose a new one.</Text>
  </LexEmailLayout>
)

export default RecoveryEmail

