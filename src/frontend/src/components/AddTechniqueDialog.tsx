import { useState, useEffect } from 'react';
import { useAddTechnique, useGetCustomTechniqueTypes, useAddCustomTechniqueType } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Technique, SessionTheme } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AddTechniqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: SessionTheme.takedowns_standup, label: 'Takedowns / Stand-up' },
  { value: SessionTheme.guardSystems, label: 'Guard Systems' },
  { value: SessionTheme.guardRetention, label: 'Guard Retention' },
  { value: SessionTheme.guardPassing, label: 'Guard Passing' },
  { value: SessionTheme.sweeps, label: 'Sweeps' },
  { value: SessionTheme.pinsControl, label: 'Pins & Control' },
  { value: SessionTheme.backControl, label: 'Back Control' },
  { value: SessionTheme.escapes, label: 'Escapes' },
  { value: SessionTheme.submissions, label: 'Submissions' },
  { value: SessionTheme.legLocks, label: 'Leg Locks' },
  { value: SessionTheme.transitionsScrambles, label: 'Transitions & Scrambles' },
  { value: SessionTheme.turtleGame, label: 'Turtle Game' },
  { value: SessionTheme.openMat, label: 'Open Mat' },
];

export default function AddTechniqueDialog({ open, onOpenChange }: AddTechniqueDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SessionTheme>(SessionTheme.submissions);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [typeSearchOpen, setTypeSearchOpen] = useState(false);
  const [typeSearchValue, setTypeSearchValue] = useState('');
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);

  const addMutation = useAddTechnique();
  const { data: customTypes = [] } = useGetCustomTechniqueTypes();
  const addCustomTypeMutation = useAddCustomTechniqueType();

  const resetForm = () => {
    setName('');
    setCategory(SessionTheme.submissions);
    setType('');
    setDescription('');
    setLink('');
    setThumbnail(null);
    setTagInput('');
    setTags([]);
    setTypeSearchValue('');
  };

  // Generate thumbnail when link changes
  useEffect(() => {
    if (!link.trim()) {
      setThumbnail(null);
      return;
    }

    const generateThumbnail = async () => {
      setIsLoadingThumbnail(true);
      try {
        // Check if it's a YouTube link
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = link.match(youtubeRegex);
        
        if (match && match[1]) {
          // YouTube video - use thumbnail
          const videoId = match[1];
          setThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        } else {
          // For other links, use a generic link icon placeholder
          setThumbnail(null);
        }
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        setThumbnail(null);
      } finally {
        setIsLoadingThumbnail(false);
      }
    };

    const timeoutId = setTimeout(generateThumbnail, 500);
    return () => clearTimeout(timeoutId);
  }, [link]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSelectType = (selectedType: string) => {
    setType(selectedType);
    setTypeSearchOpen(false);
    setTypeSearchValue('');
  };

  const handleCreateType = async () => {
    const newType = typeSearchValue.trim();
    if (!newType || customTypes.includes(newType)) return;

    try {
      await addCustomTypeMutation.mutateAsync(newType);
      setType(newType);
      setTypeSearchOpen(false);
      setTypeSearchValue('');
    } catch (error) {
      console.error('Failed to create custom type:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !type.trim()) {
      return;
    }

    const technique: Technique = {
      id: `technique-${Date.now()}`,
      name: name.trim(),
      category,
      typ: type.trim(),
      description: description.trim(),
      link: link.trim(),
      thumbnail: undefined,
      tags,
      linkedSessions: [],
    };

    addMutation.mutate(technique, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const filteredTypes = customTypes.filter((t) =>
    t.toLowerCase().includes(typeSearchValue.toLowerCase())
  );

  const showCreateOption = typeSearchValue.trim() && !customTypes.includes(typeSearchValue.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Technique</DialogTitle>
          <DialogDescription>Add a new technique to your personal library</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Technique Name</Label>
            <Input
              id="name"
              placeholder="e.g., Kimura from Closed Guard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as SessionTheme)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Popover open={typeSearchOpen} onOpenChange={setTypeSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="type"
                  variant="outline"
                  role="combobox"
                  aria-expanded={typeSearchOpen}
                  className="w-full justify-between"
                >
                  {type || 'Select or create type...'}
                  <X
                    className={cn('ml-2 h-4 w-4 shrink-0 opacity-50', !type && 'hidden')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setType('');
                    }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search or create type..."
                    value={typeSearchValue}
                    onValueChange={setTypeSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {showCreateOption ? (
                        <div className="p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={handleCreateType}
                            disabled={addCustomTypeMutation.isPending}
                          >
                            {addCustomTypeMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>Create "{typeSearchValue}"</>
                            )}
                          </Button>
                        </div>
                      ) : (
                        'No types found.'
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredTypes.map((t) => (
                        <CommandItem key={t} value={t} onSelect={() => handleSelectType(t)}>
                          {t}
                        </CommandItem>
                      ))}
                      {showCreateOption && filteredTypes.length > 0 && (
                        <CommandItem
                          value={typeSearchValue}
                          onSelect={handleCreateType}
                          className="border-t"
                        >
                          {addCustomTypeMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>Create "{typeSearchValue}"</>
                          )}
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (Video or Web)</Label>
            <div className="space-y-2">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="link"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isLoadingThumbnail && (
                <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoadingThumbnail && thumbnail && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={thumbnail}
                    alt="Link preview"
                    className="w-full h-32 object-cover"
                    onError={() => setThumbnail(null)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                    <p className="text-xs text-white truncate">{link}</p>
                  </div>
                </div>
              )}
              {!isLoadingThumbnail && link && !thumbnail && (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground truncate flex-1">{link}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the technique, key details, and tips..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags (e.g., beginner, gi, no-gi)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || !name.trim() || !type.trim()}
              className="bg-gradient-to-r from-bjj-purple to-bjj-brown hover:from-bjj-purple/90 hover:to-bjj-brown/90"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Technique'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
