function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function appUrl(env) {
  return String(env.APP_BASE_URL || env.NEXT_PUBLIC_APP_URL || "https://elevateprep.vercel.app").replace(/\/$/, "");
}

function emailContent({ type, email, firstName, token, env }) {
  const isVerification = type === "verify-email";
  const isPasswordReset = type === "password-reset";
  const isPasswordChanged = type === "password-changed";
  const isAccountDeleted = type === "account-deleted";
  const actionUrl = isVerification
    ? `${appUrl(env)}/api/auth?action=verify&token=${encodeURIComponent(token)}`
    : isPasswordReset ? `${appUrl(env)}/reset-password?token=${encodeURIComponent(token)}`
      : isPasswordChanged ? appUrl(env) : "";
  const title = isVerification
    ? "Verify your InterviewIQ account"
    : isPasswordReset ? "Reset your InterviewIQ password"
      : isPasswordChanged ? "Your InterviewIQ password was updated" : "Your InterviewIQ account was deleted";
  const actionLabel = isVerification ? "Verify email" : isPasswordReset ? "Reset password" : "Go to ElevatePrep";
  const actionBlock = actionUrl ? `<p style="margin:28px 0"><a href="${actionUrl}" style="background:#123252;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700">${actionLabel}</a></p>` : "";
  const bodyText = isAccountDeleted
    ? "Your account and associated InterviewIQ data were permanently deleted as requested."
    : isPasswordChanged
      ? "Your password was successfully updated. For your security, we signed out all existing sessions."
      : "Use the button below to continue securely. This link expires in 30 minutes.";
  const securityNotice = isPasswordChanged
    ? "If you did not make this change, contact support immediately."
    : "If you did not request this, you can safely ignore this email.";
  const greetingName = String(firstName || "").trim() || "there";
  return {
    subject: title,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17324d;max-width:560px;margin:0 auto;padding:32px 20px"><h1 style="font-size:24px;margin:0 0 16px">${title}</h1><p>Hello ${escapeHtml(greetingName)},</p><p>${bodyText}</p>${actionBlock}<p style="font-size:12px;color:#64748b">${securityNotice}</p></div>`,
    text: `${title}\n\nHello ${greetingName},\n\n${bodyText}${actionUrl ? `\n\n${isPasswordChanged ? "Go to ElevatePrep" : "Use this link within 30 minutes"}: ${actionUrl}` : ""}\n\n${securityNotice}`,
  };
}

export async function deliverAuthEmail({ type, email, firstName = "", token, userId, fetchImpl = fetch, env = process.env } = {}) {
  if (env.RESEND_API_KEY) {
    const content = emailContent({ type, email, firstName, token, env });
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: env.RESEND_FROM_EMAIL || "InterviewIQ <onboarding@resend.dev>", to: [email], ...content }),
    });
    if (!response.ok) {
      const error = new Error(`Resend responded with ${response.status}`);
      error.code = `RESEND_HTTP_${response.status}`;
      throw error;
    }
    return { delivered: true, configured: true, provider: "resend" };
  }
  const endpoint = env.EMAIL_WEBHOOK_URL;
  if (!endpoint) return { delivered: false, configured: false };
  const response = await fetchImpl(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(env.EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env.EMAIL_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ type, email, firstName, token, userId }) });
  if (!response.ok) {
    const error = new Error(`Email provider responded with ${response.status}`);
    error.code = `EMAIL_WEBHOOK_HTTP_${response.status}`;
    throw error;
  }
  return { delivered: true, configured: true };
}
