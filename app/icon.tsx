import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #141018 0%, #08060A 100%)",
          borderRadius: 8,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="g" x1="8" y1="6" x2="42" y2="42">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="45%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#F5D0A8" />
            </linearGradient>
          </defs>
          <path
            d="M11 33 L11 13 L21 13 L21 23 L29 13 L35 13 L25 25 L35 33 L29 33 L21 27 L21 33 Z"
            fill="url(#g)"
          />
          <path
            d="M14 18 L32 30"
            stroke="#FFF5F0"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.35"
          />
          <circle cx="33" cy="15" r="1.6" fill="#FDA4AF" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
