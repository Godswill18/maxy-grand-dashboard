# Maxy Grand Hotel - Admin Dashboard

A comprehensive hotel management system dashboard for Maxy Grand Hotel SuperAdmin.

## Tech Stack

- **Vite** - Build tool
- **TypeScript** - Type safety
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js & npm (or [bun](https://bun.sh))

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd maxy-grand-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Available Scripts

```sh
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Docker

A `Dockerfile` is included for containerized deployment:

```sh
docker build -t maxy-grand-dashboard .
docker run -p 8080:8080 maxy-grand-dashboard
```
