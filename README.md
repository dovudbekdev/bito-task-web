# BITO Task Web

Multi-tenant POS admin panel va kassir interfeysi — React + TypeScript + CSS.

## Texnologiyalar

- React 19 + TypeScript
- Vite
- React Router v7
- TanStack Query
- Plain CSS (CSS Modules)

## Ishga tushirish

### 1. Backend ni ishga tushiring

```bash
cd ../bito-task
cp .env.example .env.development.local
# DB_URL, JWT secrets, SUPER_ADMIN_LOGIN/PASSWORD to'ldiring
npm install
npm run start:dev
```

Backend `.env` da quyidagilar bo'lishi kerak:

- `CORS_ORIGINS=http://localhost:5173`
- `SUPER_ADMIN_LOGIN` va `SUPER_ADMIN_PASSWORD` — birinchi kirish uchun

### 2. Frontend ni ishga tushiring

```bash
npm install
cp .env.example .env
npm run dev
```

Brauzer: http://localhost:5173

## Muhit o'zgaruvchilari

| O'zgaruvchi | Tavsif | Default |
|-------------|--------|---------|
| `VITE_API_BASE_URL` | Backend API manzili | `http://localhost:3000/api` |

## Rol bo'yicha imkoniyatlar

| Rol | Imkoniyatlar |
|-----|--------------|
| **super_admin** | Admin yaratish va boshqarish |
| **admin** | Tenant, kassir, mahsulot CRUD; sotuv hisoboti |
| **cashier** | POS orqali mahsulot sotish |

## To'lov oqimi

Buyurtma yaratilganda holat `pending_payment` bo'ladi. To'lov faqat backend webhook orqali tasdiqlanadi:

```bash
# bito-task loyihasida
node scripts/local/generate-webhook-signature.js --eventId=evt_001 --orderId=1
curl -X POST http://localhost:3000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-signature: <SIGNATURE>" \
  -d '{"eventId":"evt_001","orderId":1,"status":"paid"}'
```

To'lovdan keyin POS yoki Buyurtmalar sahifasidan chekni ko'rish mumkin.

## Loyiha strukturasi

```
src/
├── app/           # Router, providers
├── components/    # UI, layout, feedback
├── features/      # Sahifalar (auth, users, tenants, products, pos, ...)
├── lib/           # API client, auth, utils
├── services/      # API repository
├── styles/        # Global CSS
└── types/         # TypeScript tiplar
```

## Build

```bash
npm run build
npm run preview
```
