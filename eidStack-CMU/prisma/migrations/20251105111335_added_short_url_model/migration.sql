-- CreateTable
CREATE TABLE "ShortUrl" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortUrl_code_key" ON "ShortUrl"("code");
