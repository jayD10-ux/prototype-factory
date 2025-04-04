
// Type definitions for Trusted Types Web API
// https://w3c.github.io/webappsec-trusted-types/dist/spec/

// Triple-slash directive to indicate this is a lib file
/// <reference lib="dom" />

// Global declarations for the Trusted Types API
declare namespace TrustedTypes {
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
}

// Extend Window interface
interface Window {
  trustedTypes?: TrustedTypes.TrustedTypePolicyFactory;
}

// Ambient module declaration
declare module 'trusted-types' {
  export const TrustedHTML: TrustedTypes.TrustedHTML;
  export const TrustedScript: TrustedTypes.TrustedScript;
  export const TrustedScriptURL: TrustedTypes.TrustedScriptURL;
  export const TrustedURL: TrustedTypes.TrustedURL;
  export const TrustedTypePolicy: TrustedTypes.TrustedTypePolicy;
  export const TrustedTypePolicyFactory: TrustedTypes.TrustedTypePolicyFactory;
}
