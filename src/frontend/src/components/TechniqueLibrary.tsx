import { useState } from 'react';
import { useGetTechniques } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, BookOpen, Search, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddTechniqueDialog from './AddTechniqueDialog';
import { SessionTheme } from '../backend';

const CATEGORY_LABELS: Record<SessionTheme, string> = {
  [SessionTheme.takedowns_standup]: 'Takedowns / Stand-up',
  [SessionTheme.guardSystems]: 'Guard Systems',
  [SessionTheme.guardRetention]: 'Guard Retention',
  [SessionTheme.guardPassing]: 'Guard Passing',
  [SessionTheme.sweeps]: 'Sweeps',
  [SessionTheme.pinsControl]: 'Pins & Control',
  [SessionTheme.backControl]: 'Back Control',
  [SessionTheme.escapes]: 'Escapes',
  [SessionTheme.submissions]: 'Submissions',
  [SessionTheme.legLocks]: 'Leg Locks',
  [SessionTheme.transitionsScrambles]: 'Transitions & Scrambles',
  [SessionTheme.turtleGame]: 'Turtle Game',
  [SessionTheme.openMat]: 'Open Mat',
};

export default function TechniqueLibrary() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: techniques = [], isLoading } = useGetTechniques();

  const filteredTechniques = techniques.filter((technique) => {
    const matchesSearch =
      technique.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      technique.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      technique.typ.toLowerCase().includes(searchQuery.toLowerCase()) ||
      technique.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' ||
      technique.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from techniques
  const categoryCounts: Record<string, number> = {
    all: techniques.length,
  };

  techniques.forEach((t) => {
    if (!categoryCounts[t.category]) {
      categoryCounts[t.category] = 0;
    }
    categoryCounts[t.category]++;
  });

  const availableCategories = Object.keys(SessionTheme).filter(
    (key) => categoryCounts[SessionTheme[key as keyof typeof SessionTheme]] > 0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading technique library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Technique Library</h2>
          <p className="text-muted-foreground">Your personal collection of BJJ techniques</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-bjj-purple to-bjj-brown hover:from-bjj-purple/90 hover:to-bjj-brown/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Technique
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search techniques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="all">All ({categoryCounts.all})</TabsTrigger>
          {availableCategories.slice(0, 5).map((key) => {
            const category = SessionTheme[key as keyof typeof SessionTheme];
            return (
              <TabsTrigger key={category} value={category}>
                {CATEGORY_LABELS[category].split(' ')[0]} ({categoryCounts[category]})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={categoryFilter} className="mt-6">
          {filteredTechniques.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || categoryFilter !== 'all' ? 'No techniques found' : 'No techniques yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start building your technique library'}
                </p>
                {!searchQuery && categoryFilter === 'all' && (
                  <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Technique
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTechniques.map((technique) => (
                <Card key={technique.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{technique.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {CATEGORY_LABELS[technique.category]}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm font-medium">
                      {technique.typ}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {technique.description && (
                      <p className="text-sm text-muted-foreground">{technique.description}</p>
                    )}

                    {technique.link && (
                      <a
                        href={technique.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-bjj-blue hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Resource
                      </a>
                    )}

                    {technique.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {technique.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {technique.linkedSessions.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Used in {technique.linkedSessions.length} session{technique.linkedSessions.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddTechniqueDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
