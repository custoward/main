import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 언어는 주소로 갈린다. 맨 위는 한국어로 보낸다.
      { source: "/", destination: "/ko", permanent: false },
    ];
  },
};

export default nextConfig;
