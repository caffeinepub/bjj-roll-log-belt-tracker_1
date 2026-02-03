/**
 * Comprehensive list of BJJ submission techniques
 * Used as the single source of options for all belt submission dropdowns
 */
export const SUBMISSION_OPTIONS = [
  // Chokes
  'Rear Naked Choke',
  'Triangle Choke',
  'Guillotine',
  'Bow and Arrow Choke',
  'Sleeve Choke (Ezekiel)',
  'Cross Collar Choke',
  'Short Choke',
  'Baseball Choke',
  "D'Arce Choke",
  'Clock Choke',
  'Head and Arm Choke',
  'North-South Choke',
  'Crucifix Choke',
  'Thrust Choke',
  'Anaconda Choke',
  'Loop Choke',
  'Papercutter Choke',
  'Peruvian Necktie',
  'Brabo Choke',
  'Arm Triangle',
  'Japanese Necktie',
  
  // Armlocks
  'Straight Armbar',
  'Americana',
  'Kimura',
  'Omoplata',
  'Inverse Armbar',
  'Baratoplata',
  'Marceloplata',
  'Biceps Slicer',
  
  // Leglocks
  'Straight Ankle Lock',
  'Kneebar',
  'Heel Hook',
  'Reverse Heel Hook',
  'Toehold',
  'Calf Crusher',
  'Banana Split',
  'Electric Chair',
  
  // Wrist & Shoulder
  'Wristlock',
  'Gogoplata',
  
  // Neck Cranks (use with caution)
  'Neck Crank',
  'Can Opener',
  'Twister',
] as const;

export type SubmissionOption = typeof SUBMISSION_OPTIONS[number];
