export const theme = {
  colors: {
    background: "#0f1115",
    surface: "#171a21",
    surfaceAlt: "#1f232c",
    border: "#2a2f3a",
    primary: "#6c5ce7",
    primaryHover: "#7d6ff0",
    text: "#e8eaf0",
    textMuted: "#8b91a0",
    success: "#2ecc71",
    danger: "#e74c3c",
    warning: "#f1c40f",
    bubbleMine: "#6c5ce7",
    bubbleTheirs: "#1f232c",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "18px",
    full: "999px",
  },
  shadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
  breakpoints: {
    mobile: "640px",
  },
} as const;

export type AppTheme = typeof theme;
