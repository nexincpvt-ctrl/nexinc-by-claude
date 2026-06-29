export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/auth/", "/reset-password", "/verify-otp"],
      },
    ],
    sitemap: "https://nexinc.vercel.app/sitemap.xml",
  };
}
