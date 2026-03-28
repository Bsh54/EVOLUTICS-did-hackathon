-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_credentialDefId_fkey";

-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_schemaId_fkey";

-- AlterTable
ALTER TABLE "Credential" ALTER COLUMN "schemaId" DROP NOT NULL,
ALTER COLUMN "credentialDefId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_credentialDefId_fkey" FOREIGN KEY ("credentialDefId") REFERENCES "CredentialDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
