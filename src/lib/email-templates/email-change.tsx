import * as React from 'react'

import { Link, Text } from '@react-email/components'
import { LexEmailLayout, inlineLink, paragraph } from './email-layout'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <LexEmailLayout preview={`Confirm your email change for ${siteName}`} heading="Confirm your new email" actionLabel="Confirm email change" actionUrl={confirmationUrl} footer="If you didn't request this change, please secure your account immediately.">
    <Text style={paragraph}>You requested to change your LEX email from <Link href={`mailto:${oldEmail}`} style={inlineLink}>{oldEmail}</Link> to <Link href={`mailto:${newEmail}`} style={inlineLink}>{newEmail}</Link>.</Text>
  </LexEmailLayout>
)

export default EmailChangeEmail

