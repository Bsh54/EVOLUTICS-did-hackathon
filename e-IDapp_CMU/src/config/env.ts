/**
 * Environment Configuration with Fallbacks
 * 
 * This file provides a centralized way to access environment variables
 * with fallback values for production builds where .env may not be available.
 * 
 * Environment variables are injected at build time by react-native-dotenv.
 * If they are undefined, we use fallback values or empty strings.
 */

// @ts-ignore - @env module is injected at build time by react-native-dotenv
import { GENESIS_URL as ENV_GENESIS_URL, MEDIATOR_URL as ENV_MEDIATOR_URL } from '@env';

/**
 * Default/fallback URLs
 * These can be used when environment variables are not available in production builds
 */
const DEFAULT_GENESIS_URL = '';
const DEFAULT_MEDIATOR_URL = '';

/**
 * Get the Genesis URL with fallback
 * @returns The GENESIS_URL from environment or fallback value
 */
export const getGenesisUrl = (): string => {
	const url = ENV_GENESIS_URL;

	if (!url || typeof url !== 'string' || url.trim() === '') {
		if (__DEV__) {
			console.warn(
				'⚠️ GENESIS_URL is not defined in environment variables.\n' +
				'Please create a .env file with GENESIS_URL set.\n' +
				'Using fallback (empty string).'
			);
		}
		return DEFAULT_GENESIS_URL;
	}

	return url;
};

/**
 * Get the Mediator URL with fallback
 * @returns The MEDIATOR_URL from environment or fallback value
 */
export const getMediatorUrl = (): string => {
	const url = ENV_MEDIATOR_URL;

	if (!url || typeof url !== 'string' || url.trim() === '') {
		if (__DEV__) {
			console.warn(
				'⚠️ MEDIATOR_URL is not defined in environment variables.\n' +
				'Please create a .env file with MEDIATOR_URL set.\n' +
				'Using fallback (empty string).'
			);
		}
		return DEFAULT_MEDIATOR_URL;
	}

	return url;
};

/**
 * Validate that required environment variables are set
 * @returns Object with validation results
 */
export const validateEnvConfig = (): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
} => {
	const errors: string[] = [];
	const warnings: string[] = [];

	const genesisUrl = getGenesisUrl();
	const mediatorUrl = getMediatorUrl();

	if (!genesisUrl || genesisUrl.trim() === '') {
		warnings.push('GENESIS_URL is not set. Genesis transactions will not be available.');
	}

	if (!mediatorUrl || mediatorUrl.trim() === '') {
		warnings.push('MEDIATOR_URL is not set. Mediator connection will not be available.');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
};

/**
 * Log environment configuration status (for debugging)
 */
export const logEnvConfig = (): void => {
	if (__DEV__) {
		const validation = validateEnvConfig();
		const genesisUrl = getGenesisUrl();
		const mediatorUrl = getMediatorUrl();

		console.log('📋 Environment Configuration:', {
			genesisUrl: genesisUrl ? `${genesisUrl.substring(0, 50)}...` : 'NOT SET',
			mediatorUrl: mediatorUrl ? `${mediatorUrl.substring(0, 50)}...` : 'NOT SET',
			isValid: validation.isValid,
			warnings: validation.warnings,
		});

		if (validation.warnings.length > 0) {
			console.warn('⚠️ Environment Configuration Warnings:', validation.warnings);
		}
	}
};

// Export the actual values for backward compatibility
export const GENESIS_URL = getGenesisUrl();
export const MEDIATOR_URL = getMediatorUrl();

