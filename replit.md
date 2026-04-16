# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Somya Fashions (`artifacts/somya-fashions`)
Full e-commerce website for an artificial jewellery brand.
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Wouter routing
- **Pages**: Home, Shop (with filters), Product Detail, Cart, Checkout, Payment, Order Success
- **Admin Panel**: `/admin` (dashboard, orders, products, customers) — password: `somya@admin123`
- **Payment**: UPI, Card, and Cash on Delivery flows
- **Theme**: Deep plum, champagne gold, cream — luxury jewellery boutique aesthetic
- **Preview path**: `/`

### API Server (`artifacts/api-server`)
Express 5 backend serving the Somya Fashions frontend.
- **Routes**: `/api/products`, `/api/cart`, `/api/orders`, `/api/payments`, `/api/customers`, `/api/admin/*`, `/api/healthz`
- **Admin password**: `somya@admin123` (configurable via ADMIN_PASSWORD env var)
- **Preview path**: `/api`

## Database Schema

- `products` — jewellery product listings (name, price, category, images, featured, rating, etc.)
- `cart_items` — session-based shopping cart items
- `orders` — placed orders with customer details and items snapshot
- `customers` — registered customers (auto-created on first order, updated on repeat orders)
- `payments` — payment records with method (upi/card/cod), status, and transaction ref
