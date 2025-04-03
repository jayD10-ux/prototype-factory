
/**
 * Type definitions for Trusted Types
 * https://w3c.github.io/webappsec-trusted-types/dist/spec/
 */

// Define the type in a module format for import usage
declare module 'trusted-types' {
  namespace TrustedHTML {
    type PolicyName = string;
    type PolicyLiteral = string;
  }

  interface TrustedTypePolicyFactory {
    createPolicy(
      policyName: TrustedHTML.PolicyName,
      policyOptions?: {
        createHTML?: (input: string) => string;
        createScript?: (input: string) => string;
        createScriptURL?: (input: string) => string;
        createURL?: (input: string) => string;
      }
    ): TrustedTypePolicy;
  }

  interface TrustedTypePolicy {
    createHTML(input: string): TrustedHTML;
    createScript(input: string): TrustedScript;
    createScriptURL(input: string): TrustedScriptURL;
    createURL?(input: string): TrustedURL;
  }

  interface TrustedHTML {}
  interface TrustedScript {}
  interface TrustedScriptURL {}
  interface TrustedURL {}
}

// Also declare global types for direct usage without imports
declare global {
  namespace TrustedHTML {
    type PolicyName = string;
    type PolicyLiteral = string;
  }

  interface TrustedTypePolicyFactory {
    createPolicy(
      policyName: TrustedHTML.PolicyName,
      policyOptions?: {
        createHTML?: (input: string) => string;
        createScript?: (input: string) => string;
        createScriptURL?: (input: string) => string;
        createURL?: (input: string) => string;
      }
    ): TrustedTypePolicy;
  }

  interface TrustedTypePolicy {
    createHTML(input: string): TrustedHTML;
    createScript(input: string): TrustedScript;
    createScriptURL(input: string): TrustedScriptURL;
    createURL?(input: string): TrustedURL;
  }

  interface TrustedHTML {}
  interface TrustedScript {}
  interface TrustedScriptURL {}
  interface TrustedURL {}

  // Add to window object
  interface Window {
    trustedTypes?: TrustedTypePolicyFactory;
  }
}

// This empty export is necessary to make this file a proper module
export {};
