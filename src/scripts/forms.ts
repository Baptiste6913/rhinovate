/**
 * Demo and waitlist forms.
 * With PUBLIC_FORM_ENDPOINT set (a Formspree-style endpoint), submissions are posted there.
 * Without it, the visitor's email app opens with the request filled in, so nothing is lost.
 */
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function setError(input: HTMLInputElement, message: string) {
  const err = document.getElementById(input.getAttribute('aria-describedby') ?? '');
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (err) {
    err.textContent = message;
    err.hidden = !message;
  }
}

function validate(form: HTMLFormElement): boolean {
  let first: HTMLInputElement | null = null;
  form.querySelectorAll<HTMLInputElement>('input[required]').forEach((input) => {
    const value = input.value.trim();
    let message = '';
    if (!value) message = input.dataset.missing ?? 'This field is required.';
    else if (input.type === 'email' && !emailOk(value)) message = 'Enter an email like you@clinic.com.';
    setError(input, message);
    if (message && !first) first = input;
  });
  if (first) (first as HTMLInputElement).focus();
  return !first;
}

function mailtoFor(form: HTMLFormElement, to: string): string {
  const data = new FormData(form);
  const lines: string[] = [];
  data.forEach((value, key) => {
    if (key.startsWith('_') || !String(value).trim()) return;
    lines.push(`${key[0].toUpperCase()}${key.slice(1)}: ${value}`);
  });
  const subject = form.dataset.subject ?? 'Rhinovate request';
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function showDone(form: HTMLFormElement, title: string, text: string) {
  const done = document.getElementById(form.dataset.done ?? '');
  if (!done) return;
  const h = done.querySelector('[data-done-title]');
  const p = done.querySelector('[data-done-text]');
  if (h) h.textContent = title;
  if (p) p.textContent = text;
  form.hidden = true;
  done.hidden = false;
  (done as HTMLElement).focus({ preventScroll: true });
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validate(form)) return;
      const endpoint = form.dataset.endpoint ?? '';
      const to = form.dataset.email ?? '';
      const name = (form.elements.namedItem('name') as HTMLInputElement | null)?.value.trim();
      const email = (form.elements.namedItem('email') as HTMLInputElement | null)?.value.trim() ?? '';
      const kind = form.dataset.form;
      const sentTitle = kind === 'demo' ? 'Demo requested' : "You're on the waitlist";
      const sentText = kind === 'demo'
        ? `Thank you${name ? `, ${name}` : ''}. We will email ${email} to schedule your demo.`
        : `We will write to ${email} when you can try Rhinovate.`;

      if (!endpoint) {
        window.location.href = mailtoFor(form, to);
        showDone(form, 'Your email app is opening', `Your request is written and ready. Send it to complete it, or write to ${to} directly.`);
        return;
      }

      const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const label = button?.textContent ?? '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Sending';
      }
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        showDone(form, sentTitle, sentText);
      } catch {
        const status = form.querySelector<HTMLElement>('[data-form-status]');
        if (status) {
          status.hidden = false;
          status.textContent = `The request could not be sent. Try again, or write to ${to}.`;
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = label;
        }
      }
    });
  });
}
