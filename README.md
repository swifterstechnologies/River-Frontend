# Pharmacy MVP - Frontend

This is the React frontend for the Pharmacy MVP. It is built using modern tooling with Vite, providing a fast development experience and optimized production builds.

## Features
- **Fast Build Tooling:** Built on top of Vite for rapid Hot Module Replacement (HMR).
- **Modern UI Styling:** Styled with Tailwind CSS for rapid, utility-first design.
- **Animations:** Uses `framer-motion` for smooth, dynamic micro-animations.
- **Data Visualization:** Incorporates `recharts` for dashboard charts and statistics.
- **Icons:** Uses `lucide-react` for beautiful, consistent iconography.

## Prerequisites
- Node.js (v20 or higher recommended)

## Available Scripts

In the project directory, you can run:

### `npm install`
Installs all necessary dependencies.

### `npm run dev`
Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) (or whichever port Vite assigns) to view it in your browser. The page will reload when you make changes.

### `npm run build`
Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run preview`
Locally preview the production build.

## Project Structure
- `src/services/api.js`: Centralized Axios instances and API call definitions connecting to the backend.
- `src/index.css`: Global styles and Tailwind directives.
- `postcss.config.js` / `tailwind.config.js`: PostCSS and Tailwind configuration.
