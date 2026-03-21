-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);
