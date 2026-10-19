interface ImportMetaEnv {
  /** Formspree-style endpoint for the demo and waitlist forms. */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
