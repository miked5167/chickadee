'use client'

import { useState, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, CheckCircle, MessageSquarePlus } from 'lucide-react'
import { z } from 'zod'

// Validation schema
const contactFormSchema = z.object({
  parentName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  eliteProspectsLink: z.string().optional(),
  message: z.string().min(50, 'Message must be at least 50 characters').max(1000, 'Message is too long'),
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
})

type ContactFormData = z.infer<typeof contactFormSchema>

interface ContactModalProps {
  advisorId: string
  advisorName: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ContactModal({
  advisorId,
  advisorName,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ContactModalProps) {
  const formId = useId()
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eliteProspectsLink, setEliteProspectsLink] = useState('')
  const [message, setMessage] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const resetForm = () => {
    setParentName('')
    setEmail('')
    setPhone('')
    setEliteProspectsLink('')
    setMessage('')
    setAgreedToTerms(false)
    setError(null)
    setSuccess(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setTimeout(resetForm, 300) // Wait for animation to complete
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate with Zod
    try {
      const formData: ContactFormData = {
        parentName,
        email,
        phone,
        eliteProspectsLink,
        message,
        agreedToTerms,
      }

      contactFormSchema.parse(formData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message)
      } else {
        setError('Validation failed. Please check your inputs.')
      }
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisor_id: advisorId,
          parent_name: parentName,
          email,
          phone: phone || null,
          elite_prospects_link: eliteProspectsLink || null,
          message,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error submitting contact form:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild suppressHydrationWarning>
        {trigger || (
          <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md" suppressHydrationWarning>
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            Contact This Advisor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          // Success State
          <div className="py-10">
            <div className="text-center">
              <div className="mb-6 flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Message Sent Successfully!</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Thank you for contacting <span className="font-semibold text-gray-900">{advisorName}</span>. They will get back to you shortly, typically within 24-48 hours.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700 px-8">
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Form State
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Contact {advisorName}</DialogTitle>
              <DialogDescription>
                Send a message to discuss your hockey development needs.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-l-red-500 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Parent Name */}
              <div>
                <Label htmlFor={`${formId}-parentName`} className="text-sm font-medium">
                  Your Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`${formId}-parentName`}
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                  className="mt-1.5"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor={`${formId}-email`} className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                  className="mt-1.5"
                />
              </div>

              {/* Phone and Elite Prospects Link in a row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${formId}-phone`} className="text-sm font-medium">
                    Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id={`${formId}-phone`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={loading}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor={`${formId}-eliteProspectsLink`} className="text-sm font-medium">
                    Elite Prospects Link <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    id={`${formId}-eliteProspectsLink`}
                    type="url"
                    value={eliteProspectsLink}
                    onChange={(e) => setEliteProspectsLink(e.target.value)}
                    placeholder="https://www.eliteprospects.com/..."
                    disabled={loading}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor={`${formId}-message`} className="text-sm font-medium">
                  Message <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id={`${formId}-message`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the advisor about your hockey goals and what you're looking for..."
                  required
                  rows={5}
                  disabled={loading}
                  className="w-full mt-1.5 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-colors"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs font-medium transition-colors ${
                    message.length === 0 ? 'text-gray-400' :
                    message.length < 50 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {message.length < 50 ? (
                      <>
                        <span className="font-semibold">{50 - message.length}</span> characters needed
                      </>
                    ) : (
                      <>
                        ✓ Minimum reached ({message.length} characters)
                      </>
                    )}
                  </p>
                  {message.length > 0 && message.length < 50 && (
                    <span className="text-xs text-amber-600">
                      50 character minimum
                    </span>
                  )}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      id={`${formId}-terms`}
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`${formId}-terms`} className="text-sm text-gray-700 leading-relaxed cursor-pointer block">
                      I agree to the <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">Terms of Service</a> and understand that my contact information will be shared with this advisor.
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !parentName || !email || !message || message.length < 50 || !agreedToTerms}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
