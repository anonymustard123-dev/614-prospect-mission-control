# Mission Control Dashboard - Setup Guide

## Step 1: Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Get this from [Mapbox](https://account.mapbox.com/access-tokens/)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Step 2: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script

This will create:
- `modules` table with columns: id, name, type, lat, lng, status
- `tasks` table with columns: id, module_id, title, start_date, end_date, is_completed
- Sample data (5 modules) for testing

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Next Steps

After completing the setup, the application will include:
- Full-screen Mapbox map centered on Evans City, PA
- Draggable module icons that update position in Supabase
- Module dashboard with task management and Gantt chart
