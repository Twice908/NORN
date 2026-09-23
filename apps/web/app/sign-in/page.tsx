import { AuthForm } from '@/components/auth/AuthForm'
import { signInAction } from '@/app/(auth)/actions'

export default function SignInPage() {
  return <AuthForm action={signInAction} mode="sign-in" />
}
