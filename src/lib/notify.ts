// Login notification via EmailJS (designed for client-side use).
// Setup: https://www.emailjs.com
//   1. Create free account → Email Services → Connect Gmail
//   2. Email Templates → New Template (use variables: {{login_email}}, {{login_time}}, {{login_browser}})
//   3. Account → General → Public Key
//   4. Add to .env.local and Railway env vars:
//      VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
//      VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
//      VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx

export async function sendLoginNotification(userEmail: string) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) {
    console.warn('[notify] EmailJS not configured — skipping login notification')
    return
  }

  const loginTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          login_email: userEmail,
          login_time: loginTime,
          login_browser: navigator.userAgent.slice(0, 200),
        },
      }),
    })
  } catch (err) {
    console.warn('[notify] Failed to send login notification:', err)
  }
}
