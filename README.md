# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/afa05c87-6b3f-4c58-a5ab-03ff5e3da046

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/afa05c87-6b3f-4c58-a5ab-03ff5e3da046) and start prompting.

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
- Supabase (Database & Storage)

## Version Control System

### Phase 0: Groundwork

The project now includes foundational support for per-prototype versioning. 
This initial phase includes:

- Database table `prototype_versions` for tracking versions
- Storage structure `/prototypes/{prototype_id}/v{n}/`
- Feature flag `version_control_enabled` (default: false)

#### Migration

Existing prototypes have been migrated to create `v1` entries in the version 
control system. No user-facing changes are visible until the feature flag
is enabled.

#### Rollback Steps

If rollback is needed:

1. Execute the rollback migration script:
   ```
   psql -f supabase/migrations/rollbacks/20250602_version_control_phase0.sql
   ```

2. No storage cleanup is needed in Phase 0 as no files were moved

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/afa05c87-6b3f-4c58-a5ab-03ff5e3da046) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
