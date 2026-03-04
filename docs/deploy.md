Deployment

The site is deployed using GitHub Pages.

Repository: https://github.com/mottkozak/vibe-o-meter

Deployment occurs automatically using GitHub Actions.

⸻

Important Vite Setting

GitHub Pages hosts project sites under:
`https://<username>.github.io/<repository-name>/`

For this repo that is:
https://mottkozak.github.io/vibe-o-meter/

Therefore Vite must set:
base: "/vibe-o-meter/"

in vite.config.ts.


Workflow

The GitHub Actions workflow:
	1.	installs dependencies
	2.	builds the app
	3.	uploads the dist folder
	4.	deploys it to GitHub Pages

⸻

Accessing the Site

After deployment the site will be available at:

https://mottkozak.github.io/vibe-o-meter/

Cost

GitHub Pages hosting for static sites is free.

This project intentionally uses no backend services so it can remain free indefinitely.