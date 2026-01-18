"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useMemo } from "react";

interface JitsiMeetingEmbedProps {
  roomName: string;
  displayName?: string | null;
  email?: string | null;
  subject?: string;
  jwt?: string | null;
}

function resolveDomain(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    return url.host;
  } catch {
    return baseUrl.replace(/^https?:\/\//, "");
  }
}

export function JitsiMeetingEmbed({
  roomName,
  displayName,
  email,
  subject,
  jwt,
}: JitsiMeetingEmbedProps) {
  const baseUrl = process.env.NEXT_PUBLIC_JITSI_BASE_URL || "https://meet.jit.si";
  const domain = useMemo(() => resolveDomain(baseUrl), [baseUrl]);
  const userInfo = {
    displayName: displayName || "Gost",
    email: email || "",
  };

  return (
    <div className="w-full rounded-xl overflow-hidden border bg-card shadow-sm">
      <JitsiMeeting
        domain={domain}
        roomName={roomName}
        jwt={jwt || undefined}
        userInfo={userInfo}
        configOverwrite={{
          prejoinPageEnabled: false,
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          subject: subject || "Live radionica",
        }}
        getIFrameRef={(iframe) => {
          iframe.style.height = "70vh";
          iframe.style.width = "100%";
        }}
      />
    </div>
  );
}
