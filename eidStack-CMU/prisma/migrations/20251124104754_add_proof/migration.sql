-- CreateTable
CREATE TABLE "Proof" (
    "id" SERIAL NOT NULL,
    "proofRecordId" TEXT NOT NULL,
    "orgDid" TEXT NOT NULL,
    "holderDid" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "credDefId" TEXT NOT NULL,
    "threadDid" TEXT NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proof_proofRecordId_key" ON "Proof"("proofRecordId");
