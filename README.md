# Thorga Kathmandu

A modern full-stack web application built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Supabase (SSR Auth & Database)**, and **Cloudinary (Media Management)**.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router & Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend / Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`)
- **Media Optimization**: [Cloudinary](https://cloudinary.com/) (`next-cloudinary`, `cloudinary`)
- **Icons & Helpers**: `lucide-react`, `clsx`, `tailwind-merge`

---

## 🚀 Getting Started

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your project credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📁 Project Structure

```
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables
├── next.config.ts                   # Next.js config with Cloudinary remote image domains
├── src/
│   ├── app/
│   │   ├── api/cloudinary/sign/     # Signed Cloudinary upload API endpoint
│   │   ├── globals.css              # Tailwind CSS stylesheet
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Starter dashboard & stack status
│   ├── lib/
│   │   ├── cloudinary/index.ts      # Cloudinary server SDK & upload helpers
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase browser client (Client Components)
│   │   │   ├── server.ts            # Supabase server client (Server Actions / RSC)
│   │   │   └── middleware.ts        # Supabase session refresher
│   │   └── utils.ts                 # ClassName utility (cn)
│   └── middleware.ts                # Next.js request middleware with Supabase auth sync
```

---

## 💻 Usage Guides

### Supabase in Server Components / Actions

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <div>Logged in as: {user?.email ?? "Guest"}</div>;
}
```

### Supabase in Client Components

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function UserProfile() {
  const supabase = createClient();
  // Call supabase.auth or database queries
}
```

### Cloudinary Image Display

```tsx
import { CldImage } from "next-cloudinary";

export default function ImageDisplay() {
  return (
    <CldImage
      src="sample" // Cloudinary public ID
      width="600"
      height="400"
      alt="Sample image"
      crop="fill"
    />
  );
}
```

### Cloudinary Server Upload

```typescript
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function uploadAction(formData: FormData) {
  "use server";
  const file = formData.get("file") as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await uploadToCloudinary(buffer, "user-uploads");
  return uploadResult.secure_url;
}
```

---

## 📜 Scripts

- `npm run dev` - Starts development server with Turbopack
- `npm run build` - Builds production bundle
- `npm run start` - Runs production server
- `npm run lint` - Runs ESLint code quality checks
