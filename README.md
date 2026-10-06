# Vamsi Tallapudi · Portfolio

Static site (HTML/CSS/JS, no build step). Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## One-time setup

1. Create a public repo named **`Vamsitallapudi9.github.io`** on GitHub.
2. Push this folder:
   ```sh
   git init -b main
   git add .
   git commit -m "Portfolio site"
   git remote add origin https://github.com/Vamsitallapudi9/Vamsitallapudi9.github.io.git
   git push -u origin main
   ```
3. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Site goes live at https://vamsitallapudi9.github.io after the first workflow run finishes (Actions tab).

## Updating

Edit `index.html`, push to `main`. To update the résumé, replace `Vamsi_tallapudi.pdf` (keep the name).

Preview locally: `python3 -m http.server` then open http://localhost:8000.
