import { SessionTheme } from '../backend';

export function formatSessionTheme(theme: SessionTheme): string {
  const themeLabels: Record<string, string> = {
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

  return themeLabels[theme as string] || theme;
}
