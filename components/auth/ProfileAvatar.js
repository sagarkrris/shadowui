import { useState } from "react";
/* eslint-disable @next/next/no-img-element -- OAuth provider image hosts are dynamic. */

function initials(user = {}) {
  const value = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "?";
  return value.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export default function ProfileAvatar({ user, size = 32 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = user?.photoUrl && !imageFailed ? user.photoUrl : "";
  const style = { width: size, height: size, borderRadius: "50%", flex: "0 0 auto", display: "grid", placeItems: "center", overflow: "hidden", background: "#123252", color: "#fff", fontSize: Math.max(10, Math.round(size * .36)), fontWeight: 800, letterSpacing: ".02em" };
  return <span className="profile-avatar" style={style} aria-label={`${user?.firstName || "Account"} profile photo`} title={photoUrl ? "Profile photo from your connected account" : "Profile initials"}>{photoUrl ? <img src={photoUrl} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(user)}</span>;
}
