const BASE_URL = "https://nexinc.vercel.app";

export default function sitemap() {
  const now = new Date().toISOString();

  // Core public pages
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/models`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/forgot-password`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Localized login pages
  const loginLocales = ["de", "es", "fr", "hi"];
  const localizedLoginPages = loginLocales.map((locale) => ({
    url: `${BASE_URL}/login/${locale}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Localized signup pages
  const localizedSignupPages = loginLocales.map((locale) => ({
    url: `${BASE_URL}/signup/${locale}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...localizedLoginPages, ...localizedSignupPages];
}
