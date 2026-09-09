import { redirect } from 'next/navigation'

export default function VerifyEmailPage() {
  redirect('/login?notice=legacy-claim-link-retired')
}
