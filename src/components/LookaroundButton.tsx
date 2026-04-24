"use client";
import dynamic from "next/dynamic";

// Dynamic import prevents SSR issues with window.DeviceMotionEvent
const Lookaround = dynamic(() => import("./Lookaround"), { ssr: false });

export default function LookaroundButton() {
  return <Lookaround />;
}
