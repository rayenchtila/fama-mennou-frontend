import { Helmet } from "react-helmet-async";

const SITE_NAME    = "FamaMennou";
const SITE_URL     = "https://famamennou.tn";
const SITE_IMAGE   = "https://famamennou.tn/logo.png";
const TWITTER_HANDLE = "@famamennou";

export default function SEOHead({
  title,
  description = "FamaMennou — La plateforme tunisienne pour trouver des freelancers, des clients et des cours en ligne.",
  image = SITE_IMAGE,
  url,
  type = "website",
  keywords = "freelance tunisie, freelancer, cours en ligne, formation, projets, emploi, développeur, designer, marketing, tunisie",
  noIndex = false,
  schema = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Freelancers, Clients & Cours en Tunisie`;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Core */}
      <html lang="fr" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph — WhatsApp, Facebook, LinkedIn previews */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url"         content={canonical} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="fr_TN" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={TWITTER_HANDLE} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* Extra schema passed from page */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

export function OrganizationJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": SITE_NAME,
        "url": SITE_URL,
        "logo": SITE_IMAGE,
        "sameAs": [],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "areaServed": "TN",
          "availableLanguage": ["French", "Arabic"],
        },
        "description": "Plateforme tunisienne de freelance, cours en ligne et gestion de projets.",
      })}</script>
    </Helmet>
  );
}

export function WebSiteJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": SITE_NAME,
        "url": SITE_URL,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/freelancers?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      })}</script>
    </Helmet>
  );
}

export function CourseJsonLd({ course }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        "name": course.title,
        "description": course.description || course.title,
        "url": `${SITE_URL}/courses/${course.id}`,
        "image": course.cover_url || SITE_IMAGE,
        "provider": {
          "@type": "Organization",
          "name": SITE_NAME,
          "sameAs": SITE_URL,
        },
        "offers": {
          "@type": "Offer",
          "price": course.price ?? 0,
          "priceCurrency": "TND",
          "availability": "https://schema.org/InStock",
        },
        ...(course.rating ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": course.rating,
            "reviewCount": course.students_count || 1,
          }
        } : {}),
      })}</script>
    </Helmet>
  );
}

export function PersonJsonLd({ user }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        "name": user.name,
        "url": `${SITE_URL}/profile/${user.email}`,
        "image": user.avatar || SITE_IMAGE,
        "jobTitle": user.role === "freelancer" ? "Freelancer" : user.role,
        "worksFor": {
          "@type": "Organization",
          "name": SITE_NAME,
          "url": SITE_URL,
        },
        "description": user.bio || `${user.name} sur FamaMennou`,
      })}</script>
    </Helmet>
  );
}

export function BreadcrumbJsonLd({ items }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": item.name,
          "item": `${SITE_URL}${item.url}`,
        })),
      })}</script>
    </Helmet>
  );
}
