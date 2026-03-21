-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "country" TEXT,
    "city" TEXT,
    "logoUrl" TEXT,
    "content" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");
