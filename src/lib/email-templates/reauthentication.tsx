import * as React from 'react'

import { Text } from '@react-email/components'
import { LexEmailLayout, code, paragraph } from './email-layout'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <LexEmailLayout preview="Your LEX verification code" heading="Confirm your identity" footer="This code expires shortly. If you didn't request it, you can safely ignore this email.">
    <Text style={paragraph}>Use this verification code to continue securely:</Text>
    <Text style={code}>{token}</Text>
  </LexEmailLayout>
)

export default ReauthenticationEmail

