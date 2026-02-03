import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActorWrapper, getActorInitLogs, type InitLogEntry } from '../hooks/useActorWrapper';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Bug, X, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface DebugOverlayProps {
  currentStep: string;
}

export default function DebugOverlay({ currentStep }: DebugOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, actorReady, isError, error, currentStep: initStep } = useActorWrapper();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();
  const [actorLogs, setActorLogs] = useState<InitLogEntry[]>([]);
  const [startTime] = useState(Date.now());

  // Fetch actor initialization logs
  useEffect(() => {
    const interval = setInterval(() => {
      setActorLogs(getActorInitLogs());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

  // Calculate initialization progress
  const initSteps = ['idle', 'auth-started', 'identity-retrieved', 'actor-creating', 'actor-ready'];
  const currentStepIndex = initSteps.indexOf(initStep);
  const progressPercentage = initStep === 'error' ? 0 : ((currentStepIndex + 1) / initSteps.length) * 100;

  // Step status helper
  const getStepStatus = (step: string) => {
    const stepIndex = initSteps.indexOf(step);
    if (initStep === 'error') return 'error';
    if (stepIndex < currentStepIndex) return 'complete';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  // Check if there are any warnings in logs (non-fatal errors)
  const hasWarnings = actorLogs.some(log => 
    log.message.includes('failed (non-fatal)') || 
    log.message.includes('skipping')
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label="Open debug overlay"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden rounded-lg border bg-card shadow-xl">
      <Card className="border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
            {hasWarnings && !isError && (
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="logs">
                Logs
                {hasWarnings && !isError && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-3 mt-3">
              {/* Initialization Progress */}
              <div className="rounded-md bg-muted p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Initialization Progress</span>
                  <span className="text-xs font-mono">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs font-mono">{initStep}</div>
              </div>

              {/* Step-by-step Progress */}
              <div className="rounded-md border p-3 space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">Initialization Steps</div>
                {[
                  { step: 'auth-started', label: 'Auth Started' },
                  { step: 'identity-retrieved', label: 'Identity Retrieved' },
                  { step: 'actor-creating', label: 'Actor Created' },
                  { step: 'actor-ready', label: 'Actor Ready' },
                ].map(({ step, label }) => {
                  const status = getStepStatus(step);
                  return (
                    <div key={step} className="flex items-center gap-2">
                      {status === 'complete' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : status === 'current' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      ) : status === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={`text-xs ${status === 'current' ? 'font-semibold' : ''}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Current App Step */}
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">Current App Step</div>
                <div className="text-sm font-mono">{currentStep}</div>
              </div>

              {/* Actor Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Actor Status</span>
                  <span className={`text-xs font-mono ${actorReady ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {actorReady ? 'READY ✓' : 'NOT READY'}
                  </span>
                </div>
                {isError && (
                  <div className="text-xs text-destructive">
                    Error: {error?.message || 'Unknown error'}
                  </div>
                )}
              </div>

              {/* Internet Identity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Login Status</span>
                  <span className="text-xs font-mono">{loginStatus}</span>
                </div>
                {identity && (
                  <div className="text-xs font-mono break-all">
                    Principal: {identity.getPrincipal().toString().slice(0, 20)}...
                  </div>
                )}
              </div>

              {/* Profile Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Profile</span>
                  <span className="text-xs font-mono">
                    {profileLoading ? 'Loading...' : isFetched ? (userProfile ? 'Loaded' : 'Not Found') : 'Pending'}
                  </span>
                </div>
                {profileError && (
                  <div className="text-xs text-destructive">
                    Error: {profileError.message}
                  </div>
                )}
              </div>

              {/* Elapsed Time */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Elapsed Time</span>
                <span>{elapsedTime}s</span>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Actor Initialization Log</span>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-96">
                  {actorLogs.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">No initialization logs yet...</div>
                  ) : (
                    actorLogs.map((log, index) => {
                      const isWarning = log.message.includes('failed (non-fatal)') || log.message.includes('skipping');
                      const isError = log.step === 'error';
                      const isSuccess = log.step === 'actor-ready';
                      
                      return (
                        <div
                          key={index}
                          className={`rounded p-2 text-xs font-mono ${
                            isSuccess
                              ? 'bg-green-50 dark:bg-green-950/20'
                              : isError
                              ? 'bg-red-50 dark:bg-red-950/20'
                              : isWarning
                              ? 'bg-yellow-50 dark:bg-yellow-950/20'
                              : 'bg-blue-50 dark:bg-blue-950/20'
                          } ${index === actorLogs.length - 1 ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            {isSuccess ? (
                              <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : isError ? (
                              <XCircle className="h-3 w-3 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            ) : isWarning ? (
                              <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            ) : (
                              <Clock className="h-3 w-3 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{log.step}</div>
                              <div className="text-muted-foreground break-words">{log.message}</div>
                              <div className="text-muted-foreground mt-0.5 flex items-center gap-2">
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                {log.duration && <span className="text-green-600 dark:text-green-400">({log.duration.toFixed(0)}ms)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {actorLogs.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    Last step: {actorLogs[actorLogs.length - 1]?.step}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
