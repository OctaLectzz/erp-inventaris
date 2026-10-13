'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, Shield, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { signInAction, signInDemoAction } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema } from '@/schemas/auth-schema'

import type { LoginInput } from '@/schemas/auth-schema'
import type { UserRole } from '@/types/auth'

interface LoginFormProps {
  locale: string
  returnUrl?: string
}

export function LoginForm({ locale, returnUrl }: LoginFormProps) {
  const tAuth = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeDemoRole, setActiveDemoRole] = useState<UserRole | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      redirectTo: returnUrl
    }
  })

  const onSubmit = (data: LoginInput) => {
    setErrorMessage(null)
    startTransition(async () => {
      const result = await signInAction(data, locale)
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo)
        router.refresh()
      } else if (!result.success) {
        if (result.code === 'auth.invalidCredentials') {
          setErrorMessage(tAuth('login.invalidCredentials'))
        } else if (result.code === 'auth.unauthorizedProfile') {
          setErrorMessage(tAuth('login.unauthorizedProfile'))
        } else {
          setErrorMessage(tAuth('login.genericError'))
        }
      }
    })
  }

  const handleDemoLogin = (role: UserRole) => {
    setErrorMessage(null)
    setActiveDemoRole(role)
    const demoEmail = role === 'admin_gudang' ? 'admin@inventra.demo' : 'owner@inventra.demo'
    setValue('email', demoEmail)

    startTransition(async () => {
      const result = await signInDemoAction(role, locale)
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo)
        router.refresh()
      } else if (!result.success) {
        setErrorMessage(tAuth('login.genericError'))
        setActiveDemoRole(null)
      }
    })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">{tAuth('login.title')}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{tAuth('login.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                {tAuth('login.emailLabel')}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={tAuth('login.emailPlaceholder')}
                  disabled={isPending}
                  className="pl-9"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs font-medium text-destructive">
                  {errors.email.message === 'emailRequired' ? tValidation('emailRequired') : tValidation('emailInvalid')}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  {tAuth('login.passwordLabel')}
                </Label>
              </div>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={tAuth('login.passwordPlaceholder')}
                  disabled={isPending}
                  className="pr-10 pl-9"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-medium text-destructive">
                  {errors.password.message === 'passwordRequired' ? tValidation('passwordRequired') : tValidation('passwordMinLength')}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" disabled={isPending} className="w-full gap-2 font-semibold shadow-xs">
              {isPending && !activeDemoRole ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{tAuth('login.submitting')}</span>
                </>
              ) : (
                <span>{tAuth('login.submit')}</span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 font-medium text-muted-foreground">{tAuth('login.demoTitle')}</span>
            </div>
          </div>

          {/* Quick Demo Evaluation Buttons */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Admin Gudang Demo Button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDemoLogin('admin_gudang')}
              className="flex flex-col items-start gap-1 rounded-lg border border-border bg-secondary/40 p-3 text-left transition-all hover:border-accent hover:bg-secondary/70 focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Shield className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {tAuth('roles.admin_gudang')}
                </span>
                {isPending && activeDemoRole === 'admin_gudang' && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />}
              </div>
              <p className="line-clamp-1 font-mono text-[11px] text-muted-foreground">admin@inventra.demo</p>
              <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground/80">{tAuth('roles.adminDesc')}</p>
            </button>

            {/* Owner Demo Button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDemoLogin('owner')}
              className="flex flex-col items-start gap-1 rounded-lg border border-border bg-secondary/40 p-3 text-left transition-all hover:border-accent hover:bg-secondary/70 focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <UserCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {tAuth('roles.owner')}
                </span>
                {isPending && activeDemoRole === 'owner' && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />}
              </div>
              <p className="line-clamp-1 font-mono text-[11px] text-muted-foreground">owner@inventra.demo</p>
              <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground/80">{tAuth('roles.ownerDesc')}</p>
            </button>
          </div>

          {/* Phase Notice Footer */}
          <div className="flex items-center gap-2 rounded-lg bg-secondary/30 p-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="leading-tight">{tAuth('login.phaseNotice')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
