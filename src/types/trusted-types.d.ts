
// Type definitions for Trusted Types Web API
// https://w3c.github.io/webappsec-trusted-types/dist/spec/

// Define the types directly in the global scope
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

// Make these types available via import
declare module 'trusted-types' {
  export type TrustedHTML = TrustedHTML;
  export type TrustedScript = TrustedScript;
  export type TrustedScriptURL = TrustedScriptURL;
  export type TrustedURL = TrustedURL;
  export type TrustedTypePolicy = TrustedTypePolicy;
  export type TrustedTypePolicyFactory = TrustedTypePolicyFactory;
}
