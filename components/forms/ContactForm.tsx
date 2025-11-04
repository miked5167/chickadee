'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
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

interface ContactFormProps {
  advisorId: string
  advisorName: string
}

export function ContactForm({ advisorId, advisorName }: ContactFormProps) {
  const router = useRouter()
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

      // Reset form
      setParentName('')
      setEmail('')
      setPhone('')
      setChildAge('')
      setMessage('')
      setAgreedToTerms(false)

      // Scroll to success message
      setTimeout(() => {
        document.getElementById('success-message')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Error submitting contact form:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="p-8" id="success-message">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for contacting {advisorName}. They will get back to you shortly.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline">
            Send Another Message
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Contact {advisorName}</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Parent Name */}
        <div>
          <Label htmlFor="parentName">Your Name *</Label>
          <Input
            id="parentName"
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
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={loading}
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={loading}
          />
        </div>

        {/* Child Age */}
        <div>
          <Label htmlFor="childAge">Child&apos;s Age (Optional)</Label>
          <Input
            id="childAge"
            type="number"
            min="1"
            max="25"
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            placeholder="Age"
            disabled={loading}
          />
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="message">Message *</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the advisor about your child's hockey goals and what you're looking for... (minimum 50 characters)"
            required
            rows={6}
            disabled={loading}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue disabled:opacity-50"
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length} / 50 characters minimum
          </p>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 mt-1 text-hockey-blue border-gray-300 rounded focus:ring-hockey-blue"
          />
          <Label htmlFor="terms" className="text-sm">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-hockey-blue hover:underline">
              Terms of Service
            </a>{' '}
            and understand that my contact information will be shared with this advisor.
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
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

        <p className="text-xs text-gray-500 text-center">
          Your information will be sent directly to {advisorName}. They typically respond within 24-48 hours.
        </p>
      </form>
    </Card>
  )
}
