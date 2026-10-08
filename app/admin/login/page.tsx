import { LoginForm } from './LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl text-ink">HallWay</p>
        <h1 className="mt-6 text-xl font-semibold text-ink">Sign in to your studio</h1>
        <p className="mt-1 text-sm text-muted">Clients, galleries and your site, in one place.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
