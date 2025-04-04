
// Type definitions for Trusted Types Web API
// https://w3c.github.io/webappsec-trusted-types/dist/spec/

declare namespace TrustedTypesNamespace {
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

// Declare global interfaces
declare global {
  // Use the namespace's interfaces in the global scope
  type TrustedHTML = TrustedTypesNamespace.TrustedHTML;
  type TrustedScript = TrustedTypesNamespace.TrustedScript;
  type TrustedScriptURL = TrustedTypesNamespace.TrustedScriptURL;
  type TrustedURL = TrustedTypesNamespace.TrustedURL;
  type TrustedTypePolicy = TrustedTypesNamespace.TrustedTypePolicy;
  type TrustedTypePolicyFactory = TrustedTypesNamespace.TrustedTypePolicyFactory;

  // Augment the Window interface
  interface Window {
    trustedTypes?: TrustedTypePolicyFactory;
  }
}

// Module declaration for importing
declare module 'trusted-types' {
  export import TrustedHTML = TrustedTypesNamespace.TrustedHTML;
  export import TrustedScript = TrustedTypesNamespace.TrustedScript;
  export import TrustedScriptURL = TrustedTypesNamespace.TrustedScriptURL;
  export import TrustedURL = TrustedTypesNamespace.TrustedURL;
  export import TrustedTypePolicy = TrustedTypesNamespace.TrustedTypePolicy;
  export import TrustedTypePolicyFactory = TrustedTypesNamespace.TrustedTypePolicyFactory;
}
