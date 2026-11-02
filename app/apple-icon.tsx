import { ImageResponse } from "next/og";

// iOS home-screen icon (PNG), generated from the same monogram as app/icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #7d2537, #4a1220)" }}>
        <svg width="180" height="180" viewBox="0 0 512 512">
          <rect x="34" y="34" width="444" height="444" rx="86" fill="none" stroke="#d9c39a" strokeWidth="6" />
          <path fill="#faf6ef" d="M150 116h120v18h-28v240h88l34-62h18v94H150v-18h28V134h-28z" />
          <path fill="#c9a865" d="M346 150l20 30-20 30-20-30z" />
        </svg>
      </div>
    ),
    size,
  );
}
