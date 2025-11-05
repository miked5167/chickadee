'use client'

import { useState } from 'react'
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
  childAge: z.string().optional(),
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
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [childAge, setChildAge] = useState('')
  const [message, setMessage] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const resetForm = () => {
    setParentName('')
    setEmail('')
    setPhone('')
    setChildAge('')
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
        childAge,
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
          child_age: childAge ? parseInt(childAge) : null,
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
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md">
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            Contact This Advisor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          // Success State
          <div className="py-8">
            <div className="text-center">
              <div className="mb-6 flex items-center justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Message Sent Successfully!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Thank you for contacting {advisorName}. They will get back to you shortly, typically within 24-48 hours.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={resetForm} variant="outline">
                  Send Another Message
                </Button>
                <Button onClick={() => setOpen(false)}>
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
                Send a message to discuss your hockey development needs. Response typically within 24-48 hours.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Parent Name */}
              <div>
                <Label htmlFor="modal-parentName">Your Name *</Label>
                <Input
                  id="modal-parentName"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="modal-email">Email Address *</Label>
                <Input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* Phone and Child Age in a row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="modal-phone">Phone Number (Optional)</Label>
                  <Input
                    id="modal-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="modal-childAge">Player Age (Optional)</Label>
                  <Input
                    id="modal-childAge"
                    type="number"
                    min="1"
                    max="25"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="Age"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="modal-message">Message *</Label>
                <textarea
                  id="modal-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the advisor about your hockey goals and what you're looking for..."
                  required
                  rows={5}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 resize-none"
                />
                <p className={`text-sm mt-1 ${message.length < 50 ? 'text-gray-500' : 'text-green-600'}`}>
                  {message.length} / 50 characters minimum
                  {message.length >= 50 && ' ✓'}
                </p>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="modal-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
                <Label htmlFor="modal-terms" className="text-sm">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and understand that my contact information will be shared with this advisor.
                </Label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !parentName || !email || !message || message.length < 50 || !agreedToTerms}
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
