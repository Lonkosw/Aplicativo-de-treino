import React from "react";
import { Interactive } from "remotion";

// Moldura de celular usada nas cenas que mostram telas do app.
export const Phone: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  return (
    <Interactive.Div
      name="Phone"
      style={{
        width: 760,
        height: 1180,
        borderRadius: 88,
        backgroundColor: "#0A0A0B",
        border: "14px solid #26262A",
        boxShadow: "0 60px 160px rgba(225, 29, 43, 0.25)",
        overflow: "hidden",
        padding: "72px 44px 44px",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </Interactive.Div>
  );
};
