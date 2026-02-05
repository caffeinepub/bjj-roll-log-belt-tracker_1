import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorWrapper } from './useActorWrapper';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  UserProfile,
  TrainingSession,
  Technique,
  BeltProgress,
  ExternalBlob,
  GymInfo,
  Time,
  TrainingHourRecord,
  SubmissionLog,
  BeltStageHistory,
} from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        throw new Error('Actor not ready');
      }
      
      console.log('[Profile] Fetching caller user profile...');

      try {
        const profile = await actor.getCallerUserProfile();
        console.log('[Profile] Fetch result:', profile === null ? 'null (no profile)' : `loaded: ${profile.username}`);
        return profile;
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        console.error('[Profile] Fetch error:', errorMessage);
        
        // Handle authorization errors gracefully - treat as missing profile
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('must be registered')) {
          return null;
        }
        
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    retry: false, // No retries - simple linear flow
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: actorFetching || !actorReady || query.isLoading,
    isFetched: !!actor && actorReady && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      
      console.log('[Profile] Saving caller user profile...');
      await actor.saveCallerUserProfile(profile);
      console.log('[Profile] Save completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      console.error('[Profile] Save error:', error.message);
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });
}

export function useRegister() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      username, 
      beltProgress,
      profilePicture,
      gym,
      practitionerSince,
    }: { 
      username: string; 
      beltProgress: BeltProgress;
      profilePicture: ExternalBlob | null;
      gym: GymInfo | null;
      practitionerSince: bigint | null;
    }) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      
      console.log('[Register] Starting registration for:', username);
      await actor.register(
        username, 
        beltProgress, 
        profilePicture, 
        gym, 
        practitionerSince,
        '', // bio
        ''  // nickname
      );
      console.log('[Register] Registration completed');
    },
    onSuccess: () => {
      console.log('[Register] Invalidating profile cache');
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile created successfully');
    },
    onError: (error: Error) => {
      console.error('[Register] Error:', error.message);
      toast.error(`Failed to create profile: ${error.message}`);
    },
  });
}

// Training Records Queries
export function useGetTrainingRecords() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  return useQuery<TrainingSession[]>({
    queryKey: ['trainingRecords'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        return [];
      }
      try {
        return await actor.getTrainingRecords();
      } catch (error: any) {
        console.error('Failed to fetch training records:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 10000,
  });
}

export function useAddTrainingRecord() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (training: TrainingSession) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.addTrainingRecord(training);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingRecords'] });
      toast.success('Training session logged successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to log training: ${error.message}`);
    },
  });
}

export function useSaveTrainingRecords() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trainingRecords: TrainingSession[]) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.saveTrainingRecords(trainingRecords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingRecords'] });
      toast.success('Training records updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update training records: ${error.message}`);
    },
  });
}

// Belt Progress Queries
export function useGetBeltProgress() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  return useQuery<BeltProgress | null>({
    queryKey: ['beltProgress'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      try {
        const beltProgress = await actor.getBeltProgress();
        return beltProgress;
      } catch (error: any) {
        console.error('Failed to fetch belt progress:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 30000,
  });
}

export function useUpdateBeltProgress() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (beltProgress: BeltProgress) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.updateBeltProgress(beltProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beltProgress'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['submissionLog'] });
      queryClient.invalidateQueries({ queryKey: ['beltStageHistory'] });
      toast.success('Belt progress updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update belt progress: ${error.message}`);
    },
  });
}

// Technique Library Queries
export function useGetTechniques() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  return useQuery<Technique[]>({
    queryKey: ['techniques'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        return [];
      }
      try {
        return await actor.getTechniques();
      } catch (error: any) {
        console.error('Failed to fetch techniques:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 30000,
  });
}

export function useAddTechnique() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (technique: Technique) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.addTechnique(technique);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniques'] });
      toast.success('Technique added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add technique: ${error.message}`);
    },
  });
}

// Custom Technique Types Queries
export function useGetCustomTechniqueTypes() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  return useQuery<string[]>({
    queryKey: ['customTechniqueTypes'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        return [];
      }
      try {
        return await actor.getCustomTechniqueTypes();
      } catch (error: any) {
        console.error('Failed to fetch custom technique types:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 60000,
  });
}

export function useAddCustomTechniqueType() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeName: string) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.addCustomTechniqueType(typeName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customTechniqueTypes'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add custom type: ${error.message}`);
    },
  });
}

// Theme Preference Queries
export function useUpdateThemePreference() {
  const { actor, actorReady } = useActorWrapper();

  return useMutation({
    mutationFn: async (theme: string) => {
      if (!actor || !actorReady) {
        return;
      }
      await actor.updateThemePreference(theme);
    },
    onError: (error: Error) => {
      console.error('Failed to update theme preference in backend:', error.message);
    },
  });
}

// Training Hours Queries
export function useGetAllTrainingHours() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  return useQuery<TrainingHourRecord[]>({
    queryKey: ['trainingHours'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        return [];
      }
      try {
        return await actor.getAllTrainingHours();
      } catch (error: any) {
        console.error('Failed to fetch training hours:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 10000,
  });
}

export function useSetTrainingHours() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, hours }: { date: string; hours: number }) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.setTrainingHours(date, hours);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingHours'] });
    },
    onError: (error: Error) => {
      console.error('Failed to set training hours:', error.message);
      throw error;
    },
  });
}

export function useClearTrainingHours() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.clearTrainingHours(date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingHours'] });
    },
    onError: (error: Error) => {
      console.error('Failed to clear training hours:', error.message);
      throw error;
    },
  });
}

// Submission Log Queries
export function useGetSubmissionLog() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();

  return useQuery<SubmissionLog>({
    queryKey: ['submissionLog'],
    queryFn: async () => {
      if (!actor || !actorReady) {
        return {
          whiteBelt: [],
          blueBelt: [],
          purpleBelt: [],
          brownBelt: [],
          blackBelt: [],
        };
      }
      try {
        return await actor.getSubmissionLog();
      } catch (error: any) {
        console.error('Failed to fetch submission log:', error);
        return {
          whiteBelt: [],
          blueBelt: [],
          purpleBelt: [],
          brownBelt: [],
          blackBelt: [],
        };
      }
    },
    enabled: !!actor && !actorFetching && actorReady,
    staleTime: 10000,
  });
}

export function useSaveSubmissionLog() {
  const { actor, actorReady } = useActorWrapper();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: SubmissionLog) => {
      if (!actor || !actorReady) {
        throw new Error('Connection not ready');
      }
      await actor.saveSubmissionLog(log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissionLog'] });
      toast.success('Submission log saved successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to save submission log:', error.message);
      toast.error(`Failed to save submission log: ${error.message}`);
    },
  });
}

// Belt Stage History Queries
export function useGetBeltStageHistory() {
  const { actor, isFetching: actorFetching, actorReady } = useActorWrapper();
  const { identity } = useInternetIdentity();

  return useQuery<BeltStageHistory>({
    queryKey: ['beltStageHistory'],
    queryFn: async () => {
      if (!actor || !actorReady || !identity) {
        return [];
      }
      try {
        const principal = identity.getPrincipal();
        return await actor.getBeltStageHistory(principal);
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        console.error('[BeltStageHistory] Fetch error:', errorMessage);
        
        // Handle authorization errors gracefully - treat as empty history
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('Can only view your own')) {
          return [];
        }
        
        return [];
      }
    },
    enabled: !!actor && !actorFetching && actorReady && !!identity,
    retry: false,
    staleTime: 30000,
  });
}
