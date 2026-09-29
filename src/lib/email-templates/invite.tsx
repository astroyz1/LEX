import * as React from 'react'

import { Link, Text } from '@react-email/components'
import { LexEmailLayout, inlineLink, paragraph } from './email-layout'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <LexEmailLayout preview={`You've been invited to join ${siteName}`} heading="Join the LEX community" actionLabel="Accept invitation" actionUrl={confirmationUrl} footer="If you weren't expecting this invitation, you can safely ignore this email.">
    <Text style={paragraph}>You have been invited to join <Link href={siteUrl} style={inlineLink}>{siteName}</Link>, where India's legal community connects, learns and collaborates.</Text>
  </LexEmailLayout>
)

export default InviteEmail

