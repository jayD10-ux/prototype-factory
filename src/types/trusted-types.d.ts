
/**
 * Type definitions for Trusted Types
 * https://w3c.github.io/webappsec-trusted-types/dist/spec/
 */

declare module 'trusted-types' {
  export interface TrustedHTML {}
  export interface TrustedScript {}
  export interface TrustedScriptURL {}
  export interface TrustedURL {}

  export interface TrustedTypePolicy {
    createHTML(input: string): TrustedHTML;
    createScript(input: string): TrustedScript;
    createScriptURL(input: string): TrustedScriptURL;
    createURL?(input: string): TrustedURL;
  }

  export interface TrustedTypePolicyFactory {
    createPolicy(
      policyName: string,
      policyOptions?: {
        createHTML?: (input: string) => string;
        createScript?: (input: string) => string;
        createScriptURL?: (input: string) => string;
        createURL?: (input: string) => string;
      }
    ): TrustedTypePolicy;
  }
}

// Also define global interfaces for ambient usage
declare global {
  interface TrustedHTML {}
  interface TrustedScript {}
  interface TrustedScriptURL {}
  interface TrustedURL {}

  interface TrustedTypePolicy {
    createHTML(input: string): TrustedHTML;
    createScript(input: string): TrustedScript;
    createScriptURL(input: string): TrustedScriptURL;
    createURL?(input: string): TrustedURL;
  }

  interface TrustedTypePolicyFactory {
    createPolicy(
      policyName: string,
      policyOptions?: {
        createHTML?: (input: string) => string;
        createScript?: (input: string) => string;
        createScriptURL?: (input: string) => string;
        createURL?: (input: string) => string;
      }
    ): TrustedTypePolicy;
  }

  interface Window {
    trustedTypes?: TrustedTypePolicyFactory;
  }
}
