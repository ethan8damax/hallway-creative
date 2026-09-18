import { LoginForm } from './LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-3xl text-ink">Admin login</h1>
      <p className="mt-2 text-muted">Enter your email for a login link.</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  )
}
