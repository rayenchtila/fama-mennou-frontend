// components/SEOHead.jsx
// Drop-in SEO component — injects meta tags into <head>
// Usage: <SEOHead title="..." description="..." />
// Works with React Helmet or react-helmet-async
 
// ─── If you use react-helmet-async, install it:
// npm install react-helmet-async
// Then wrap your App in <HelmetProvider>
 
import { Helmet } from "react-helmet-async";
 
const SITE_NAME  = "Fama Mennou";

 
export default function SEOHead({
  title,
  description = "The all-in-one platform for modern professionals — find freelancers, clients, jobs, and courses.",
  image = SITE_IMAGE,
  url,
  type = "website",
  keywords = "freelancers, jobs, courses, remote work, hire, clients, platform",
  noIndex = false,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Where Talent Meets Opportunity`;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;
 
  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
 
      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={image} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:site_name"   content={SITE_NAME} />
 
      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={TWITTER_HANDLE} />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />
 
      {/* JSON-LD structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SITE_NAME,
          "url": SITE_URL,
          "description": description,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${SITE_URL}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}
      </script>
    </Helmet>
  );
}
 
// ── Breadcrumb structured data helper ────────────────────────
export function BreadcrumbJsonLd({ items }) {
  // items: [{ name: "Home", url: "/" }, { name: "Jobs", url: "/jobs" }]
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": items.map((item, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": item.name,
            "item": `${SITE_URL}${item.url}`,
          })),
        })}
      </script>
    </Helmet>
  );
}
 
// ── FAQ structured data helper ───────────────────────────────
export function FAQJsonLd({ faqs }) {
  // faqs: [{ question: "...", answer: "..." }]
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((f) => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer },
          })),
        })}
      </script>
    </Helmet>
  );
}
 
// ── Job posting structured data helper ───────────────────────
export function JobPostingJsonLd({ job }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": job.title,
          "description": job.description,
          "hiringOrganization": {
            "@type": "Organization",
            "name": job.company,
            "sameAs": SITE_URL,
          },
          "jobLocation": {
            "@type": "Place",
            "address": { "@type": "PostalAddress", "addressLocality": job.location },
          },
          "employmentType": job.type?.toUpperCase().replace("-", "_"),
          "datePosted": new Date().toISOString().split("T")[0],
          "baseSalary": job.salary
            ? { "@type": "MonetaryAmount", "currency": "USD", "value": job.salary }
            : undefined,
        })}
      </script>
    </Helmet>
  );
}
 
// ── Course structured data helper ────────────────────────────
export function CourseJsonLd({ course }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": course.title,
          "description": course.description,
          "provider": {
            "@type": "Organization",
            "name": SITE_NAME,
            "sameAs": SITE_URL,
          },
          "offers": {
            "@type": "Offer",
            "price": course.price ?? 0,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
          },
          "aggregateRating": course.rating
            ? { "@type": "AggregateRating", "ratingValue": course.rating, "reviewCount": course.students }
            : undefined,
        })}
      </script>
    </Helmet>
  );
}
 