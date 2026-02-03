import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface GymInfo {
    name: string;
    logoUrl?: string;
    location: string;
}
export type Time = bigint;
export interface BeltProgress {
    belt: BeltLevel;
    imageUrl: string;
    stripes: bigint;
}
export interface CrossTrainingGoal {
    id: string;
    completionDate?: Time;
    name: string;
    description: string;
    progress: bigint;
    targetArea: string;
}
export interface Technique {
    id: string;
    typ: string;
    thumbnail?: ExternalBlob;
    link: string;
    name: string;
    tags: Array<string>;
    description: string;
    linkedSessions: Array<string>;
    category: SessionTheme;
}
export interface TrainingHourRecord {
    hours: number;
    date: string;
}
export interface ExtendedProfile {
    bio: string;
    gym?: GymInfo;
    beltProgress: BeltProgress;
    nickname: string;
    username: string;
    streakAchievements: Array<StreakAchievement>;
    crossTrainingGoals: Array<CrossTrainingGoal>;
    trainingMilestones: Array<TrainingMilestone>;
    practitionerSince?: Time;
    profilePicture?: ExternalBlob;
    trainingGoals: Array<TrainingGoal>;
}
export interface SubmissionLog {
    blackBelt: Array<SubmissionCount>;
    brownBelt: Array<SubmissionCount>;
    blueBelt: Array<SubmissionCount>;
    purpleBelt: Array<SubmissionCount>;
}
export interface TrainingSession {
    id: string;
    duration: bigint;
    date: Time;
    moodRating: number;
    sessionTheme: SessionTheme;
    trainingType: TrainingType;
    rolls: bigint;
}
export interface TrainingMilestone {
    id: string;
    beltProgress?: BeltProgress;
    achievedDate: Time;
    name: string;
    description: string;
}
export interface StreakAchievement {
    id: string;
    endDate: Time;
    name: string;
    description: string;
    streakLength: bigint;
    startDate: Time;
}
export interface TrainingGoal {
    id: string;
    completedRepetitions: bigint;
    name: string;
    description: string;
    deadline?: Time;
    creationDate: Time;
    targetRepetitions: bigint;
}
export interface SubmissionCount {
    name: string;
    count: bigint;
}
export interface UserProfile {
    bio: string;
    gym?: GymInfo;
    beltProgress: BeltProgress;
    nickname: string;
    username: string;
    streakAchievements: Array<StreakAchievement>;
    crossTrainingGoals: Array<CrossTrainingGoal>;
    themePreference: string;
    trainingMilestones: Array<TrainingMilestone>;
    practitionerSince?: Time;
    profilePicture?: ExternalBlob;
    trainingGoals: Array<TrainingGoal>;
}
export interface SystemStatus {
    status: string;
    userProfilesCount: bigint;
    customTypesCount: bigint;
    trainingHoursCount: bigint;
    trainingSessionsCount: bigint;
    techniquesCount: bigint;
}
export enum Belt {
    blue = "blue",
    purple = "purple",
    black = "black",
    brown = "brown"
}
export enum BeltLevel {
    blue = "blue",
    purple = "purple",
    black = "black",
    brown = "brown",
    white = "white"
}
export enum SessionTheme {
    openMat = "openMat",
    takedowns_standup = "takedowns_standup",
    turtleGame = "turtleGame",
    transitionsScrambles = "transitionsScrambles",
    submissions = "submissions",
    pinsControl = "pinsControl",
    backControl = "backControl",
    guardRetention = "guardRetention",
    escapes = "escapes",
    sweeps = "sweeps",
    legLocks = "legLocks",
    guardPassing = "guardPassing",
    guardSystems = "guardSystems"
}
export enum TrainingType {
    gi = "gi",
    noGi = "noGi"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomTechniqueType(typeName: string): Promise<void>;
    addTechnique(newTechnique: Technique): Promise<void>;
    addTrainingHours(date: string, hours: number): Promise<void>;
    addTrainingRecord(training: TrainingSession): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    batchSetTrainingHours(records: Array<TrainingHourRecord>): Promise<void>;
    batchUpdateTrainingHours(records: Array<TrainingHourRecord>): Promise<void>;
    checkProfileStatus(): Promise<{
        isDone: boolean;
        profile?: UserProfile;
    }>;
    clearAllTrainingHours(): Promise<void>;
    clearTrainingHours(date: string): Promise<void>;
    deleteTrainingHours(date: string): Promise<void>;
    getAllBeltProgress(): Promise<Array<BeltProgress>>;
    getAllTechniques(): Promise<Array<Technique>>;
    getAllTrainingHours(): Promise<Array<TrainingHourRecord>>;
    getAllUsersTrainingHours(): Promise<Array<[Principal, Array<TrainingHourRecord>]>>;
    getBeltProgress(): Promise<BeltProgress | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomTechniqueTypes(): Promise<Array<string>>;
    getDashboardData(): Promise<string>;
    getSubmissionCountsByBelt(belt: string): Promise<Array<SubmissionCount>>;
    getSubmissionLog(): Promise<SubmissionLog>;
    getSystemStatus(): Promise<SystemStatus>;
    getTechniques(): Promise<Array<Technique>>;
    getThemePreference(): Promise<string>;
    getTrainingHours(date: string): Promise<number>;
    getTrainingHoursCount(): Promise<bigint>;
    getTrainingHoursForAllUsers(): Promise<Array<TrainingHourRecord>>;
    getTrainingHoursRange(startDate: string, endDate: string): Promise<Array<TrainingHourRecord>>;
    getTrainingRecords(): Promise<Array<TrainingSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfilesCount(): Promise<bigint>;
    getUserThemePreference(user: Principal): Promise<string>;
    getUserTrainingHoursCount(user: Principal): Promise<bigint>;
    hasBeltSubmission(belt: Belt, submissionName: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isProfileCreationCompleted(): Promise<boolean>;
    markProfileCreationComplete(): Promise<void>;
    markProfileCreationStarted(): Promise<void>;
    register(username: string, beltProgress: BeltProgress, profilePicture: ExternalBlob | null, gym: GymInfo | null, practitionerSince: Time | null, bio: string, nickname: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveExtendedProfile(profile: ExtendedProfile): Promise<void>;
    saveSubmissionLog(newLog: SubmissionLog): Promise<void>;
    saveTrainingRecords(trainingRecords: Array<TrainingSession>): Promise<void>;
    setTrainingHours(date: string, hours: number): Promise<void>;
    startProfileCreation(): Promise<{
        isDone: boolean;
        profile?: UserProfile;
    }>;
    updateBeltProgress(beltProgress: BeltProgress): Promise<void>;
    updateDashboardData(dashboardData: string): Promise<void>;
    updateThemePreference(theme: string): Promise<void>;
    updateTrainingHours(date: string, hours: number): Promise<void>;
}
