/**
 * Validate password strength.
 * Rules:
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter (A-Z)
 *   - At least 1 lowercase letter (a-z)
 *   - At least 1 number (0-9)
 *   - At least 1 special character (!@#$%^&* etc)
 */
export function validatePassword(password) {
  const errors = []

  if (!password || password.length < 8)
    errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password))
    errors.push('Password must contain at least one uppercase letter')
  if (!/[a-z]/.test(password))
    errors.push('Password must contain at least one lowercase letter')
  if (!/[0-9]/.test(password))
    errors.push('Password must contain at least one number')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    errors.push('Password must contain at least one special character')

  return {
    valid: errors.length === 0,
    errors,
    strength: errors.length === 0
      ? (password.length >= 12 ? 'strong' : 'good')
      : 'weak',
  }
}
