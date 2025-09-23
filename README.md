# TalentFlow - A Mini Hiring Platform

This project is a React application designed to simulate a mini hiring platform for an HR team. It allows managing jobs, candidates, and assessments, with a focus on front-end implementation and API simulation without a real backend. The application demonstrates key front-end development concepts such as state management, data virtualization, drag-and-drop functionalities, and local data persistence.




## Features

The TalentFlow platform provides the following core functionalities:

### 1. Jobs Board
*   **Listing and Filtering**: Displays a list of jobs with server-like pagination and filtering options based on title, status, and tags.
*   **Job Management**: Allows HR teams to create, edit, archive, and unarchive jobs. Job creation/editing is handled via a modal or dedicated route, including validation for required fields like title and unique slug.
*   **Reordering**: Jobs can be reordered using a drag-and-drop interface, featuring optimistic updates and rollback mechanisms in case of failure.
*   **Deep Linking**: Supports direct navigation to individual job details via `/jobs/:jobId`.

### 2. Candidates Management
*   **Virtualized List**: Efficiently displays a large list of 1000+ seeded candidates using virtualization, with client-side search capabilities by name/email.
*   **Filtering**: Candidates can be filtered by their current stage (e.g., applied, screen, tech, offer, hired, rejected).
*   **Candidate Profile**: Each candidate has a dedicated profile route (`/candidates/:id`) showcasing a timeline of their status changes.
*   **Kanban Board**: Facilitates moving candidates between different stages using a drag-and-drop kanban board.
*   **Notes with Mentions**: Allows attaching notes to candidate profiles, supporting `@mentions` (rendering only, no backend functionality for suggestions).

### 3. Assessments
*   **Assessment Builder**: Provides a tool to build job-specific assessments, allowing the addition of various question types: single-choice, multi-choice, short text, long text, numeric with range, and a file upload stub.
*   **Live Preview**: Includes a live preview pane that renders the assessment as a fillable form, enabling real-time visualization during creation.
*   **Local Persistence**: The state of the assessment builder and candidate responses are persisted locally.
*   **Form Runtime with Validation**: Implements form validation rules (required fields, numeric range, max length) and conditional questions (e.g., showing a question only if a previous answer meets certain criteria).




## Technologies Used

The application is built using the following key technologies and libraries:

*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and maintainability.
*   **Vite**: A fast build tool that provides a lightning-fast development experience for modern web projects.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **Dexie**: A minimalist wrapper for IndexedDB, used for local data persistence.
*   **MSW (Mock Service Worker)**: Used to simulate a REST API for development and testing purposes, intercepting network requests.
*   **@dnd-kit/core, @dnd-kit/sortable, @hello-pangea/dnd**: Libraries for implementing drag-and-drop functionalities, particularly for reordering jobs and moving candidates in the Kanban board.
*   **@tanstack/react-query**: A powerful data-fetching and caching library for React applications, managing server state.
*   **React Hook Form**: A performant, flexible, and extensible forms library for React.
*   **React Router DOM**: A collection of navigational components that compose declaratively with your application.
*   **React Window**: A library for efficiently rendering large lists and tabular data (virtualization).
*   **Zod**: A TypeScript-first schema declaration and validation library.
*   **Nanoid**: A tiny, secure, URL-friendly, unique string ID generator.
*   **Lucide React**: A collection of beautiful, pixel-perfect icons for React.
*   **Clsx**: A tiny utility for constructing `className` strings conditionally.




## Setup and Installation

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/itsabhay83/entnt_assignment.git
    cd entnt_assignment
    ```
    *Commands: `git clone https://github.com/itsabhay83/entnt_assignment.git` and `cd entnt_assignment`*

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *Command: `npm install`*

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    *Command: `npm run dev`*

    The application will be available at `http://localhost:5173`.

### Build for Production

To create a production build of the application, run:

```bash
npm run build
```
*Command: `npm run build`*

This will generate a `dist` folder with the optimized and minified assets.




## Architecture

The application follows a component-based architecture using React. The core logic is separated into different modules for managing jobs, candidates, and assessments. State management is handled using a combination of local component state and `@tanstack/react-query` for managing server state and caching data from the simulated API.

### Data Persistence

All data is persisted locally in the browser's IndexedDB using `Dexie.js`. This ensures that the application state is restored on page refresh. The simulated API (MSW) writes through to IndexedDB, providing a realistic development experience without a backend.

## API Simulation

The application uses **Mock Service Worker (MSW)** to simulate a REST API. This allows for the development and testing of the front-end application in isolation, without needing a live backend. The mock API includes endpoints for:

*   **Jobs**: `GET /jobs`, `POST /jobs`, `PATCH /jobs/:id`, `PATCH /jobs/:id/reorder`
*   **Candidates**: `GET /candidates`, `POST /candidates`, `PATCH /candidates/:id`, `GET /candidates/:id/timeline`
*   **Assessments**: `GET /assessments/:jobId`, `PUT /assessments/:jobId`, `POST /assessments/:jobId/submit`

The mock API also simulates real-world network conditions by introducing artificial latency (200–1200ms) and a 5–10% error rate on write endpoints to test the application's resilience and error handling capabilities.




## Deployed Application

