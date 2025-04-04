
// Type definitions for Trusted Types Web API
// https://w3c.github.io/webappsec-trusted-types/dist/spec/

// Define the interfaces directly in the global scope
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

  // Augment the Window interface
  interface Window {
    trustedTypes?: TrustedTypePolicyFactory;
  }
}

// For module imports
declare module 'trusted-types' {
  export const TrustedHTML: TrustedHTML;
  export const TrustedScript: TrustedScript;
  export const TrustedScriptURL: TrustedScriptURL;
  export const TrustedURL: TrustedURL;
  export const TrustedTypePolicy: TrustedTypePolicy;
  export const TrustedTypePolicyFactory: TrustedTypePolicyFactory;
}

// This is needed to make the file a module
export {};
