# Welcome to your Lovable project

![Deploy Supabase Functions](https://github.com/fjeckel/transform-finance-agent-site/actions/workflows/deploy-supabase-functions.yml/badge.svg)

## Project info

**URL**: https://lovable.dev/projects/1477f6a5-aad6-4cab-b15a-ed0a8f7e8aec

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1477f6a5-aad6-4cab-b15a-ed0a8f7e8aec) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Building for production

To generate the optimized output in the `dist/` folder run:

```sh
npm run build
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1477f6a5-aad6-4cab-b15a-ed0a8f7e8aec) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Updating Profile Pictures

Profile photos used in the Fabian Jeckel and Tim Teuscher sections are stored under `public/img/`.
To replace an image, copy your new file into this folder using the same filename.

Components reference the images with a leading `/img/` path. Example:

```tsx
<AvatarImage src="/img/fabian-jeckel.jpg" alt="Fabian Jeckel" />
```

After adding your image, restart the dev server (`npm run dev`) to preview the update.
