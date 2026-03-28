/*
  Warnings:

  - You are about to drop the column `schema_id` on the `CredentialDefinition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CredentialDefinition" DROP COLUMN "schema_id",
ADD COLUMN     "schemaId" TEXT;

-- AddForeignKey
ALTER TABLE "Attribute" ADD CONSTRAINT "Attribute_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialDefinition" ADD CONSTRAINT "CredentialDefinition_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE SET NULL ON UPDATE CASCADE;
