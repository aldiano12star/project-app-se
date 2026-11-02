import React from "react";

/**
 * Template Next.js App Router:
 * Berbeda dengan layout.tsx yang persisten, template.tsx di-mount ulang
 * setiap kali rute berpindah, memungkinkan transisi masuk (enter animation)
 * yang halus tanpa merusak state layout global.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-enter flex-1 flex flex-col w-full min-h-0">
      {children}
    </div>
  );
}
