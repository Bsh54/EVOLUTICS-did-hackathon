/**
 * Type declarations for @env module (react-native-dotenv)
 * 
 * These types are used by TypeScript to understand the environment variables
 * injected by react-native-dotenv at build time.
 */

declare module '@env' {
  /**
   * URL to fetch the BCovrin test network genesis transactions
   * Set in .env file as GENESIS_URL
   */
  export const GENESIS_URL: string | undefined;

  /**
   * URL to fetch the mediator invitation (OOB invitation endpoint)
   * Set in .env file as MEDIATOR_URL
   */
  export const MEDIATOR_URL: string | undefined;
}