The application is deployed and can be accessed at: [talentflowabhay.vercel.app](https://talentflowabhay.vercel.app)


## Project Structure

The project follows a standard React application structure, organized into logical directories for better maintainability and scalability. Below is an overview of the main directories and their contents:

```
.
├── public/
│   ├── mockServiceWorker.js
│   └── vite.svg
├── src/
│   ├── App.tsx
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── CreateJobModal.tsx
│   │   ├── JobsListSortable.tsx
│   │   ├── SortableJobCard.tsx
│   │   ├── JobCard.tsx
│   │   ├── Layout.tsx
│   │   ├── assessment/
│   │   │   └── AssessmentPreview.tsx
│   │   ├── kanban/
│   │   │   ├── CandidateCard.tsx
│   │   │   └── KanbanBoard.tsx
│   │   └── mention/
│   │       └── MentionInput.tsx
│   ├── database/
│   │   └── db.ts
│   ├── hooks/
│   │   └── api.ts
│   ├── index.css
│   ├── main.tsx
│   ├── mocks/
│   │   ├── browser.ts
│   │   └── handlers.ts
│   ├── pages/
│   │   ├── AssessmentBuilder.tsx
│   │   ├── CandidatesList.tsx
│   │   ├── DatabaseDevTools.tsx
│   │   ├── JobsList.tsx
│   │   ├── AssessmentForm.tsx
│   │   ├── CreateJobPage.tsx
│   │   ├── EditJobPage.tsx
│   │   ├── CandidateProfile.tsx
│   │   ├── Dashboard.tsx
│   │   └── JobDetail.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── api-adapter.ts
│   └── vite-env.d.ts
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

*   **`public/`**: Contains static assets and the `mockServiceWorker.js` for API mocking.
*   **`src/`**: The main application source code.
    *   **`assets/`**: Stores static assets like images.
    *   **`components/`**: Reusable UI components, further categorized by feature (e.g., `assessment`, `kanban`, `mention`).
    *   **`database/`**: Contains the Dexie database setup (`db.ts`).
    *   **`hooks/`**: Custom React hooks, including API interaction logic.
    *   **`mocks/`**: Configuration and handlers for MSW (Mock Service Worker).
    *   **`pages/`**: Top-level components representing different views or routes in the application.
    *   **`types/`**: TypeScript type definitions.
    *   **`utils/`**: Utility functions, such as the API adapter.
*   **Configuration Files**: Includes various configuration files for ESLint, PostCSS, Tailwind CSS, TypeScript, and Vite.




## Technical Decisions and Challenges Faced

### Technical Decisions

*   **React with TypeScript**: Chosen for robust type-checking, improved code quality, and better maintainability in a complex front-end application.
*   **Vite**: Selected for its fast cold start times and instant hot module replacement (HMR), significantly improving developer experience.
*   **Tailwind CSS**: Utilized for its utility-first approach, enabling rapid UI development and consistent styling without writing custom CSS.
*   **Dexie.js for Local Persistence**: Opted for IndexedDB through Dexie.js to ensure data persistence across browser sessions, fulfilling the requirement of a 


backend-less application that retains state on refresh. This decision was crucial for simulating a persistent data layer.
*   **MSW (Mock Service Worker)**: Implemented to mock API endpoints, allowing the front-end to interact with a simulated backend. This enabled independent development and testing of the UI components and data fetching logic, including simulating network latency and error rates.
*   **@tanstack/react-query**: Integrated for efficient server state management, including data fetching, caching, synchronization, and error handling. This helped in managing complex asynchronous operations and optimizing performance.
*   **Drag-and-Drop Libraries (@dnd-kit, @hello-pangea/dnd)**: Utilized for implementing interactive features like reordering jobs and moving candidates across Kanban stages, providing a smooth user experience.
*   **React Hook Form & Zod**: Used for form management and validation, ensuring data integrity and a streamlined user input process.
*   **React Window**: Employed for virtualizing large lists (e.g., 1000+ candidates) to optimize rendering performance and maintain a responsive UI.

### Challenges Faced

*   **Simulating Backend Logic with MSW and IndexedDB**: A significant challenge was to accurately mimic backend operations, especially write-through persistence to IndexedDB via MSW. This required careful orchestration to ensure data consistency and proper state restoration on refresh.
*   **Optimistic Updates and Rollback**: Implementing optimistic updates for drag-and-drop reordering, particularly for jobs, and ensuring a robust rollback mechanism in case of simulated API failures (500 errors) was complex. This involved managing transient UI states and error recovery gracefully.
*   **Performance Optimization for Large Lists**: Handling a virtualized list of over 1000 candidates required careful optimization to prevent performance bottlenecks and maintain smooth scrolling and client-side search functionality.
*   **Complex Form Validation and Conditional Logic**: The assessment builder's requirement for dynamic question types, intricate validation rules (e.g., numeric range, max length), and conditional question display posed a challenge in designing a flexible and extensible form rendering engine.
*   **State Management Complexity**: Balancing local component state with global state managed by `react-query` and ensuring seamless data flow across various features (jobs, candidates, assessments) while maintaining a clear separation of concerns was an ongoing challenge.
*   **Real-time UI Updates with Mocked API**: Ensuring that UI updates reflected changes made through the mocked API, especially with simulated latency and errors, required meticulous handling of loading states, error messages, and data revalidation.



