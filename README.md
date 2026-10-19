# Rhinovate website

Marketing site for Rhinovate, 3D consultation software for rhinoplasty surgeons: planning on a 3D model of the patient's face, and a recovery forecast from the first days to month 12.

The site is static. The home page and the recovery forecast page carry a live 3D demo that runs in the browser on a generic demo face.

## Stack

- [Astro](https://astro.build) 7, static output
- [three.js](https://threejs.org) for the 3D demo
- Mona Sans (variable), self-hosted through Fontsource
- No UI framework and no tracking

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
    healing-model.ts           recovery curves and stages
    recovery-chart.ts          swelling and bruising chart
    workspace.ts               the demo controller
    hero.ts                    the opening sequence of the home page
  styles/global.css            design tokens and all styles
```

## The 3D demo

- **Opening sequence** (home page). The demo face is scanned (points become a surface), landmarks are placed, the nose is planned with today's profile dashed and measured live, then the recovery runs from day 2 to month 12. It ends on the plan and turns slowly. Each step can be replayed, and reduced motion shows still frames.
- **Plan view.** The nose today and the planned nose side by side, with today's profile dashed over the plan. The dorsal hump and the tip lift are measured live on the demo mesh.
- **Recovery view.** The planned nose at any point from day 2 to month 12, in three-quarter view and in profile, with the swelling and bruising curves. Skin thickness changes the slow phase of swelling.

The recovery curves follow the Rhinovate healing model, version 1: deterministic curves, illustrative and not patient-specific. The stage descriptions follow the American Society of Plastic Surgeons and University of Utah Health.

The demo needs WebGL. Without it, the page shows a short notice and the rest of the content stays readable. With reduced motion turned on, the opening animation is skipped.

## Credits

The demo face is the MediaPipe canonical face model (Apache License 2.0), subdivided and packed into `public/models/face-mesh.bin`.
