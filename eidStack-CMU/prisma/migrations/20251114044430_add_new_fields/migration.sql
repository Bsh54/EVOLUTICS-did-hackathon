/*
  Warnings:

  - You are about to drop the column `issuerid` on the `CredentialDefinition` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cred_def_id]` on the table `CredentialDefinition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unqualified_cred_def_id]` on the table `CredentialDefinition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schema_id]` on the table `Schema` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unqualified_schema_id]` on the table `Schema` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `issuerId` to the `CredentialDefinition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CredentialDefinition" DROP COLUMN "issuerid",
ADD COLUMN     "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "issuerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CredentialDefinition_cred_def_id_key" ON "CredentialDefinition"("cred_def_id");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialDefinition_unqualified_cred_def_id_key" ON "CredentialDefinition"("unqualified_cred_def_id");

-- CreateIndex
CREATE UNIQUE INDEX "Schema_schema_id_key" ON "Schema"("schema_id");

-- CreateIndex
CREATE UNIQUE INDEX "Schema_unqualified_schema_id_key" ON "Schema"("unqualified_schema_id");
