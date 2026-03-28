-- CreateTable
CREATE TABLE "Connection" (
    "id" SERIAL NOT NULL,
    "connectionId" TEXT NOT NULL,
    "outOfBandId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "orgDid" TEXT NOT NULL,
    "holderDid" TEXT NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortUrl" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "longUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortUrl_token_key" ON "ShortUrl"("token");
