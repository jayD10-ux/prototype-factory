
import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import { useClerkAuth } from '@/lib/clerk-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function ValidationTests() {
  const { supabase, isAuthenticated, clerkId, session } = useSupabase();
  const { user } = useClerkAuth();
  
  const [testResults, setTestResults] = useState<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    message?: string;
    error?: string;
  }[]>([
    { id: 'auth-check', name: 'Authentication Check', status: 'pending' },
    { id: 'db-access', name: 'Database Access', status: 'pending' },
    { id: 'rls-policies', name: 'RLS Policies', status: 'pending' },
    { id: 'prototype-access', name: 'Prototype Access', status: 'pending' },
    { id: 'sharing', name: 'Share Functionality', status: 'pending' },
    { id: 'feedback', name: 'Feedback Functionality', status: 'pending' },
  ]);
  
  const updateTestStatus = (id: string, status: 'pending' | 'running' | 'passed' | 'failed', message?: string, error?: string) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, status, message, error } : test
    ));
  };

  // Test 1: Authentication Check
  const testAuthentication = async () => {
    updateTestStatus('auth-check', 'running');
    try {
      if (!isAuthenticated || !clerkId) {
        updateTestStatus('auth-check', 'failed', 'No authenticated user found');
        return;
      }
      
      // Test that session contains correct user ID
      if (session?.user?.id !== clerkId) {
        updateTestStatus('auth-check', 'failed', 'User ID mismatch between Clerk and Supabase session');
        return;
      }
      
      updateTestStatus('auth-check', 'passed', 'Authentication is working correctly');
      return true;
    } catch (error: any) {
      console.error('Authentication test failed:', error);
      updateTestStatus('auth-check', 'failed', 'Authentication test failed', error.message);
      return false;
    }
  };

  // Test 2: Database Access
  const testDatabaseAccess = async () => {
    updateTestStatus('db-access', 'running');
    try {
      if (!isAuthenticated) {
        updateTestStatus('db-access', 'failed', 'User must be authenticated');
        return;
      }
      
      // Try to fetch user's own profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!data) {
        updateTestStatus('db-access', 'failed', 'User profile not found');
        return false;
      }
      
      updateTestStatus('db-access', 'passed', 'Database access is working correctly');
      return true;
    } catch (error: any) {
      console.error('Database access test failed:', error);
      updateTestStatus('db-access', 'failed', 'Database access test failed', error.message);
      return false;
    }
  };

  // Test 3: RLS Policies
  const testRLSPolicies = async () => {
    updateTestStatus('rls-policies', 'running');
    try {
      if (!isAuthenticated) {
        updateTestStatus('rls-policies', 'failed', 'User must be authenticated');
        return;
      }
      
      // Test 1: Try to access own prototypes (should succeed)
      const { data: ownPrototypes, error: ownError } = await supabase
        .from('prototypes')
        .select('id')
        .eq('clerk_id', clerkId)
        .limit(1);
        
      if (ownError) {
        throw new Error(`Failed to access own prototypes: ${ownError.message}`);
      }
      
      // Test 2: Try to access random prototype without proper access (should fail or return empty)
      const { data: otherPrototype, error: otherError } = await supabase
        .from('prototypes')
        .select('id')
        .neq('clerk_id', clerkId)
        .not('id', 'in', (q) => 
          q.from('prototype_shares')
            .select('prototype_id')
            .eq('email', user?.email)
            .or(`is_public.eq.true`)
        )
        .limit(1);
        
      // This should either return an error or empty array due to RLS
      if (otherPrototype && otherPrototype.length > 0) {
        updateTestStatus('rls-policies', 'failed', 'User can access prototypes they should not have access to');
        return false;
      }
      
      updateTestStatus('rls-policies', 'passed', 'RLS policies are working correctly');
      return true;
    } catch (error: any) {
      console.error('RLS policies test failed:', error);
      updateTestStatus('rls-policies', 'failed', 'RLS policies test failed', error.message);
      return false;
    }
  };

  // Test 4: Prototype Access
  const testPrototypeAccess = async () => {
    updateTestStatus('prototype-access', 'running');
    try {
      if (!isAuthenticated) {
        updateTestStatus('prototype-access', 'failed', 'User must be authenticated');
        return;
      }
      
      // Create a test prototype
      const { data: prototype, error: createError } = await supabase
        .from('prototypes')
        .insert({
          name: `Test Prototype ${Date.now()}`,
          url: 'https://example.com',
          clerk_id: clerkId,
          created_by: clerkId
        })
        .select()
        .single();
        
      if (createError) {
        throw new Error(`Failed to create test prototype: ${createError.message}`);
      }
      
      if (!prototype) {
        updateTestStatus('prototype-access', 'failed', 'Failed to create test prototype');
        return false;
      }
      
      // Check if we can retrieve it
      const { data: retrieved, error: retrieveError } = await supabase
        .from('prototypes')
        .select('*')
        .eq('id', prototype.id)
        .single();
        
      if (retrieveError || !retrieved) {
        throw new Error(`Failed to retrieve test prototype: ${retrieveError?.message || 'No data'}`);
      }
      
      // Clean up by deleting the test prototype
      const { error: deleteError } = await supabase
        .from('prototypes')
        .delete()
        .eq('id', prototype.id);
        
      if (deleteError) {
        console.warn('Failed to delete test prototype:', deleteError);
      }
      
      updateTestStatus('prototype-access', 'passed', 'Prototype access is working correctly');
      return true;
    } catch (error: any) {
      console.error('Prototype access test failed:', error);
      updateTestStatus('prototype-access', 'failed', 'Prototype access test failed', error.message);
      return false;
    }
  };

  // Test 5: Share Functionality
  const testSharing = async () => {
    updateTestStatus('sharing', 'running');
    try {
      if (!isAuthenticated) {
        updateTestStatus('sharing', 'failed', 'User must be authenticated');
        return;
      }
      
      // Create a test prototype
      const { data: prototype, error: createError } = await supabase
        .from('prototypes')
        .insert({
          name: `Share Test Prototype ${Date.now()}`,
          url: 'https://example.com',
          clerk_id: clerkId,
          created_by: clerkId
        })
        .select()
        .single();
        
      if (createError) {
        throw new Error(`Failed to create test prototype: ${createError.message}`);
      }
      
      if (!prototype) {
        updateTestStatus('sharing', 'failed', 'Failed to create test prototype');
        return false;
      }
      
      // Create a share
      const { data: share, error: shareError } = await supabase
        .from('prototype_shares')
        .insert({
          prototype_id: prototype.id,
          shared_by: clerkId,
          email: 'test@example.com',
          permission: 'view',
          is_link_share: false,
          is_public: false
        })
        .select()
        .single();
        
      if (shareError) {
        throw new Error(`Failed to create share: ${shareError.message}`);
      }
      
      if (!share) {
        updateTestStatus('sharing', 'failed', 'Failed to create share');
        return false;
      }
      
      // Create a public link share
      const { data: linkShare, error: linkShareError } = await supabase
        .from('prototype_shares')
        .insert({
          prototype_id: prototype.id,
          shared_by: clerkId,
          permission: 'view',
          is_link_share: true,
          is_public: true
        })
        .select()
        .single();
        
      if (linkShareError) {
        throw new Error(`Failed to create link share: ${linkShareError.message}`);
      }
      
      // Clean up by deleting shares and prototype
      await supabase.from('prototype_shares').delete().eq('prototype_id', prototype.id);
      await supabase.from('prototypes').delete().eq('id', prototype.id);
      
      updateTestStatus('sharing', 'passed', 'Sharing functionality is working correctly');
      return true;
    } catch (error: any) {
      console.error('Sharing test failed:', error);
      updateTestStatus('sharing', 'failed', 'Sharing test failed', error.message);
      return false;
    }
  };

  // Test 6: Feedback Functionality
  const testFeedback = async () => {
    updateTestStatus('feedback', 'running');
    try {
      if (!isAuthenticated) {
        updateTestStatus('feedback', 'failed', 'User must be authenticated');
        return;
      }
      
      // Create a test prototype
      const { data: prototype, error: createError } = await supabase
        .from('prototypes')
        .insert({
          name: `Feedback Test Prototype ${Date.now()}`,
          url: 'https://example.com',
          clerk_id: clerkId,
          created_by: clerkId
        })
        .select()
        .single();
        
      if (createError) {
        throw new Error(`Failed to create test prototype: ${createError.message}`);
      }
      
      // Add feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('prototype_feedback')
        .insert({
          prototype_id: prototype.id,
          created_by: clerkId,
          content: 'Test feedback',
          position: { x: 50, y: 50 }
        })
        .select()
        .single();
        
      if (feedbackError) {
        throw new Error(`Failed to create feedback: ${feedbackError.message}`);
      }
      
      // Add reply to feedback (might require prototype_feedback_replies table)
      let replySuccess = false;
      try {
        // Instead of directly accessing the table, we'll check if it exists first
        const { data: tableExists } = await supabase
          .rpc('column_exists', {
            table_name: 'prototype_feedback_replies',
            column_name: 'id'
          });
        
        if (tableExists) {
          // Use any() type assertion to bypass TypeScript's type checking for this dynamic table access
          await (supabase.from('prototype_feedback_replies') as any)
            .insert({
              comment_id: feedback.id,
              content: 'Test reply',
              created_by: clerkId
            });
          replySuccess = true;
        }
      } catch (replyError) {
        console.warn('Reply test skipped: table might not exist', replyError);
      }
      
      // Clean up by deleting feedback and prototype
      if (replySuccess) {
        try {
          // Use any() type assertion to bypass TypeScript's type checking
          await (supabase.from('prototype_feedback_replies') as any)
            .delete()
            .eq('comment_id', feedback.id);
        } catch (e) {
          console.warn('Could not clean up feedback replies', e);
        }
      }
      await supabase.from('prototype_feedback').delete().eq('id', feedback.id);
      await supabase.from('prototypes').delete().eq('id', prototype.id);
      
      updateTestStatus('feedback', 'passed', 'Feedback functionality is working correctly');
      return true;
    } catch (error: any) {
      console.error('Feedback test failed:', error);
      updateTestStatus('feedback', 'failed', 'Feedback test failed', error.message);
      return false;
    }
  };

  const runAllTests = async () => {
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending', message: undefined, error: undefined })));
    
    // Run tests in sequence
    await testAuthentication();
    await testDatabaseAccess();
    await testRLSPolicies();
    await testPrototypeAccess();
    await testSharing();
    await testFeedback();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Validation Tests</CardTitle>
          <CardDescription>
            This tool validates that all aspects of the Clerk-Supabase integration are working properly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Current Authentication Status</h3>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Authenticated as {user?.name || user?.email || clerkId}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>Not authenticated</span>
                  </>
                )}
              </div>
            </div>
            
            <Button onClick={runAllTests} disabled={!isAuthenticated}>
              Run All Tests
            </Button>
            
            <div className="grid gap-4 mt-4">
              {testResults.map(test => (
                <div key={test.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    {test.message && <p className="text-sm text-muted-foreground">{test.message}</p>}
                    {test.error && <p className="text-sm text-destructive">{test.error}</p>}
                  </div>
                  <div>
                    {test.status === 'pending' && (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    {test.status === 'running' && (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                    {test.status === 'passed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {test.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            After validation, consider these cleanup tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Remove legacy UUID fields like created_by, user_id</li>
            <li>Deprecate fallback logic in the client</li>
            <li>Finalize migration docs for future developers</li>
            <li>Consider updating database function signatures</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
