import { useState, useEffect } from 'react';
import { useRegister, useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActorWrapper } from '../hooks/useActorWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Upload, X, ArrowLeft } from 'lucide-react';
import { BeltLevel, ExternalBlob } from '../backend';
import { getBeltImageUrl } from '../lib/beltUtils';
import { cn } from '@/lib/utils';

interface ProfileSetupProps {
  isEditing: boolean;
  onComplete: () => void;
}

export default function ProfileSetup({ isEditing, onComplete }: ProfileSetupProps) {
  const { data: existingProfile } = useGetCallerUserProfile();
  const [username, setUsername] = useState('');
  const [belt, setBelt] = useState<BeltLevel>(BeltLevel.white);
  const [stripes, setStripes] = useState(0);
  const [profilePicture, setProfilePicture] = useState<ExternalBlob | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [gymName, setGymName] = useState('');
  const [gymLocation, setGymLocation] = useState('');
  const [gymUrl, setGymUrl] = useState('');
  const [gymLogoUrl, setGymLogoUrl] = useState<string | null>(null);
  const [practitionerSinceMonth, setPractitionerSinceMonth] = useState('');
  const [practitionerSinceYear, setPractitionerSinceYear] = useState('');

  const { actorReady } = useActorWrapper();
  const registerMutation = useRegister();
  const saveMutation = useSaveCallerUserProfile();

  // Load existing profile data when editing
  useEffect(() => {
    if (isEditing && existingProfile) {
      setUsername(existingProfile.username);
      setBelt(existingProfile.beltProgress.belt);
      setStripes(Number(existingProfile.beltProgress.stripes));
      
      if (existingProfile.profilePicture) {
        setProfilePicture(existingProfile.profilePicture);
        setProfilePicturePreview(existingProfile.profilePicture.getDirectURL());
      }
      
      if (existingProfile.gym) {
        setGymName(existingProfile.gym.name);
        setGymLocation(existingProfile.gym.location);
        if (existingProfile.gym.logoUrl) {
          setGymLogoUrl(existingProfile.gym.logoUrl);
        }
      }
      
      if (existingProfile.practitionerSince) {
        const date = new Date(Number(existingProfile.practitionerSince) / 1000000);
        setPractitionerSinceMonth((date.getMonth() + 1).toString());
        setPractitionerSinceYear(date.getFullYear().toString());
      }
    }
  }, [isEditing, existingProfile]);

  // Extract favicon URL from gym URL
  useEffect(() => {
    if (gymUrl) {
      try {
        const url = new URL(gymUrl.startsWith('http') ? gymUrl : `https://${gymUrl}`);
        const faviconUrl = `${url.origin}/favicon.ico`;
        setGymLogoUrl(faviconUrl);
      } catch {
        setGymLogoUrl(null);
      }
    } else {
      setGymLogoUrl(null);
    }
  }, [gymUrl]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicturePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to ExternalBlob
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(uint8Array);
    setProfilePicture(blob);
  };

  const handleCancel = () => {
    if (isEditing) {
      // Reset form to original values
      if (existingProfile) {
        setUsername(existingProfile.username);
        setBelt(existingProfile.beltProgress.belt);
        setStripes(Number(existingProfile.beltProgress.stripes));
        
        if (existingProfile.profilePicture) {
          setProfilePicture(existingProfile.profilePicture);
          setProfilePicturePreview(existingProfile.profilePicture.getDirectURL());
        } else {
          setProfilePicture(null);
          setProfilePicturePreview(null);
        }
        
        if (existingProfile.gym) {
          setGymName(existingProfile.gym.name);
          setGymLocation(existingProfile.gym.location);
          if (existingProfile.gym.logoUrl) {
            setGymLogoUrl(existingProfile.gym.logoUrl);
          }
        } else {
          setGymName('');
          setGymLocation('');
          setGymUrl('');
          setGymLogoUrl(null);
        }
        
        if (existingProfile.practitionerSince) {
          const date = new Date(Number(existingProfile.practitionerSince) / 1000000);
          setPractitionerSinceMonth((date.getMonth() + 1).toString());
          setPractitionerSinceYear(date.getFullYear().toString());
        } else {
          setPractitionerSinceMonth('');
          setPractitionerSinceYear('');
        }
      }
    }
    onComplete();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !actorReady) {
      return;
    }

    const beltProgress = {
      belt,
      stripes: BigInt(stripes),
      imageUrl: getBeltImageUrl(belt, stripes),
    };

    let practitionerSince: bigint | null = null;
    if (practitionerSinceMonth && practitionerSinceYear) {
      const date = new Date(parseInt(practitionerSinceYear), parseInt(practitionerSinceMonth) - 1, 1);
      practitionerSince = BigInt(date.getTime() * 1000000);
    }

    const gymInfo = gymName || gymLocation || gymLogoUrl ? {
      name: gymName,
      location: gymLocation,
      logoUrl: gymLogoUrl || undefined,
    } : null;

    if (isEditing && existingProfile) {
      // Update existing profile
      const updatedProfile = {
        ...existingProfile,
        username: username.trim(),
        beltProgress,
        profilePicture: profilePicture || undefined,
        gym: gymInfo || undefined,
        practitionerSince: practitionerSince || undefined,
      };
      await saveMutation.mutateAsync(updatedProfile);
      onComplete();
    } else {
      // Create new profile
      console.log('[ProfileSetup] Submitting profile...');
      await registerMutation.mutateAsync({ 
        username: username.trim(), 
        beltProgress,
        profilePicture: profilePicture || null,
        gym: gymInfo,
        practitionerSince,
      });
    }
  };

  const isSubmitting = registerMutation.isPending || saveMutation.isPending;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
      <Card className="w-full max-w-2xl border-2 shadow-lg">
        <CardHeader className="text-center">
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-bjj-blue to-bjj-purple">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">
            {isEditing ? 'Edit Profile' : 'Welcome to BJJ Roll Log'}
          </CardTitle>
          <CardDescription>
            {isEditing ? 'Update your profile information' : 'Complete your profile to start tracking your BJJ journey'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                {profilePicturePreview ? (
                  <div className="relative">
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="h-24 w-24 rounded-full object-cover border-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePicture(null);
                        setProfilePicturePreview(null);
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <Label htmlFor="profile-picture" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">Upload Picture</span>
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="username">Name</Label>
              <Input
                id="username"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus={!isEditing}
                disabled={isSubmitting}
              />
            </div>

            {/* Belt and Stripes */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="belt">Current Belt</Label>
                <Select 
                  value={belt} 
                  onValueChange={(value) => setBelt(value as BeltLevel)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="belt">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BeltLevel.white}>White Belt</SelectItem>
                    <SelectItem value={BeltLevel.blue}>Blue Belt</SelectItem>
                    <SelectItem value={BeltLevel.purple}>Purple Belt</SelectItem>
                    <SelectItem value={BeltLevel.brown}>Brown Belt</SelectItem>
                    <SelectItem value={BeltLevel.black}>Black Belt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripes">Stripes</Label>
                <Select 
                  value={stripes.toString()} 
                  onValueChange={(value) => setStripes(parseInt(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="stripes">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Stripes</SelectItem>
                    <SelectItem value="1">1 Stripe</SelectItem>
                    <SelectItem value="2">2 Stripes</SelectItem>
                    <SelectItem value="3">3 Stripes</SelectItem>
                    <SelectItem value="4">4 Stripes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 border">
              <p className="text-sm font-medium mb-2">Belt Preview:</p>
              <img
                src={getBeltImageUrl(belt, stripes)}
                alt={`${belt} belt with ${stripes} stripes`}
                className="h-12 w-full object-contain"
              />
            </div>

            {/* Gym Information */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
              <h3 className="font-semibold text-sm">Gym Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="gym-name">Gym Name</Label>
                <Input
                  id="gym-name"
                  placeholder="e.g., Gracie Barra"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gym-location">Gym Location</Label>
                <Input
                  id="gym-location"
                  placeholder="e.g., Los Angeles, CA"
                  value={gymLocation}
                  onChange={(e) => setGymLocation(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gym-url">Gym Website (optional)</Label>
                <Input
                  id="gym-url"
                  placeholder="e.g., graciebarra.com"
                  value={gymUrl}
                  onChange={(e) => setGymUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                {gymLogoUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={gymLogoUrl}
                      alt="Gym logo"
                      className="h-8 w-8 object-contain"
                      onError={() => setGymLogoUrl(null)}
                    />
                    <span className="text-xs text-muted-foreground">Logo detected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Practitioner Since */}
            <div className="space-y-2">
              <Label>Practitioner Since</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  value={practitionerSinceMonth}
                  onValueChange={setPractitionerSinceMonth}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={practitionerSinceYear}
                  onValueChange={setPractitionerSinceYear}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className={cn(
                  "bg-gradient-to-r from-bjj-blue to-bjj-purple hover:from-bjj-blue/90 hover:to-bjj-purple/90",
                  isEditing ? "flex-1" : "w-full"
                )}
                disabled={isSubmitting || !username.trim() || !actorReady}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Creating Profile...'}
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Complete Setup'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
