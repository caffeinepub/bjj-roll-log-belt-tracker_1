import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BookOpen, User } from 'lucide-react';
import TrainingLog from '../components/TrainingLog';
import BeltTracker from '../components/BeltTracker';
import TechniqueLibrary from '../components/TechniqueLibrary';
import ProfileAnalytics from '../components/ProfileAnalytics';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile-analytics');

  return (
    <div className="container py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile-analytics" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Training Log</span>
          </TabsTrigger>
          <TabsTrigger value="belt" className="gap-2">
            <span className="text-lg">🥋</span>
            <span className="hidden sm:inline">Belt Tracker</span>
          </TabsTrigger>
          <TabsTrigger value="techniques" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Techniques</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile-analytics" className="space-y-4">
          <ProfileAnalytics />
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          <TrainingLog />
        </TabsContent>

        <TabsContent value="belt" className="space-y-4">
          <BeltTracker />
        </TabsContent>

        <TabsContent value="techniques" className="space-y-4">
          <TechniqueLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
