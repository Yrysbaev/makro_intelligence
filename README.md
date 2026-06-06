# Makro Intelligence

**AI-powered business analytics platform for wholesale food distribution.**

Makro Intelligence gives your team a single dashboard to analyze products, revenue, customers, sales managers, inventory, and reorder opportunities — powered by real data and AI-generated recommendations.

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | KPI overview, revenue trends, top products/customers, reorder alerts |
| **Products** | SKU-level analytics — revenue, margin, velocity, trend |
| **Customers** | Retention status, order history, growth/decline detection |
| **Revenue** | Monthly/weekly trends, territory breakdown, category analysis |
| **Sales Managers** | Territory KPIs, customer counts, reorder opportunities |
| **Inventory** | Stock levels, reorder recommendations, status alerts |
| **AI Insights** | Automated recommendations — opportunities, risks, actions |
| **Upload Data** | Drag-and-drop CSV/Excel import with preview |
| **Settings** | Supabase connection, notification thresholds, AI config |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom shadcn/ui-style components
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yrysbaev/makro_intelligence.git
cd makro_intelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note:** The app works without Supabase — it uses sample data automatically when no connection is configured. This is great for demos.

### 4. Set up the database (optional)

If you want to connect a real Supabase project:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL editor in your Supabase dashboard
3. Run `supabase/schema.sql` to create all tables, views, and triggers
4. Run `supabase/seed.sql` to populate sample data

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
makro_intelligence/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── products/           # Product analytics
│   │   ├── customers/          # Customer analytics
│   │   ├── revenue/            # Revenue analytics
│   │   ├── sales-managers/     # Sales manager performance
│   │   ├── inventory/          # Inventory management
│   │   ├── ai-insights/        # AI recommendations
│   │   ├── upload/             # File upload
│   │   └── settings/           # App settings
│   ├── components/
│   │   ├── layout/             # Sidebar, Header
│   │   ├── ui/                 # Reusable UI components
│   │   ├── charts/             # Recharts wrappers
│   │   └── dashboard/          # Dashboard-specific widgets
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── utils.ts            # Formatters and helpers
│   │   └── sample-data.ts      # Demo data
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── supabase/
│   ├── schema.sql              # Full database schema + views
│   └── seed.sql                # Sample data seed
├── .env.example                # Environment variable template
└── README.md
```

---

## Database Schema

| Table | Description |
|---|---|
| `products` | Product catalog with pricing and cost |
| `customers` | Customer accounts with location and manager |
| `sales_managers` | Sales team by territory |
| `invoices` | Sales invoices / orders |
| `invoice_items` | Line items per invoice |
| `inventory` | Stock levels and reorder config |
| `ai_insights` | Stored AI recommendations |
| `uploaded_files` | File upload audit log |

Analytical views (`monthly_revenue`, `product_revenue`, `customer_revenue`, `sales_manager_revenue`, `inventory_status`) are pre-built for fast dashboard queries.

---

## Upload File Format

Upload CSV files with these columns to import invoice data:

| Column | Required |
|---|---|
| `invoice_number` | Yes |
| `invoice_date` | Yes |
| `customer_name` | Yes |
| `product_name` | Yes |
| `quantity` | Yes |
| `unit_price` | Yes |
| `total` | Yes |
| `sku` | Optional |
| `sales_manager` | Optional |
| `city` | Optional |
| `state` | Optional |
| `category` | Optional |

Download a template from the **Upload Data** page in the app.

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## License

MIT — use freely for commercial and non-commercial projects.
