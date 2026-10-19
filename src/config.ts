export const SITE = {
  name: 'Rhinovate',
  tagline: '3D consultation software for rhinoplasty surgeons.',
  description:
    "Rhinovate turns an iPhone scan into a 3D model of your patient's face. Plan the nose together, then show how the recovery will unfold, from the first days to month 12.",
  /** Shown on the site and used when no form endpoint is configured. */
  contactEmail: 'rhinovateinc@gmail.com',
  /** Formspree-style endpoint. Leave empty to fall back to the visitor's email app. */
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? ''
};

export const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/healing', label: 'Recovery forecast' },
  { href: '/patients', label: 'For patients' },
  { href: '/about', label: 'About' }
];
