export default {
  login: {
    stateChanged: 'Your login state has changed. Please try again.',
    title: 'Sign in',
    account: 'Account',
    password: 'Password',
    captcha: 'Verification code',
    remember: 'Remember account',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    submitting: 'Signing in...',
    otherMethods: 'Other sign-in methods',
    registerLink: 'Create account',
    ldapLink: 'Domain account',
    systemLink: 'System account',
    changePasswordTip: 'Your password must be changed. Please update it as soon as possible.',
    forgotTip: 'Please contact your administrator to reset the password',
    oauthUnavailable: 'This sign-in method is not configured for the current environment'
  },
  register: {
    title: 'Create account',
    nickname: 'Display name',
    email: 'Email',
    sendCode: 'Send code',
    submit: 'Register',
    submitting: 'Registering...',
    codeSent: 'A verification code has been sent to your email',
    success: 'Registration succeeded. Initial password: {password}'
  },
  ldap: {
    title: 'Domain account sign-in',
    account: 'Domain account'
  },
  mfa: {
    title: 'Two-factor authentication',
    description: 'Enter the code from your authenticator app',
    code: 'Authentication code',
    submit: 'Continue',
    expired: 'The authentication session has expired. Please sign in again.'
  },
  oauth: {
    processing: 'Completing third-party sign-in…',
    invalidState: 'Authorization state is invalid or expired. Please sign in again.',
    unsupported: 'This sign-in provider is not available yet.',
    failed: 'Third-party sign-in failed. Please try again.',
    backToLogin: 'Back to sign in'
  },
  bind: {
    title: 'Complete your account', description: 'For your first third-party sign-in, create a local account to continue.',
    account: 'Sign-in account', name: 'Name', password: 'Password', submit: 'Complete and sign in',
    hint: 'You can also sign in with this account and password.', success: 'Account created',
    accountRequired: 'Enter a sign-in account', accountInvalid: 'Use 3–20 letters, digits or underscores, starting with a letter',
    nameRequired: 'Enter your name', nameInvalid: 'Name must be at most 64 characters',
    passwordRequired: 'Enter a password', passwordInvalid: 'Use 8–72 characters with letters and digits'
  },
  validation: {
    accountRequired: 'Enter your account',
    accountLength: 'Account length must be between 3 and 20 characters',
    passwordRequired: 'Enter your password',
    captchaRequired: 'Enter the verification code',
    nicknameRequired: 'Enter a display name',
    emailRequired: 'Enter your email',
    emailInvalid: 'Enter a valid email address',
    ldapAccountRequired: 'Enter your domain account',
    mfaCodeRequired: 'Enter the authentication code'
  }
}
