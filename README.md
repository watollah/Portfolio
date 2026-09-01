# Hannes Watolla — Portfolio

A minimalist architectural portfolio website with bilingual support (English/German) and accessibility options. Built with React, TypeScript, and Vite, deployed to GitHub Pages with a custom domain.

## Features

- **Modern, minimalist design** — Clean typography, generous whitespace, professional aesthetic
- **Bilingual** — Full English and German translations with language persistence
- **Accessibility** — Font size controls, high contrast mode, reduced motion toggle
- **Project categories** — Software Development and Architecture sections
- **GitHub Pages** — Automated deployment with custom domain support

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Customization

### Projects & Resume

Edit `src/data/projects.ts` to add your real projects, experience, education, and skills.

### Translations

Update `src/i18n/locales/en.json` and `src/i18n/locales/de.json` for copy changes.

### Resume PDF

Place your resume at `public/resume.pdf` for the download button on the Resume page.

### Custom Domain

1. Replace `yourdomain.com` in `public/CNAME` with your actual domain
2. Configure DNS at your registrar:
   - **A records** pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or a **CNAME record** pointing to `<username>.github.io`

## GitHub Pages Deployment

1. Create a GitHub repository and push this project
2. Go to **Settings → Pages**
3. Under **Build and deployment**, set source to **GitHub Actions**
4. Push to the `main` branch — the workflow deploys automatically

## Project Structure

```
src/
├── components/     Header, project cards, accessibility panel
├── context/        Accessibility settings provider
├── data/           Projects and resume content
├── i18n/           Translation files (EN/DE)
├── pages/          Home, Projects, Resume
└── styles/         Global CSS and design tokens
```

## License

Private — © Hannes Watolla
