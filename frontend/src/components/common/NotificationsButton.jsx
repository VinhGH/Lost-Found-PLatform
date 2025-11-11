import React from "react";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import "./NotificationsButton.css";

// Floating bell button positioned above the theme toggle
const btnStyle = {
  position: "fixed",
  right: "18px",
  bottom: "72px", // sit just above ThemeToggle (which is at 18px)
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  backgroundColor: "var(--btn-bg, #1e3a8a)",
  color: "white",
  border: "none",
  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease",
};

const iconStyle = { width: 22, height: 22 };

const btnHoverStyle = {
  transform: "translateY(-2px) scale(1.05)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
  filter: "brightness(1.08)",
};

export default function NotificationsButton() {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      aria-label="Thông báo"
      title="Thông báo"
      className="notifications-btn"
      onClick={() => {
        // Placeholder action; hook up to notifications page/panel later
        console.log("🔔 Notifications button clicked");
      }}
    >
      <NotificationsIcon style={{ width: 22, height: 22 }} />
    </button>
  );
}