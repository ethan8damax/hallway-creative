export type ContactFormData = {
  name: string
  email: string
  eventType?: string
  message: string
  company?: string
}

export function validateContactForm(data: ContactFormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.name?.trim()) errors.name = 'Name is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) errors.email = 'Valid email is required'
  if (!data.message?.trim()) errors.message = 'Message is required'
  return errors
}
