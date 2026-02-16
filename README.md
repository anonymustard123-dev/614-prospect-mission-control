# Mission Control Dashboard

A professional land development project management dashboard featuring an interactive map with draggable modules and a comprehensive task management system with Gantt charts.

## Features

### 🗺️ Interactive Map (Layer 1)
- Full-screen Mapbox satellite view centered on Evans City, PA
- Draggable module icons that update position in real-time
- Color-coded modules by type (Water, Fiber, Power, Land, Misc)
- Status indicators for each module
- Click modules to open detailed dashboard

### 📊 Module Dashboard (Layer 2)
- **Left Panel**: Task management with full CRUD operations
  - Add new tasks with start/end dates
  - Edit existing tasks
  - Delete tasks
  - Mark tasks as complete/incomplete
- **Right Panel**: Interactive Gantt chart visualization
  - Visual timeline of all tasks
  - Color-coded by completion status
  - Day-level view with zoom capabilities

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Database & Auth)
- **Tailwind CSS** (Styling)
- **react-map-gl** (Mapbox integration)
- **gantt-task-react** (Gantt charts)
- **lucide-react** (Icons)
- **TypeScript** (Type safety)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Mapbox account with access token
- Supabase project set up

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Mapbox access token
   - Add your Supabase URL and anon key

3. **Set up the database:**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run the SQL script from `supabase/schema.sql`
   - This creates the `modules` and `tasks` tables with sample data

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

### Map Interaction
- **Drag modules**: Click and drag any module icon to reposition it on the map
- **Click modules**: Click a module icon to open its dashboard
- **View status**: Hover over modules to see their name and status

### Task Management
- **Add Task**: Click "Add Task" button, fill in title and dates, then save
- **Edit Task**: Click the edit icon on any task
- **Delete Task**: Click the delete icon (trash) on any task
- **Complete Task**: Click the checkbox to mark a task as complete
- **View Gantt**: Tasks automatically appear on the Gantt chart on the right

### Module Types
- 🔵 **Water** - Water infrastructure modules
- 🟣 **Fiber** - Fiber optic/telecommunications
- 🟡 **Power** - Electrical power infrastructure
- 🟢 **Land** - Land parcels and plots
- ⚪ **Misc** - Miscellaneous modules

### Module Statuses
- ⏳ **Pending** - Not yet started
- ⏱️ **In Progress** - Currently being worked on
- ✅ **Completed** - Finished
- ⏸️ **On Hold** - Temporarily paused

## Project Structure

```
mission-control/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page with map
│   └── globals.css         # Global styles
├── components/
│   ├── map/
│   │   ├── MissionMap.tsx  # Main map component
│   │   └── ModuleMarker.tsx # Module icon component
│   └── dashboard/
│       ├── ModuleDashboard.tsx # Dashboard container
│       ├── TaskList.tsx     # Task CRUD component
│       └── GanttChart.tsx  # Gantt chart component
├── lib/
│   └── supabase.ts         # Supabase client
├── types/
│   └── index.ts            # TypeScript types
└── supabase/
    └── schema.sql          # Database schema
```

## Database Schema

### Modules Table
- `id` (UUID) - Primary key
- `name` (TEXT) - Module name
- `type` (TEXT) - Water, Fiber, Power, Land, Misc
- `lat` (DOUBLE) - Latitude
- `lng` (DOUBLE) - Longitude
- `status` (TEXT) - pending, in_progress, completed, on_hold
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Tasks Table
- `id` (UUID) - Primary key
- `module_id` (UUID) - Foreign key to modules
- `title` (TEXT) - Task title
- `start_date` (DATE) - Task start date
- `end_date` (DATE) - Task end date
- `is_completed` (BOOLEAN) - Completion status
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Design

The application features a dark "Command Center" theme with:
- Dark gray backgrounds (#0a0a0a, #18181b, #27272a)
- Bright accent colors for module types
- Professional, sleek interface
- Smooth transitions and hover effects
- Responsive design

## Development

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## License

Private project for land development management.
