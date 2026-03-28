-- DropForeignKey
ALTER TABLE "Attribute" DROP CONSTRAINT "Attribute_schemaId_fkey";

-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_credentialDefId_fkey";

-- DropForeignKey
ALTER TABLE "CredentialDefinition" DROP CONSTRAINT "CredentialDefinition_schema_id_fkey";
