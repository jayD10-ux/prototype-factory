
/**
 * Type definitions for Trusted Types
 * https://w3c.github.io/webappsec-trusted-types/dist/spec/
 */

// First, declare the module 'trusted-types'
declare module 'trusted-types' {
  export namespace TrustedHTML {
    type PolicyName = string;
    type PolicyLiteral = string;
  }

  export interface TrustedTypePolicyFactory {
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

  export interface TrustedTypePolicy {
    createHTML(input: string): TrustedHTML;
    createScript(input: string): TrustedScript;
    createScriptURL(input: string): TrustedScriptURL;
    createURL?(input: string): TrustedURL;
  }

  export interface TrustedHTML {}
  export interface TrustedScript {}
  export interface TrustedScriptURL {}
  export interface TrustedURL {}
}

// Then, also add global declarations
declare global {
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

// This empty export makes this file a module
export {};
