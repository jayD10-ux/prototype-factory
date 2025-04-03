
/**
 * Type definitions for Trusted Types
 * https://w3c.github.io/webappsec-trusted-types/dist/spec/
 */

// Define the interfaces first, then use them in both module and global declarations
interface ITrustedHTML {}
interface ITrustedScript {}
interface ITrustedScriptURL {}
interface ITrustedURL {}

interface ITrustedTypePolicy {
  createHTML(input: string): ITrustedHTML;
  createScript(input: string): ITrustedScript;
  createScriptURL(input: string): ITrustedScriptURL;
  createURL?(input: string): ITrustedURL;
}

interface ITrustedTypePolicyFactory {
  createPolicy(
    policyName: string,
    policyOptions?: {
      createHTML?: (input: string) => string;
      createScript?: (input: string) => string;
      createScriptURL?: (input: string) => string;
      createURL?: (input: string) => string;
    }
  ): ITrustedTypePolicy;
}

// Module declaration
declare module 'trusted-types' {
  export type TrustedHTML = ITrustedHTML;
  export type TrustedScript = ITrustedScript;
  export type TrustedScriptURL = ITrustedScriptURL;
  export type TrustedURL = ITrustedURL;

  export type TrustedTypePolicy = ITrustedTypePolicy;
  export type TrustedTypePolicyFactory = ITrustedTypePolicyFactory;
}

// Global declarations
declare global {
  type TrustedHTML = ITrustedHTML;
  type TrustedScript = ITrustedScript;
  type TrustedScriptURL = ITrustedScriptURL;
  type TrustedURL = ITrustedURL;

  type TrustedTypePolicy = ITrustedTypePolicy;
  type TrustedTypePolicyFactory = ITrustedTypePolicyFactory;

  interface Window {
    trustedTypes?: TrustedTypePolicyFactory;
  }
}

// This empty export makes this file a proper module
export {};
