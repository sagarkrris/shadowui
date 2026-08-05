function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function appUrl(env) {
  return String(env.APP_BASE_URL || env.NEXT_PUBLIC_APP_URL || "https://elevateprep.vercel.app").replace(/\/$/, "");
}

function emailContent({ type, email, token, env }) {
  const isVerification = type === "verify-email";
  const actionUrl = isVerification
    ? `${appUrl(env)}/api/auth?action=verify&token=${encodeURIComponent(token)}`
    : `${appUrl(env)}/reset-password?token=${encodeURIComponent(token)}`;
  const title = isVerification ? "Verify your InterviewIQ account" : "Reset your InterviewIQ password";
  const actionLabel = isVerification ? "Verify email" : "Reset password";
  return {
    subject: title,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17324d;max-width:560px;margin:0 auto;padding:32px 20px"><h1 style="font-size:24px;margin:0 0 16px">${title}</h1><p>Hello ${escapeHtml(email)},</p><p>Use the button below to continue securely. This link expires in 30 minutes.</p><p style="margin:28px 0"><a href="${actionUrl}" style="background:#123252;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">${actionLabel}</a></p><p style="font-size:12px;color:#64748b">If you did not request this, you can safely ignore this email.</p></div>`,
    text: `${title}\n\nHello ${email},\n\nUse this link within 30 minutes: ${actionUrl}\n\nIf you did not request this, ignore this email.`,
  };
}

export async function deliverAuthEmail({ type, email, token, userId, fetchImpl = fetch, env = process.env } = {}) {
  if (env.RESEND_API_KEY) {
    const content = emailContent({ type, email, token, env });
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: env.RESEND_FROM_EMAIL || "InterviewIQ <onboarding@resend.dev>", to: [email], ...content }),
    });
    if (!response.ok) throw new Error(`Resend responded with ${response.status}`);
    return { delivered: true, configured: true, provider: "resend" };
  }
  const endpoint = env.EMAIL_WEBHOOK_URL;
  if (!endpoint) return { delivered: false, configured: false };
  const response = await fetchImpl(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(env.EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env.EMAIL_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ type, email, token, userId }) });
  if (!response.ok) throw new Error(`Email provider responded with ${response.status}`);
  return { delivered: true, configured: true };
}
