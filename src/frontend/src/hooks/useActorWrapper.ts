import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_QUERY_KEY = 'actor';

// Initialization step tracking for debug overlay
export type InitStep = 
  | 'idle'
  | 'auth-started'
  | 'identity-retrieved'
  | 'actor-creating'
  | 'actor-ready'
  | 'error';

export type InitLogEntry = {
  timestamp: number;
  step: InitStep;
  message: string;
  duration?: number;
};

// Global log buffer for debug overlay
let globalInitLogs: InitLogEntry[] = [];

export function getActorInitLogs(): InitLogEntry[] {
  return [...globalInitLogs];
}

function addInitLog(step: InitStep, message: string, duration?: number) {
  const entry: InitLogEntry = {
    timestamp: Date.now(),
    step,
    message,
    duration,
  };
  globalInitLogs.push(entry);
  // Keep last 30 entries
  if (globalInitLogs.length > 30) {
    globalInitLogs = globalInitLogs.slice(-30);
  }
  console.log(`[ActorInit] ${step}: ${message}${duration ? ` (${duration}ms)` : ''}`);
}

/**
 * Actor initialization hook with step-by-step tracking.
 * Implements simple linear sequence: Auth → Identity → Actor Creation → Ready
 */
export function useActorWrapper() {
    const { identity, loginStatus } = useInternetIdentity();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState<InitStep>('idle');
    const [stepStartTime, setStepStartTime] = useState<number>(0);
    const [initStartTime, setInitStartTime] = useState<number>(0);

    // Step 1: Track authentication start
    useEffect(() => {
      if (loginStatus === 'logging-in' && currentStep === 'idle') {
        setCurrentStep('auth-started');
        setStepStartTime(performance.now());
        setInitStartTime(performance.now());
        addInitLog('auth-started', 'Authentication started');
      }
    }, [loginStatus, currentStep]);

    // Step 2: Identity retrieved
    useEffect(() => {
      if (identity && loginStatus === 'success' && currentStep === 'auth-started') {
        const duration = performance.now() - stepStartTime;
        setCurrentStep('identity-retrieved');
        setStepStartTime(performance.now());
        addInitLog('identity-retrieved', `Identity retrieved: ${identity.getPrincipal().toString().slice(0, 20)}...`, duration);
      }
    }, [identity, loginStatus, currentStep, stepStartTime]);

    const actorQuery = useQuery<backendInterface>({
        queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
        queryFn: async () => {
            const isAuthenticated = !!identity;

            if (!isAuthenticated) {
                // Return anonymous actor if not authenticated
                addInitLog('idle', 'Creating anonymous actor (not authenticated)');
                return await createActorWithConfig();
            }

            // Step 3: Actor creating
            if (currentStep === 'identity-retrieved') {
              const duration = performance.now() - stepStartTime;
              setCurrentStep('actor-creating');
              setStepStartTime(performance.now());
              addInitLog('actor-creating', 'Creating authenticated actor with identity', duration);
            }

            const actorOptions = {
                agentOptions: {
                    identity
                }
            };

            const actor = await createActorWithConfig(actorOptions);
            
            // Only attempt secret-based bootstrap if a non-empty admin token is present
            const adminToken = getSecretParameter('caffeineAdminToken') || '';
            
            if (adminToken.trim()) {
              addInitLog('actor-creating', 'Admin token detected, attempting access control initialization');
              try {
                await actor._initializeAccessControlWithSecret(adminToken);
                addInitLog('actor-creating', 'Access control initialization succeeded');
              } catch (err: any) {
                // Non-fatal for normal users: log but continue
                addInitLog('actor-creating', `Access control initialization failed (non-fatal): ${err.message || 'Unknown error'}`);
                console.warn('[ActorInit] Secret bootstrap failed (non-fatal):', err);
              }
            } else {
              addInitLog('actor-creating', 'No admin token present, skipping secret-based bootstrap');
            }
            
            // Step 4: Actor ready
            const duration = performance.now() - stepStartTime;
            const totalDuration = performance.now() - initStartTime;
            setCurrentStep('actor-ready');
            addInitLog('actor-ready', 'Actor fully initialized and ready', duration);
            addInitLog('actor-ready', `Total initialization time: ${totalDuration.toFixed(0)}ms`);
            
            return actor;
        },
        staleTime: Infinity,
        enabled: true,
        retry: false,
    });

    // When the actor changes, invalidate dependent queries
    useEffect(() => {
        if (actorQuery.data && !actorQuery.isFetching) {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return !query.queryKey.includes(ACTOR_QUERY_KEY);
                }
            });
            queryClient.refetchQueries({
                predicate: (query) => {
                    return !query.queryKey.includes(ACTOR_QUERY_KEY);
                }
            });
        }
    }, [actorQuery.data, actorQuery.isFetching, queryClient]);

    // Track errors
    useEffect(() => {
      if (actorQuery.isError) {
        setCurrentStep('error');
        const errorMessage = actorQuery.error?.message || 'Unknown error';
        addInitLog('error', `Actor initialization failed at step: ${currentStep}. Error: ${errorMessage}`);
      }
    }, [actorQuery.isError, actorQuery.error, currentStep]);

    return {
        actor: actorQuery.data || null,
        isFetching: actorQuery.isFetching,
        isError: actorQuery.isError,
        error: actorQuery.error as Error | null,
        actorReady: !!actorQuery.data && !actorQuery.isFetching,
        currentStep,
    };
}
