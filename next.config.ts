import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships native (.node) bindings — bundling it like ordinary JS
  // breaks those at runtime, so it must stay an external require both for
  // Next's own image optimizer (handled automatically) and for our own
  // direct `import sharp` in src/lib/upload.ts (this entry is what makes
  // that one work too).
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      // Uploaded question images (question.imageUrl) are same-origin in
      // production (NEXT_PUBLIC_UPLOADS_URL serves off the app's own
      // domain via Nginx — see README §12), so no entry is needed here for
      // them. Add one only if uploads ever move to a separate subdomain/CDN.
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
