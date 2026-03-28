-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schemaDataType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schemaId" TEXT NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schema" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "schema_id" TEXT NOT NULL,
    "unqualified_schema_id" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialDefinition" (
    "id" TEXT NOT NULL,
    "schema_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuerid" TEXT NOT NULL,
    "cred_def_id" TEXT NOT NULL,
    "unqualified_cred_def_id" TEXT NOT NULL,

    CONSTRAINT "CredentialDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "credExId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "credentialState" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "issuerDid" TEXT NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialDefId" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attribute" ADD CONSTRAINT "Attribute_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialDefinition" ADD CONSTRAINT "CredentialDefinition_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "Schema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_credentialDefId_fkey" FOREIGN KEY ("credentialDefId") REFERENCES "CredentialDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
