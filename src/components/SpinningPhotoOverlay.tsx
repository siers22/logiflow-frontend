"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import photo1 from "@/pictures/images.png";
import photo2 from "@/pictures/Black_Sun.svg";

const PHOTOS = [photo1, photo2];

export function SpinningPhotoOverlay() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const pressed = useRef(new Set<string>());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const wasCombo =
        pressed.current.has("AltLeft") && pressed.current.has("ShiftLeft");
      pressed.current.add(e.code);
      const isCombo =
        pressed.current.has("AltLeft") && pressed.current.has("ShiftLeft");

      if (isCombo && !wasCombo) {
        setVisible((v) => !v);
        return;
      }

      if (!visible) return;

      if (e.code === "ArrowUp" || e.code === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % PHOTOS.length);
      } else if (e.code === "ArrowDown" || e.code === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + PHOTOS.length) % PHOTOS.length);
      } else if (e.code === "Escape") {
        setVisible(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressed.current.delete(e.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [visible]);

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        cursor: "pointer",
        transition: "opacity 0.3s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Image
        src={PHOTOS[index]}
        alt="spinning"
        style={{
          width: "min(60vw, 60vh)",
          height: "min(60vw, 60vh)",
          objectFit: "cover",
          borderRadius: "50%",
          boxShadow: "0 0 80px 20px rgba(255,255,255,0.15)",
          animation: visible ? "logiflow-spin 3s linear infinite" : "none",
        }}
      />
      <style>{`
        @keyframes logiflow-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
