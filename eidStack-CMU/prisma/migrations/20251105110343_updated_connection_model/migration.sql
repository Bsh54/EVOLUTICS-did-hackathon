/*
  Warnings:

  - A unique constraint covering the columns `[connectionId]` on the table `Connection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Connection_connectionId_key" ON "Connection"("connectionId");
