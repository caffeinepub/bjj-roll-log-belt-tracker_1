import { useEffect } from 'react';
import { useGetCallerUserProfile, useGetTrainingRecords, useGetSubmissionLog } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, Clock, Award, TrendingUp, MapPin, Building2, Target, Zap } from 'lucide-react';
import { getBeltName, preloadAllBeltImages } from '../lib/beltUtils';
import { format, differenceInDays } from 'date-fns';
import TrainingHeatMap from './TrainingHeatMap';
import CachedImage from './CachedImage';
import { calculateFavoriteTheme, calculateAverageIntensity, countUniqueSubmissions, durationToHours } from '../lib/trainingAnalytics';

export default function ProfileAnalytics() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: sessions = [], isLoading: sessionsLoading } = useGetTrainingRecords();
  const { data: submissionLog, isLoading: submissionLogLoading } = useGetSubmissionLog();

  // Preload all belt images on component mount for better caching
  useEffect(() => {
    preloadAllBeltImages();
  }, []);

  if (profileLoading || sessionsLoading || submissionLogLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading profile and analytics...</p>
      </div>
    );
  }

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + Number(s.duration), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const totalRolls = sessions.reduce((sum, s) => sum + Number(s.rolls), 0);

  // Calculate submissions learned (unique submissions at blue belt and above)
  const submissionsLearned = submissionLog ? countUniqueSubmissions(submissionLog) : 0;

  // Calculate favorite theme
  const favoriteTheme = calculateFavoriteTheme(sessions);

  // Calculate average intensity
  const averageIntensity = calculateAverageIntensity(sessions);

  // Calculate training streak
  const sortedSessions = [...sessions].sort((a, b) => Number(b.date - a.date));
  let currentStreak = 0;
  if (sortedSessions.length > 0) {
    const today = new Date();
    const lastSession = new Date(Number(sortedSessions[0].date) / 1000000);
    const daysSinceLastSession = differenceInDays(today, lastSession);

    if (daysSinceLastSession <= 7) {
      currentStreak = 1;
      for (let i = 1; i < sortedSessions.length; i++) {
        const current = new Date(Number(sortedSessions[i - 1].date) / 1000000);
        const previous = new Date(Number(sortedSessions[i].date) / 1000000);
        const daysBetween = differenceInDays(current, previous);
        if (daysBetween <= 7) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  const practitionerSince = userProfile.practitionerSince 
    ? format(new Date(Number(userProfile.practitionerSince) / 1000000), 'MMMM yyyy')
    : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile Analytics</h2>
        <p className="text-muted-foreground">Your training journey and achievements</p>
      </div>

      {/* Profile Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-bjj-blue" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <CachedImage
                src={
                  userProfile.profilePicture
                    ? userProfile.profilePicture.getDirectURL()
                    : '/assets/generated/profile-avatar-placeholder.dim_256x256.png'
                }
                alt={userProfile.username}
                fallback="/assets/generated/profile-avatar-placeholder.dim_256x256.png"
                className="h-24 w-24 rounded-full object-cover border-4 border-gradient-to-br from-bjj-blue to-bjj-purple"
              />
              <div>
                <h3 className="text-2xl font-bold">{userProfile.username}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getBeltName(userProfile.beltProgress.belt)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <CachedImage
                src={userProfile.beltProgress.imageUrl}
                alt="Current belt"
                className="h-12 w-full object-contain"
                loading="eager"
              />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {Number(userProfile.beltProgress.stripes) === 0
                  ? 'No stripes'
                  : `${Number(userProfile.beltProgress.stripes)} stripe${Number(userProfile.beltProgress.stripes) !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Gym Information */}
            {userProfile.gym && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-start gap-3">
                  {userProfile.gym.logoUrl && (
                    <CachedImage
                      src={userProfile.gym.logoUrl}
                      alt="Gym logo"
                      className="h-10 w-10 object-contain rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {userProfile.gym.name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{userProfile.gym.name}</span>
                      </div>
                    )}
                    {userProfile.gym.location && (
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{userProfile.gym.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Practitioner Since</span>
                <span className="font-medium">{practitionerSince}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-bjj-purple" />
              Training Statistics
            </CardTitle>
            <CardDescription>Your training journey at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border-2 p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Sessions</span>
                </div>
                <p className="text-3xl font-bold">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">Training sessions logged</p>
              </div>

              <div className="rounded-lg border-2 p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Training Time</span>
                </div>
                <p className="text-3xl font-bold">{totalHours}h</p>
                <p className="text-xs text-muted-foreground">{totalMinutes} minutes total</p>
              </div>

              <div className="rounded-lg border-2 p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Rolls</span>
                </div>
                <p className="text-3xl font-bold">{totalRolls}</p>
                <p className="text-xs text-muted-foreground">Sparring rounds completed</p>
              </div>

              <div className="rounded-lg border-2 p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">Submissions Learned</span>
                </div>
                <p className="text-3xl font-bold">{submissionsLearned}</p>
                <p className="text-xs text-muted-foreground">Unique submissions (blue+)</p>
              </div>

              <div className="rounded-lg border-2 p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Favorite Theme</span>
                </div>
                <p className="text-2xl font-bold truncate">{favoriteTheme}</p>
                <p className="text-xs text-muted-foreground">Most practiced theme</p>
              </div>

              <div className="rounded-lg border-2 p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Average Intensity</span>
                </div>
                <p className="text-2xl font-bold truncate">{averageIntensity}</p>
                <p className="text-xs text-muted-foreground">Overall session intensity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Heat Map */}
      <TrainingHeatMap />

      {/* Training Goals Section */}
      {userProfile.trainingGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Training Goals</CardTitle>
            <CardDescription>Your current training objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userProfile.trainingGoals.map((goal) => (
                <div key={goal.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{goal.name}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {Number(goal.completedRepetitions)} / {Number(goal.targetRepetitions)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-bjj-blue to-bjj-purple"
                        style={{
                          width: `${Math.min((Number(goal.completedRepetitions) / Number(goal.targetRepetitions)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
