import { AuthForm } from '@/components/auth/AuthForm'
import { signUpAction } from '@/app/(auth)/actions'

export default function SignUpPage() {
  return <AuthForm action={signUpAction} mode="sign-up" />
}
