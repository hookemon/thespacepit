import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy thespacepit.com/lab* to the standalone spacepit-lab Vercel
  // deployment (the Vite music-tools app). The lab's Vite build uses
  // `base: '/lab/'` so its own asset paths line up with this prefix on
  // either origin — index.html refs `/lab/assets/...`, which the rewrite
  // forwards back to spacepit-lab's `/lab/assets/...` (the lab project's
  // own vercel.json strips the prefix to serve from /assets).
  async rewrites() {
    return [
      { source: "/lab", destination: "https://spacepit-lab.vercel.app/lab" },
      { source: "/lab/", destination: "https://spacepit-lab.vercel.app/lab/" },
      { source: "/lab/:path*", destination: "https://spacepit-lab.vercel.app/lab/:path*" },
    ];
  },
};

export default nextConfig;
