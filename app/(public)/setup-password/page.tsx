import { redirect } from 'next/navigation'

export default function SetupPasswordPage() {
  redirect('/login?notice=legacy-claim-link-retired')
}
