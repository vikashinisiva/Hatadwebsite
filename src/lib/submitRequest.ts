import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface ClearanceFormData {
  tab: 'upload' | 'property'
  files: File[]
  address: string
  district: string
  taluk: string
  village: string
  surveyNo: string
  applicantName: string
  email: string
}

export async function submitRequest(
  session: Session,
  formData: ClearanceFormData,
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
      throw new Error(`Failed to upload ${file.name}: ${error.message}`)
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

  // Insert row via API route (uses service role)
  const insertRes = await fetch('/api/clearance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: requestId,
      userId,
      notifyEmail: formData.email,
      propertyDetails,
      documentUrls,
      deadline,
    }),
  })

  if (!insertRes.ok) {
    const data = await insertRes.json()
    throw new Error(data.error || 'Failed to submit request')
  }

  // Send notification email
  const notifyRes = await fetch('/api/clearance/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'submitted',
      id: requestId,
      notifyEmail: formData.email,
      deadline,
    }),
  })

  if (!notifyRes.ok) {
    console.error('Notification email failed, but request was submitted')
  }

  return requestId
}
