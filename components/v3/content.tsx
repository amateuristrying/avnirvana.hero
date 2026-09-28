import type { ReactNode } from "react";

/* AV Nirvana India — the site's knowledge base, carried over from main so v3
 * says exactly what the live site says. Products live in
 * components/products/productData.tsx and the domains in the Domains screen. */

export const NAV_LINKS = [
  { label: "About us", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Brands", href: "#brands" },
  { label: "Domains", href: "#domains" },
  { label: "Contact", href: "#contact" },
] as const;

export const ABOUT = {
  tag: "About AV Nirvana",
  a: "Experience. Expertise.",
  b: "A more connected world",
  lead: "For over 17 years, we’ve been at the forefront of audio-visual innovation, bringing the world’s finest technologies to India.",
  pillars: [
    {
      tag: "Our vision",
      title: "A Trusted Leader in AV",
      desc: "To be India’s most trusted and influential AV distribution company for path-breaking and converging technologies across the AV space.",
    },
    {
      tag: "Our commitment",
      title: "With You at Every Stage",
      desc: "To support our partners at every stage, from pre-sales consultation and solution design to post-sales service and technical support, backed by pan-India reach, reliable logistics, in-house expertise and continuous training.",
    },
    {
      tag: "Our story",
      title: "17+ Years of Industry Expertise",
      desc: "Drawing on more than 17 years of industry expertise, we specialise in the distribution of world-class, premium audio-visual products and the delivery of advanced solutions for private cinemas, professional AV installations, and unique design-led environments.",
    },
    {
      tag: "Our mission",
      title: "Redefining What’s Possible",
      desc: "To deliver the world’s most advanced technologies and redefine the AV landscape through innovation, technical expertise and uncompromising customer support.",
    },
  ],
  /** `count` makes the figure count up from zero as it arrives. */
  facts: [
    { value: "17", suffix: "+", label: "years of expertise", count: true },
    { value: "EST.", suffix: " 2012", label: "", count: false },
    { value: "Pan-India", suffix: "", label: "reach & support", count: false },
    { value: "Mumbai", suffix: "", label: "experience centre", count: false },
  ],
} as const;

export const PRODUCTS_HEAD = {
  tag: "Our products",
  a: "Designed for performance,",
  b: "Built for scale",
  lead: "Premium audio, visual & distributed AV solutions imported and delivered with expert design support.",
} as const;

export const BRANDS_HEAD = {
  tag: "Our partners",
  a: "Brands we’ve",
  b: "Worked with",
  lead: "A curated portfolio of the world’s most respected names in audio-visual engineering.",
} as const;

export const DOMAINS_HEAD = {
  tag: "Spaces we transform",
  a: "Sound & vision,",
  b: "Built for every space",
  lead: "From intelligent homes to immersive commercial environments, we bring audio, video and automation together to transform the way spaces feel and function.",
} as const;

const MAP_ADDRESS = "8-C, Laxmi Industrial Estate, Suresh Nagar, Andheri West, Mumbai, Maharashtra 400053";

export const CONTACT = {
  tag: "Contact",
  a: "Experience",
  b: "Excellence",
  lead: "Our Mumbai experience centre is open for demos, design consultations and dealer training. Call ahead and we’ll set the room up for you.",
  phones: [
    { label: "+91 74004 14691", href: "tel:+917400414691" },
    { label: "+91 74004 14093", href: "tel:+917400414093" },
  ],
  email: "info@avnirvanaindia.com",
  address: ["8-C, Laxmi Industrial Estate, Suresh Nagar,", "Andheri West, Mumbai, Maharashtra 400053"],
  area: "Andheri West, Mumbai",
  mapsLink: "https://maps.app.goo.gl/4qd2RCxQY5sjqoZY6",
  mapEmbed: "https://www.google.com/maps?q=" + encodeURIComponent(MAP_ADDRESS) + "&z=16&output=embed",
} as const;

export const FOOTER = {
  tagline: ["Experience Excellence.", "EST. 2012."],
  copyright: "© 2026 AV Nirvana India. All Rights Reserved.",
} as const;

const icon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SOCIALS: { label: string; href: string; svg: ReactNode }[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100057145672980",
    svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" {...icon} />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/avnirvanaindia/",
    svg: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" {...icon} />
        <circle cx="12" cy="12" r="4.2" {...icon} />
        <path d="M17.6 6.4h.01" {...icon} strokeWidth={2.6} />
      </>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/av-nirvana-india/",
    svg: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" {...icon} />
        <rect x="2" y="9" width="4" height="12" {...icon} />
        <circle cx="4" cy="4" r="2" {...icon} />
      </>
    ),
  },
];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Placeholder brands, as on main — swap for the real partner logos. */
export const BRANDS: { name: string; tag: string; mark: ReactNode }[] = [
  { name: "AURALIS", tag: "Loudspeakers", mark: <><circle cx="16" cy="16" r="11" {...stroke} /><circle cx="16" cy="16" r="5" fill="currentColor" /></> },
  { name: "KORVEN", tag: "Amplification", mark: <path d="M5 26 16 6l11 20Z" {...stroke} /> },
  { name: "LUMENTA", tag: "Projection", mark: <><rect x="6" y="6" width="20" height="20" rx="3" transform="rotate(45 16 16)" {...stroke} /><circle cx="16" cy="16" r="3" fill="currentColor" /></> },
  { name: "SONIQ", tag: "Acoustics", mark: <path d="M3 16c3-8 6-8 9 0s6 8 9 0 6-8 8 0" {...stroke} /> },
  { name: "VERTEX", tag: "Displays", mark: <path d="M8 24V12M13 24V6M19 24V10M24 24V15" {...stroke} /> },
  { name: "HALCYON", tag: "Home Cinema", mark: <><circle cx="16" cy="16" r="11" {...stroke} /><path d="M16 5v22M5 16h22" {...stroke} /></> },
  { name: "NOVASTAGE", tag: "Pro Audio", mark: <path d="M16 4l3.5 8 8.5.8-6.5 5.6 2 8.6L16 22.6 8.5 27l2-8.6L4 12.8l8.5-.8Z" {...stroke} /> },
  { name: "ORBITAL", tag: "Control Systems", mark: <><ellipse cx="16" cy="16" rx="12" ry="5" {...stroke} /><circle cx="16" cy="16" r="4" fill="currentColor" /></> },
  { name: "ECHELON", tag: "Architectural", mark: <path d="M6 22l10-10 10 10M6 15l10-10 10 10" {...stroke} /> },
  { name: "PRISMA", tag: "Video Walls", mark: <><rect x="5" y="7" width="22" height="18" rx="2" {...stroke} /><path d="M5 16h22M16 7v18" {...stroke} /></> },
  { name: "TERRAWAVE", tag: "Outdoor Audio", mark: <><path d="M4 20c4-4 8-4 12 0s8 4 12 0" {...stroke} /><path d="M4 13c4-4 8-4 12 0s8 4 12 0" {...stroke} /></> },
  { name: "MONOLITH", tag: "Subwoofers", mark: <><rect x="8" y="4" width="16" height="24" rx="2" {...stroke} /><circle cx="16" cy="18" r="5" {...stroke} /></> },
];
