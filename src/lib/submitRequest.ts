import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface ClearanceFormData {
  files: File[]
  address: string
  district: string
  taluk: string
  village: string
  surveyNo: string
  applicantName: string
  email: string
  phone?: string
}

export async function submitRequest(
  session: Session,
  formData: ClearanceFormData,
  paymentId?: string,
): Promise<string> {
  const requestId = crypto.randomUUID()
  const userId = session.user.id
  const documentUrls: string[] = []

  // Upload files to Supabase Storage
  for (const file of formData.files) {
    const path = `${userId}/${requestId}/${file.name}`
    const { error } = await supabase.storage
      .from('clearance-documents')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      throw new Error(`We couldn\u2019t upload ${file.name}. Please check the file and try again.`)
    }
    documentUrls.push(path)
  }

  const deadline = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()

  const propertyDetails: Record<string, string> = {}
  if (formData.address) propertyDetails.address = formData.address
  if (formData.district) propertyDetails.district = formData.district
  if (formData.taluk) propertyDetails.taluk = formData.taluk
  if (formData.village) propertyDetails.village = formData.village
  if (formData.surveyNo) propertyDetails.surveyNo = formData.surveyNo
  if (formData.applicantName) propertyDetails.applicantName = formData.applicantName
  if (formData.phone) propertyDetails.phone = formData.phone

  // Insert row via API route (uses service role) — server also sends notification email
  const insertRes = await fetch('/api/clearance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      id: requestId,
      userId,
      notifyEmail: formData.email,
      propertyDetails,
      documentUrls,
      deadline,
      paymentId,
    }),
  })

  if (!insertRes.ok) {
    const data = await insertRes.json().catch(() => ({}))
    throw new Error(data?.error || 'Something went wrong while submitting your request. Please try again.')
  }

  return requestId
}
