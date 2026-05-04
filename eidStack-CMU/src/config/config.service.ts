import * as fs from 'fs';
 
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
 
 
export interface EnvConfig {
    [key: string]: string;
}
 
 
@Injectable()
export class ConfigService {
    private readonly envConfig: EnvConfig;
 
    constructor(public filePath: string) {
        let file: Buffer | undefined;
        try {
            file = fs.readFileSync(filePath);
        } catch (error) {
            file = fs.readFileSync(`.env.${process.env.NODE_ENV}`);
        }
 
        const config = dotenv.parse(file);
        this.envConfig = this.validateInput(config);
    }
    private validateInput(envConfig: EnvConfig): EnvConfig {
        const envVarsSchema: Joi.ObjectSchema = Joi.object({
            // DATABASE
            DATABASE_URL: Joi.string().uri().required(),
 
            // Domain & Agent
            AGENT_PUBLIC_URL: Joi.string().uri().required(),
            AGENT_PORT: Joi.number().required(),
 
            // BCOVRIN / Indy Network
            BCOVRIN_TESTNET_URL: Joi.string().uri().required(),
            INDY_NETWORK_NAMESPACE: Joi.string().required(),
 
            // IssuanceService / Credential
            ISSUER_LABEL: Joi.string().required(),
            CREDENTIAL_PROTOCOL_VERSION: Joi.string().valid('v1', 'v2').required(),
 
            // Optional / fallback values (existing examples)
            PORT: Joi.number().default(3000),
            LOG_ON: Joi.boolean().default(true),
        });
 
        const { error, value: validatedEnvConfig } =
            envVarsSchema.validate(envConfig);
        if (error) {
            throw new Error(`Config validation error: ${error.message}`);
        }
        return validatedEnvConfig;
    }
 
    get databaseUrl(): string {
        return this.envConfig.DATABASE_URL;
    }
 
    get agentPublicUrl(): string {
        return this.envConfig.AGENT_PUBLIC_URL;
    }
 
    get agentPort(): number {
        return Number(this.envConfig.AGENT_PORT);
    }
 
    get bcovrinTestnetUrl(): string {
        return this.envConfig.BCOVRIN_TESTNET_URL;
    }
 
    get indyNetworkNamespace(): string {
        return this.envConfig.INDY_NETWORK_NAMESPACE;
    }
 
    get issuerLabel(): string {
        return this.envConfig.ISSUER_LABEL;
    }
 
    get credentialProtocolVersion(): string {
        return this.envConfig.CREDENTIAL_PROTOCOL_VERSION;
    }
 
}