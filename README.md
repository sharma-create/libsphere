# Library Management System
  
This is a project built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.
 You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).
  
This project is connected to the Convex deployment named [`shocking-guanaco-163`](https://dashboard.convex.dev/d/shocking-guanaco-163).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.

## Deploy to Render (static frontend)

You can deploy the frontend of this project to Render (https://render.com) as a static site. There's a `render.yaml` provided at the repository root to help automatically provision the service when you connect your GitHub repository to Render.

Quick steps:

1. Sign in to Render and connect to the GitHub repository: `sharma-create/libsphere`.
2. Create a New -> Static Site and choose the repository or use the `render.yaml` import option.
3. Set the Build Command to: `npm ci && npm run build` and the Publish directory to `dist` (this is the default Vite output).
4. Add environment variables under the Render dashboard:
	- `VITE_CONVEX_URL`: the Convex deployment URL (e.g. `https://shocking-guanaco-163.convex.cloud`).
	- `CONVEX_DEPLOY_KEY` (set as a secret, don't check in source control).
5. Deploy the site. Render will provide a link like `https://<your-service>.onrender.com` once deployed.

Notes:
- This project uses Convex for backend functions; Convex runs on Convex’s own platform. The Render static site is only used for the frontend build.
- Ensure that `VITE_CONVEX_URL` points to the production Convex deployment for the live site.
- If you need to deploy the Convex backend separately, use the Convex dashboard/CLI (`convex deploy`) and set the `VITE_CONVEX_URL` accordingly.

If you'd like, I can also:
- Create a Render `web_service` (Node) Dockerfile instead of a static site if you prefer server-side hosting.
- Add a GitHub Action workflow to automatically trigger Render via the API when main is updated.

## Dockerfile (Node runtime)

I added a Dockerfile and a minimal Node static server `server.js` to serve the built `dist` artifacts. This gives you more flexibility to run the site on Render as a Docker `web_service`, or publish the container to a registry and deploy it anywhere.

To build and run locally:

```powershell
# Build the Docker image (from repository root)
docker build -t libsphere-frontend:latest .

# Run the container on port 3000
docker run --rm -p 3000:3000 -e VITE_CONVEX_URL="https://shocking-guanaco-163.convex.cloud" libsphere-frontend:latest
```

Then open `http://localhost:3000`.

Run on LAN / make globally reachable
- To run locally but be reachable from other machines on your network, ensure the server binds to `0.0.0.0` (the code already does this). Start the server and open `http://<your-machine-ip>:3000` from another device on the same network.
- For Vite dev server, run `npm run dev:frontend` which now runs `vite --host --open` to listen on the network. You may need to allow the port in your OS firewall.
- When using Docker, bind the container port to the host: `docker run --rm -p 3000:3000 ...` — Docker will expose the port on all host interfaces by default.

Render config: `render.yaml` is updated to use a `web_service` with a Dockerfile, which will build and deploy the Docker image in the Render platform.

## GitHub Actions: Build & Push Docker image (and optionally deploy to Render)

I added a GitHub Actions workflow `.github/workflows/docker-build-and-deploy.yml` that builds a multi-arch Docker image, pushes it to GitHub Container Registry (GHCR), and optionally triggers a Render deploy.

What the workflow does:
- Trigger on push to `main` and supports manual runs via `workflow_dispatch`.
- Uses `docker/build-push-action` to build the image (supports linux/amd64 + linux/arm64) and pushes to GHCR as both `latest` and `${{ github.sha }}` tags.
- Optionally pushes to DockerHub if `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository secrets are set.
- Optionally triggers a Render deployment:
	- If you set `RENDER_DEPLOY_WEBHOOK_URL` as a repository secret, the workflow will POST to that webhook to trigger a deploy.
	- If you set `RENDER_API_KEY` and `RENDER_SERVICE_ID`, the workflow will trigger the Render API to create a deploy.

Secrets to set in your GitHub repository (Settings → Secrets → Actions):
- `RENDER_DEPLOY_WEBHOOK_URL` — optional and recommended. Create a Deploy Hook in Render and paste the URL. This allows Render to redeploy based on a webhook.
- `RENDER_API_KEY` and `RENDER_SERVICE_ID` — optional. If you prefer Render API over webhook.
- `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` — optional, only needed if you want to push the image to Docker Hub.

Notes:
- The GHCR actions use `secrets.GITHUB_TOKEN` and appropriate workflow `permissions` to push packages to GHCR. If you need cross-repository writes or a dedicated PAT, replace `secrets.GITHUB_TOKEN` with a personal access token set in your repo secrets.
- If using Render, make sure the service configuration is set to use the Dockerfile or to accept external images as configured.

If you'd like, I can also update the workflow to add automated tagging patterns (e.g. semantic release), add image signatures, or create a `latest` + `release` tags strategy.
