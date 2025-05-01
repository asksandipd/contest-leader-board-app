# Contestant Leaderboard

## Overview

This project is a Next.js application designed to display and manage a leaderboard of contestants for a coding contest. The application features a user-friendly interface with real-time data simulation, score updates, and an intuitive design, built using modern web technologies.

### App Screenshots

![Leaderboard View](docs/leaderboard-view.png)
*A screenshot of the main leaderboard view.*

![Update Contestant Form](docs/update-form.png)
*A screenshot of the contestant update form.*

## Features

*   **Real-time Leaderboard Simulation:** View dynamic standings of contestants with simulated updates.
*   **Contestant Details:** Access information about each contestant, including country flags.
*   **Score Updates:** Manually update contestants' scores, time penalties, and system test pass percentages via a form.
*   **Add Contestants:** Simulate adding new contestants to the leaderboard.
*   **Responsive Design:** Enjoy a seamless experience on desktop and mobile devices.
*   **Accessible:** Designed to be keyboard-friendly and screen reader accessible.
*   **Smooth Animations:** Uses Framer Motion for rank change animations.

## Technologies Used

*   **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with CSS Variables (via `globals.css`)
*   **UI Library:** [Shadcn/ui](https://ui.shadcn.com/) (built on Radix UI primitives)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useRef`, `useMemo`)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for schema validation
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Data Simulation:** Client-side data generation and simulation (using `Math.random()` within `useEffect` to prevent hydration errors)

## Key Libraries & Packages

*   `next`: The React framework.
*   `react` & `react-dom`: Core React libraries.
*   `typescript`: For static typing.
*   `tailwindcss`, `tailwindcss-animate`, `postcss`: Styling and animation utilities.
*   `@radix-ui/*`: Core primitives for Shadcn/ui components.
*   `class-variance-authority`, `clsx`, `tailwind-merge`: Utilities for managing CSS classes, used by Shadcn/ui.
*   `lucide-react`: Icon library.
*   `react-hook-form` & `@hookform/resolvers`: Form handling and validation integration.
*   `zod`: Schema definition and validation.
*   `framer-motion`: For UI animations (e.g., leaderboard rank changes).
*   `date-fns`: Utility functions for date/time formatting.

*Note: Genkit (`genkit`, `@genkit-ai/googleai`, `@genkit-ai/next`) is included but not currently used in the core leaderboard functionality.*

## How to Run the App

Follow these steps to get the app running locally:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd contestant-leaderboard
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    The application uses Turbopack for faster development builds and runs on port 9002 by default.

4.  **Open the App:**
    Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## Project Structure

```
.
├── public/             # Static assets (flags, etc.)
├── src/
│   ├── app/            # Next.js App Router directory
│   │   ├── globals.css # Global styles and Tailwind directives
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Main page component (leaderboard)
│   ├── components/     # React components
│   │   ├── leaderboard/ # Leaderboard specific components
│   │   └── ui/         # Shadcn/ui components
│   ├── data/           # Data generation and simulation logic
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   └── types/          # TypeScript type definitions
├── tailwind.config.ts  # Tailwind configuration
├── next.config.ts      # Next.js configuration
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.