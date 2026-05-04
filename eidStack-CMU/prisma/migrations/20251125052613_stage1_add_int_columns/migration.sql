/*
  Warnings:

  - The primary key for the `Attribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Attribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Credential` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Credential` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CredentialDefinition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CredentialDefinition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `schemaId` column on the `CredentialDefinition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Schema` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Schema` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `schemaId` on the `Attribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `schemaId` on the `Credential` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `credentialDefId` on the `Credential` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Attribute" DROP CONSTRAINT "Attribute_schemaId_fkey";

-- DropForeignKey
ALTER TABLE "CredentialDefinition" DROP CONSTRAINT "CredentialDefinition_schemaId_fkey";

-- AlterTable
ALTER TABLE "Attribute" DROP CONSTRAINT "Attribute_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "schemaId",
ADD COLUMN     "schemaId" INTEGER NOT NULL,
ADD CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "schemaId",
ADD COLUMN     "schemaId" INTEGER NOT NULL,
DROP COLUMN "credentialDefId",
ADD COLUMN     "credentialDefId" INTEGER NOT NULL,
ADD CONSTRAINT "Credential_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CredentialDefinition" DROP CONSTRAINT "CredentialDefinition_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "schemaId",
ADD COLUMN     "schemaId" INTEGER,
ADD CONSTRAINT "CredentialDefinition_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Schema" DROP CONSTRAINT "Schema_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Schema_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Attribute" ADD CONSTRAINT "Attribute_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialDefinition" ADD CONSTRAINT "CredentialDefinition_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_credentialDefId_fkey" FOREIGN KEY ("credentialDefId") REFERENCES "CredentialDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
