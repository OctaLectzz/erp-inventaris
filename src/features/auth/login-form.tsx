'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { getDemoCredentialsAction, signInAction } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DemoAccountsSelector } from '@/features/auth/demo-accounts-selector'
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
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isFetchingDemo, setIsFetchingDemo] = useState(false)
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

  const handleSelectDemoAccount = async (role: UserRole) => {
    setErrorMessage(null)
    setActiveDemoRole(role)
    setIsFetchingDemo(true)

    try {
      const creds = await getDemoCredentialsAction(role)
      if (creds.success && creds.email && creds.password) {
        setValue('email', creds.email, { shouldValidate: true, shouldDirty: true })
        setValue('password', creds.password, { shouldValidate: true, shouldDirty: true })
        const roleLabel =
          role === 'administrator' || role === 'admin_gudang'
            ? tAuth('roles.administrator')
            : role === 'staff_gudang'
              ? tAuth('roles.staff_gudang')
              : tAuth('roles.auditor')
        setDemoFeedback(tAuth('login.demoFilledNotice', { role: roleLabel }))
      } else {
        setErrorMessage(tAuth('login.genericError'))
      }
    } catch {
      setErrorMessage(tAuth('login.genericError'))
    } finally {
      setIsFetchingDemo(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="space-y-1.5 pb-4 text-center sm:pb-6">
          <div className="bg-primary text-primary-foreground mx-auto flex h-10 w-10 items-center justify-center rounded-xl shadow-xs sm:h-11 sm:w-11">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-primary text-xl font-bold tracking-tight sm:text-2xl">{tAuth('login.title')}</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm">{tAuth('login.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6">
          {/* Demo Account Selection Feedback Banner */}
          {demoFeedback && (
            <div
              role="status"
              aria-live="polite"
              className="border-accent/40 bg-accent/10 text-accent-foreground dark:text-accent flex items-start gap-2.5 rounded-lg border p-3 text-xs font-semibold shadow-2xs"
            >
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 leading-relaxed">{demoFeedback}</p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3.5 text-sm"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-xs font-semibold">
                {tAuth('login.emailLabel')}
              </Label>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={tAuth('login.emailPlaceholder')}
                  disabled={isPending || isFetchingDemo}
                  className="pl-9"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-destructive text-xs font-medium">
                  {errors.email.message === 'emailRequired' ? tValidation('emailRequired') : tValidation('emailInvalid')}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground text-xs font-semibold">
                  {tAuth('login.passwordLabel')}
                </Label>
              </div>
              <div className="relative">
                <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={tAuth('login.passwordPlaceholder')}
                  disabled={isPending || isFetchingDemo}
                  className="pr-10 pl-9"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending || isFetchingDemo}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-destructive text-xs font-medium">
                  {errors.password.message === 'passwordRequired' ? tValidation('passwordRequired') : tValidation('passwordMinLength')}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" disabled={isPending || isFetchingDemo} className="w-full gap-2 font-semibold shadow-xs">
              {isPending ? (
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
              <span className="border-border w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2 font-medium">{tAuth('login.demoTitle')}</span>
            </div>
          </div>

          {/* Quick Demo Evaluation Selector */}
          <DemoAccountsSelector
            onSelectAccount={handleSelectDemoAccount}
            disabled={isPending || isFetchingDemo}
            isLoading={isFetchingDemo}
            activeRole={activeDemoRole}
          />

          {/* Phase Notice Footer */}
          <div className="bg-secondary/30 text-muted-foreground flex items-center gap-2 rounded-lg p-2.5 text-xs">
            <CheckCircle2 className="text-accent h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="leading-tight">{tAuth('login.phaseNotice')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
