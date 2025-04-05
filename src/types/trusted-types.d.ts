
// Type definitions for Trusted Types Web API
// https://w3c.github.io/webappsec-trusted-types/dist/spec/

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

// Ambient module declaration
declare module 'trusted-types' {
  export type TrustedHTML = TrustedHTML;
  export type TrustedScript = TrustedScript;
  export type TrustedScriptURL = TrustedScriptURL;
  export type TrustedURL = TrustedURL;
  export type TrustedTypePolicy = TrustedTypePolicy;
  export type TrustedTypePolicyFactory = TrustedTypePolicyFactory;
}

// This export ensures this is treated as a module
export {};
