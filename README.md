# Rhinovate website

Marketing site for Rhinovate, 3D consultation software for rhinoplasty surgeons: planning on a 3D model of the patient's face, and a recovery forecast from the first days to month 12.

The site is static. The home page and the recovery forecast page carry a live 3D demo that runs in the browser on a generic demo face.

## Stack

- [Astro](https://astro.build) 7, static output
- [three.js](https://threejs.org) for the 3D demo, drawn from a worker on Chromium-based browsers
- Mona Sans (variable), self-hosted through Fontsource
- No UI framework, no tracking and no third-party request

Node.js 22.22 or later.

## Scripts

```sh
npm install
npm run dev       # local server with hot reload
npm run build     # static site in dist/
npm run preview   # serve the build locally
```

## Configuration

Copy `.env.example` to `.env` and fill in what you need.

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Public URL of the site, for example `https://www.example.com`. Enables canonical links, absolute Open Graph URLs and `sitemap-index.xml`. |
| `PUBLIC_FORM_ENDPOINT` | Endpoint that receives the demo and waitlist forms as a multipart POST (Formspree or similar). Without it, the forms open the visitor's email app with the request filled in. |

The contact address and the navigation live in `src/config.ts`.

## Structure

```
public/
  models/face-mesh.bin     demo face mesh (binary, about 140 kB)
  images/                  static renders of the demo face (WebP)
  og-image.png             social preview, 1200 x 630
src/
  components/HeroStage.astro   home page opening: scan, model, plan and recovery on the demo face
  components/Workspace.astro   live demo: Plan and Recovery views
  pages/                       one file per page
  scripts/face/
    mesh.ts                    loads and decodes the demo mesh
    face-model.ts              shape, planning morph, healing deformation, measurements
    face-stage.ts              one WebGL canvas, split into panels
    scenes.ts                  the two scenes: opening sequence and consultation demo
    face-worker.ts             runs a scene in a worker, on a canvas handed over by the page
    face-link.ts               page side of a scene: worker when possible, the page itself otherwise
    protocol.ts                tones, camera framing, timeline and messages shared by both sides
    healing-model.ts           recovery curves and stages
    recovery-chart.ts          swelling and bruising chart
    workspace.ts               the demo controller (tabs, sliders, readouts, overlay)
    hero.ts                    the opening sequence of the home page (clock, captions, overlay)
  styles/global.css            design tokens and all styles
```

## The 3D demo

- **Opening sequence** (home page). The demo face is scanned (points become a surface), landmarks are placed, the nose is planned with today's profile dashed and measured live, then the recovery runs from day 2 to month 12. It ends on the plan and turns slowly. Each step can be replayed, and reduced motion shows still frames.
- **Plan view.** The nose today and the planned nose side by side, with today's profile dashed over the plan. The dorsal hump and the tip lift are measured live on the demo mesh.
- **Recovery view.** The planned nose at any point from day 2 to month 12, in three-quarter view and in profile, with the swelling and bruising curves. Skin thickness changes the slow phase of swelling.

The recovery curves follow the Rhinovate healing model, version 1: deterministic curves, illustrative and not patient-specific. The stage descriptions follow the American Society of Plastic Surgeons and University of Utah Health.

The demo needs WebGL. Without it, the page shows a short notice and the rest of the content stays readable. With reduced motion turned on, the opening animation is skipped.

### Where the face is drawn

The page never draws the face itself when it can avoid it. It hands each canvas to a worker (`transferControlToOffscreen`), asks for frames, and lays the overlay and the readouts over the result. three.js then loads inside the worker only, and the page stays free while the face is drawn.

This path is switched on for Chromium-based browsers, the engine it was tested on (`testedEngine` in `face-link.ts`). Other browsers, and any browser where the worker cannot draw WebGL, run the same scenes on the page. Test on Safari and Firefox before widening it.

## Security headers

`vercel.json` sends a content security policy with `default-src 'none'` and no inline script or style, along with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. The build keeps every script and stylesheet in a file (`inlineStylesheets: 'never'` and `assetsInlineLimit: 0` in `astro.config.mjs`), and the markup carries no `style` attribute.

When you add a third-party resource, an inline style or a new kind of request, update the policy in the same change. Forms post to any HTTPS endpoint (`connect-src 'self' https:`), so `PUBLIC_FORM_ENDPOINT` needs no change there.

## Credits

The demo face is the MediaPipe canonical face model (Apache License 2.0), subdivided and packed into `public/models/face-mesh.bin`.
