// redeploy without any code changes
import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type SessionTheme = {
    #takedowns_standup;
    #guardSystems;
    #guardRetention;
    #guardPassing;
    #sweeps;
    #pinsControl;
    #backControl;
    #escapes;
    #submissions;
    #legLocks;
    #transitionsScrambles;
    #turtleGame;
    #openMat;
  };

  type TrainingType = {
    #gi;
    #noGi;
  };

  type Intensity = {
    #recoveryFlow;
    #light;
    #moderate;
    #hard;
    #maxComp;
  };

  type GymInfo = {
    name : Text;
    location : Text;
    logoUrl : ?Text;
  };

  type TrainingSession = {
    id : Text;
    date : Time.Time;
    duration : Nat;
    trainingType : TrainingType;
    sessionTheme : SessionTheme;
    rolls : Nat;
    moodRating : Float;
    beltSnapshot : BeltProgress;
    intensity : Intensity;
  };

  type BeltLevel = {
    #white;
    #blue;
    #purple;
    #brown;
    #black;
  };

  type BeltProgress = {
    belt : BeltLevel;
    stripes : Nat;
    imageUrl : Text;
  };

  type BeltGamifiedStats = {
    progressionPercent : Float;
    experiencePercent : Float;
    submissionProficiencyPercent : Float;
    techniqueMasteryPercent : Float;
    progressionRaw : {
      stripes : Nat;
      hours : Float;
      milestoneBonus : Nat;
    };
    experienceRaw : {
      hours : Float;
    };
    submissionsRaw : {
      uniqueCount : Nat;
      submissions : [SubmissionCount];
    };
    masteryRaw : {
      themeProgress : [(SessionTheme, Float)];
      totalSessions : Nat;
      sessionsPerTheme : [(SessionTheme, Nat)];
    };
  };

  type Technique = {
    id : Text;
    name : Text;
    category : SessionTheme;
    typ : Text;
    description : Text;
    link : Text;
    thumbnail : ?Storage.ExternalBlob;
    tags : [Text];
    linkedSessions : [Text];
  };

  type TrainingGoal = {
    id : Text;
    name : Text;
    description : Text;
    targetRepetitions : Nat;
    completedRepetitions : Nat;
    deadline : ?Time.Time;
    creationDate : Time.Time;
  };

  type TrainingMilestone = {
    id : Text;
    name : Text;
    description : Text;
    achievedDate : Time.Time;
    beltProgress : ?BeltProgress;
  };

  type StreakAchievement = {
    id : Text;
    name : Text;
    description : Text;
    streakLength : Nat;
    startDate : Time.Time;
    endDate : Time.Time;
  };

  type CrossTrainingGoal = {
    id : Text;
    name : Text;
    description : Text;
    targetArea : Text;
    completionDate : ?Time.Time;
    progress : Nat;
  };

  type UserProfile = {
    username : Text;
    beltProgress : BeltProgress;
    profilePicture : ?Storage.ExternalBlob;
    gym : ?GymInfo;
    practitionerSince : ?Time.Time;
    bio : Text;
    nickname : Text;
    trainingGoals : [TrainingGoal];
    trainingMilestones : [TrainingMilestone];
    streakAchievements : [StreakAchievement];
    crossTrainingGoals : [CrossTrainingGoal];
    themePreference : Text;
  };

  type TrainingHourRecord = {
    date : Text;
    hours : Float;
  };

  type ExtendedProfile = {
    username : Text;
    beltProgress : BeltProgress;
    profilePicture : ?Storage.ExternalBlob;
    gym : ?GymInfo;
    practitionerSince : ?Time.Time;
    bio : Text;
    nickname : Text;
    trainingGoals : [TrainingGoal];
    trainingMilestones : [TrainingMilestone];
    streakAchievements : [StreakAchievement];
    crossTrainingGoals : [CrossTrainingGoal];
  };

  type SystemStatus = {
    userProfilesCount : Nat;
    trainingSessionsCount : Nat;
    techniquesCount : Nat;
    customTypesCount : Nat;
    trainingHoursCount : Nat;
    status : Text;
  };

  type BeltCategory = {
    #white;
    #colored : {
      #blue;
      #purple;
      #brown;
      #black;
    };
  };

  type SubmissionCount = {
    name : Text;
    count : Nat;
  };

  type SubmissionLog = {
    whiteBelt : [SubmissionCount];
    blueBelt : [SubmissionCount];
    purpleBelt : [SubmissionCount];
    brownBelt : [SubmissionCount];
    blackBelt : [SubmissionCount];
  };

  type Belt = {
    #white;
    #blue;
    #purple;
    #brown;
    #black;
  };

  var userProfiles = Map.empty<Principal, UserProfile>();
  var trainingSessions = Map.empty<Principal, Map.Map<Text, TrainingSession>>();
  var techniques = Map.empty<Principal, Map.Map<Text, Technique>>();
  var customTechniqueTypes = Map.empty<Principal, Map.Map<Text, Bool>>();
  var analyticsData = Map.empty<Principal, Text>();
  var isProfileCreationDone : Map.Map<Principal, Bool> = Map.empty<Principal, Bool>();
  var trainingHours = Map.empty<Principal, Map.Map<Text, Float>>();
  var submissionLogs = Map.empty<Principal, SubmissionLog>();

  var accessControlState = AccessControl.initState();

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  private func ensureUserRole(caller : Principal) {
    if (caller.isAnonymous()) {
      return;
    };

    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#guest) {
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
      case (_) {};
    };
  };

  public query ({ caller }) func getTrainingRecords() : async [TrainingSession] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return [];
    };
    switch (trainingSessions.get(caller)) {
      case (null) {
        [];
      };
      case (?sessions) {
        sessions.values().toArray();
      };
    };
  };

  public shared ({ caller }) func addTrainingRecord(training : TrainingSession) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add training records");
    };

    let updatedSessions = switch (trainingSessions.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, TrainingSession>();
        newMap.add(training.id, training);
        newMap;
      };
      case (?sessions) {
        sessions.add(training.id, training);
        sessions;
      };
    };
    trainingSessions.add(caller, updatedSessions);
  };

  public shared ({ caller }) func saveTrainingRecords(trainingRecords : [TrainingSession]) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save training records");
    };
    let newSessions = Map.empty<Text, TrainingSession>();
    for (record in trainingRecords.values()) { newSessions.add(record.id, record) };
    trainingSessions.add(caller, newSessions);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { return null };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) { return null };
    userProfiles.get(user);
  };

  public query ({ caller }) func isProfileCreationCompleted() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return false;
    };
    switch (isProfileCreationDone.get(caller)) {
      case (null) { false };
      case (?completed) { completed };
    };
  };

  public shared ({ caller }) func markProfileCreationComplete() : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark profile creation complete");
    };
    isProfileCreationDone.add(caller, true);
  };

  public shared ({ caller }) func register(
    username : Text,
    beltProgress : BeltProgress,
    profilePicture : ?Storage.ExternalBlob,
    gym : ?GymInfo,
    practitionerSince : ?Time.Time,
    bio : Text,
    nickname : Text,
  ) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can register");
    };
    let profile : UserProfile = {
      username;
      beltProgress;
      profilePicture;
      gym;
      practitionerSince;
      bio;
      nickname;
      trainingGoals = [];
      trainingMilestones = [];
      streakAchievements = [];
      crossTrainingGoals = [];
      themePreference = "light";
    };

    userProfiles.add(caller, profile);
    isProfileCreationDone.add(caller, true);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
    isProfileCreationDone.add(caller, true);
  };

  public shared ({ caller }) func markProfileCreationStarted() : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark profile creation started");
    };
    isProfileCreationDone.add(caller, false);
  };

  public shared ({ caller }) func saveExtendedProfile(profile : ExtendedProfile) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let newProfile : UserProfile = {
      username = profile.username;
      beltProgress = profile.beltProgress;
      profilePicture = profile.profilePicture;
      gym = profile.gym;
      practitionerSince = profile.practitionerSince;
      bio = profile.bio;
      nickname = profile.nickname;
      trainingGoals = profile.trainingGoals;
      trainingMilestones = profile.trainingMilestones;
      streakAchievements = profile.streakAchievements;
      crossTrainingGoals = profile.crossTrainingGoals;
      themePreference = "light";
    };
    userProfiles.add(caller, newProfile);
    isProfileCreationDone.add(caller, true);
  };

  public query ({ caller }) func getBeltProgress() : async ?BeltProgress {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { return null };
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.beltProgress };
    };
  };

  public shared ({ caller }) func updateBeltProgress(beltProgress : BeltProgress) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can update belt progress") };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User must be registered to update belt progress.") };
      case (?profile) {
        let newProfile : UserProfile = { profile with beltProgress };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public query ({ caller }) func getAllBeltProgress() : async [BeltProgress] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) { Runtime.trap("Unauthorized: Only admins can view all belt progress") };
    userProfiles.values().toArray().map<UserProfile, BeltProgress>(func(profile) { profile.beltProgress });
  };

  public query ({ caller }) func getTechniques() : async [Technique] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can view techniques") };
    switch (techniques.get(caller)) {
      case (null) { [] };
      case (?techniquesMap) { techniquesMap.values().toArray() };
    };
  };

  public shared ({ caller }) func addTechnique(newTechnique : Technique) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can add techniques") };
    let updatedTechniques = switch (techniques.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Technique>();
        newMap.add(newTechnique.id, newTechnique);
        newMap;
      };
      case (?techniquesMap) {
        techniquesMap.add(newTechnique.id, newTechnique);
        techniquesMap;
      };
    };
    techniques.add(caller, updatedTechniques);
  };

  public query ({ caller }) func getAllTechniques() : async [Technique] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) { Runtime.trap("Unauthorized: Only admins can view all techniques") };
    let allTechniques = techniques.values().toArray();
    var merged : [Technique] = [];
    for (userTechniques in allTechniques.values()) { let userArray = userTechniques.values().toArray(); merged := merged.concat(userArray) };
    merged;
  };

  public shared ({ caller }) func addCustomTechniqueType(typeName : Text) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can add custom technique types") };
    let updatedTypes = switch (customTechniqueTypes.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Bool>();
        newMap.add(typeName, true);
        newMap;
      };
      case (?typesMap) {
        typesMap.add(typeName, true);
        typesMap;
      };
    };
    customTechniqueTypes.add(caller, updatedTypes);
  };

  public query ({ caller }) func getCustomTechniqueTypes() : async [Text] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can view custom technique types") };
    switch (customTechniqueTypes.get(caller)) {
      case (null) { [] };
      case (?typesMap) { typesMap.keys().toArray() };
    };
  };

  public query ({ caller }) func getDashboardData() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can view dashboard data") };
    switch (analyticsData.get(caller)) {
      case (null) { "" };
      case (?dashboardData) { dashboardData };
    };
  };

  public shared ({ caller }) func updateDashboardData(dashboardData : Text) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can update dashboard data") };
    analyticsData.add(caller, dashboardData);
  };

  public query ({ caller }) func getThemePreference() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { return "light" };
    switch (userProfiles.get(caller)) {
      case (null) { "light" };
      case (?profile) { profile.themePreference };
    };
  };

  public shared ({ caller }) func updateThemePreference(theme : Text) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only users can update theme preferences") };
    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User must be registered to update theme preference.") };
      case (?currentProfile) {
        let newProfile : UserProfile = { currentProfile with themePreference = theme };
        userProfiles.add(caller, newProfile);
      };
    };
  };

  public query ({ caller }) func getUserThemePreference(user : Principal) : async Text {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) { return "light" };
    switch (userProfiles.get(user)) {
      case (null) { "light" };
      case (?profile) { profile.themePreference };
    };
  };

  public query ({ caller }) func checkProfileStatus() : async { profile : ?UserProfile; isDone : Bool } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return { profile = null; isDone = false };
    };
    let profile = userProfiles.get(caller);
    let isDone = switch (isProfileCreationDone.get(caller)) {
      case (null) { false };
      case (?done) { done };
    };
    { profile; isDone };
  };

  public query ({ caller }) func startProfileCreation() : async { profile : ?UserProfile; isDone : Bool } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return { profile = null; isDone = false };
    };
    let profile = userProfiles.get(caller);
    let isDone = switch (isProfileCreationDone.get(caller)) {
      case (null) { false };
      case (?done) { done };
    };
    { profile; isDone };
  };

  public query ({ caller }) func getSystemStatus() : async SystemStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) { Runtime.trap("Unauthorized: Only admins can view system status") };

    let profilesCount = userProfiles.size();
    let sessionsCount = trainingSessions.size();
    let techCount = techniques.size();
    let typesCount = customTechniqueTypes.size();
    let hoursCount = trainingHours.size();

    {
      userProfilesCount = profilesCount;
      trainingSessionsCount = sessionsCount;
      techniquesCount = techCount;
      customTypesCount = typesCount;
      trainingHoursCount = hoursCount;
      status = "operational";
    };
  };

  public query ({ caller }) func getUserProfilesCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) { Runtime.trap("Unauthorized: Only admins can view user profiles count") };
    userProfiles.size();
  };

  public shared ({ caller }) func setTrainingHours(date : Text, hours : Float) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set training hours");
    };

    if (hours < 0.0) {
      Runtime.trap("Training hours must be 0 or positive");
    };

    let userHours = switch (trainingHours.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Float>();
        newMap.add(date, hours);
        newMap;
      };
      case (?hoursMap) {
        hoursMap.add(date, hours);
        hoursMap;
      };
    };
    trainingHours.add(caller, userHours);
  };

  public shared ({ caller }) func clearTrainingHours(date : Text) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can clear training hours");
    };

    switch (trainingHours.get(caller)) {
      case (null) { () };
      case (?hoursMap) {
        hoursMap.remove(date);
        if (hoursMap.isEmpty()) {
          trainingHours.remove(caller);
        };
      };
    };
  };

  public query ({ caller }) func getTrainingHours(date : Text) : async Float {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get training hours");
    };

    switch (trainingHours.get(caller)) {
      case (null) { 0.0 };
      case (?hoursMap) {
        switch (hoursMap.get(date)) {
          case (null) { 0.0 };
          case (?hours) { hours };
        };
      };
    };
  };

  public shared ({ caller }) func updateTrainingHours(date : Text, hours : Float) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update training hours");
    };

    if (hours < 0.0) {
      Runtime.trap("Training hours must be 0 or positive");
    };

    switch (trainingHours.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Float>();
        newMap.add(date, hours);
        trainingHours.add(caller, newMap);
      };
      case (?hoursMap) {
        hoursMap.add(date, hours);
      };
    };
  };

  public query ({ caller }) func getTrainingHoursRange(startDate : Text, endDate : Text) : async [TrainingHourRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get training hours range");
    };

    let userHours = switch (trainingHours.get(caller)) {
      case (null) { return [] };
      case (?hoursMap) { hoursMap };
    };

    let results = userHours.toArray().map<(?Text, Float), TrainingHourRecord>(
      func((date, hours)) {
        {
          date = switch (date) { case (null) { "" }; case (?text) { text } };
          hours;
        };
      }
    );

    let filtered = results.filter(
      func(record) {
        record.date >= startDate and record.date <= endDate;
      }
    );

    filtered;
  };

  public query ({ caller }) func getAllTrainingHours() : async [TrainingHourRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get all training hours");
    };

    switch (trainingHours.get(caller)) {
      case (null) { return [] };
      case (?hoursMap) {
        let results = hoursMap.toArray().map<(?Text, Float), TrainingHourRecord>(
          func((date, hours)) {
            {
              date = switch (date) { case (null) { "" }; case (?text) { text } };
              hours;
            };
          }
        );
        results;
      };
    };
  };

  public shared ({ caller }) func batchSetTrainingHours(records : [TrainingHourRecord]) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can batch set training hours");
    };

    let isValid = records.foldLeft(
      true,
      func(acc, record) {
        acc and record.hours >= 0.0;
      },
    );

    if (not isValid) {
      Runtime.trap("All training hours must be positive");
    };

    let userHours = switch (trainingHours.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Float>();
        for (record in records.values()) {
          newMap.add(record.date, record.hours);
        };
        newMap;
      };
      case (?hoursMap) {
        for (record in records.values()) {
          hoursMap.add(record.date, record.hours);
        };
        hoursMap;
      };
    };
    trainingHours.add(caller, userHours);
  };

  public query ({ caller }) func getTrainingHoursForAllUsers() : async [TrainingHourRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can get all training hours");
    };

    var allRecords : [TrainingHourRecord] = [];

    for ((user, userHours) in trainingHours.entries()) {
      let userRecords = userHours.toArray().map<(?Text, Float), TrainingHourRecord>(
        func((date, hours)) {
          {
            date = switch (date) { case (null) { "" }; case (?text) { text } };
            hours;
          };
        }
      );
      allRecords := allRecords.concat(userRecords);
    };

    allRecords;
  };

  public shared ({ caller }) func batchUpdateTrainingHours(records : [TrainingHourRecord]) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can batch update training hours");
    };

    let isValid = records.foldLeft(
      true,
      func(acc, record) {
        acc and record.hours >= 0.0;
      },
    );

    if (not isValid) {
      Runtime.trap("All training hours must be positive");
    };

    let userHours = switch (trainingHours.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Float>();
        for (record in records.values()) {
          newMap.add(record.date, record.hours);
        };
        newMap;
      };
      case (?hoursMap) {
        for (record in records.values()) {
          hoursMap.add(record.date, record.hours);
        };
        hoursMap;
      };
    };
    trainingHours.add(caller, userHours);
  };

  public shared ({ caller }) func deleteTrainingHours(date : Text) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete training hours");
    };

    switch (trainingHours.get(caller)) {
      case (null) { Runtime.trap("No training hours found for user") };
      case (?hoursMap) {
        hoursMap.remove(date);
      };
    };
  };

  public shared ({ caller }) func clearAllTrainingHours() : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can clear all training hours");
    };

    trainingHours.remove(caller);
  };

  public query ({ caller }) func getTrainingHoursCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get training hours count");
    };

    switch (trainingHours.get(caller)) {
      case (null) { 0 };
      case (?hoursMap) { hoursMap.size() };
    };
  };

  public query ({ caller }) func getUserTrainingHoursCount(user : Principal) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller) and not (caller == user)) {
      Runtime.trap("Unauthorized: Only admins or the user can get training hours count");
    };

    switch (trainingHours.get(user)) {
      case (null) { 0 };
      case (?hoursMap) { hoursMap.size() };
    };
  };

  public shared ({ caller }) func addTrainingHours(date : Text, hours : Float) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add training hours");
    };

    if (hours < 0.0) {
      Runtime.trap("Training hours must be 0 or positive");
    };

    let currentHours = switch (trainingHours.get(caller)) {
      case (null) { 0.0 };
      case (?hoursMap) {
        switch (hoursMap.get(date)) {
          case (null) { 0.0 };
          case (?hrs) { hrs };
        };
      };
    };

    let newHours = currentHours + hours;

    switch (trainingHours.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Float>();
        newMap.add(date, newHours);
        trainingHours.add(caller, newMap);
      };
      case (?hoursMap) {
        hoursMap.add(date, newHours);
      };
    };
  };

  public query ({ caller }) func getAllUsersTrainingHours() : async [(Principal, [TrainingHourRecord])] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can get all users' training hours");
    };

    var allEntries : [(Principal, [TrainingHourRecord])] = [];

    for ((principal, userHoursMap) in trainingHours.entries()) {
      let userRecords = userHoursMap.toArray().map<(?Text, Float), TrainingHourRecord>(
        func((date, hours)) {
          {
            date = switch (date) { case (null) { "" }; case (?text) { text } };
            hours;
          };
        }
      );
      allEntries := allEntries.concat([(principal, userRecords)]);
    };

    allEntries;
  };

  public query ({ caller }) func getSubmissionLog() : async SubmissionLog {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access their submission log");
    };

    switch (submissionLogs.get(caller)) {
      case (null) {
        {
          whiteBelt = [];
          blueBelt = [];
          purpleBelt = [];
          brownBelt = [];
          blackBelt = [];
        };
      };
      case (?log) { log };
    };
  };

  public shared ({ caller }) func saveSubmissionLog(newLog : SubmissionLog) : async () {
    ensureUserRole(caller);
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update their submission log");
    };

    func ensureUnique(submissions : [SubmissionCount]) : [SubmissionCount] {
      let uniqueMap = Map.empty<Text, SubmissionCount>();

      for (submission in submissions.values()) {
        let lowerName = submission.name.toLower();
        switch (uniqueMap.get(lowerName)) {
          case (null) {
            uniqueMap.add(lowerName, submission);
          };
          case (?existing) {
            let updatedCount = { submission with count = existing.count + submission.count };
            uniqueMap.add(lowerName, updatedCount);
          };
        };
      };
      uniqueMap.values().toArray();
    };

    let logWithUniqueCounts = {
      newLog with
      whiteBelt = ensureUnique(newLog.whiteBelt);
      blueBelt = ensureUnique(newLog.blueBelt);
      purpleBelt = ensureUnique(newLog.purpleBelt);
      brownBelt = ensureUnique(newLog.brownBelt);
      blackBelt = ensureUnique(newLog.blackBelt);
    };

    submissionLogs.add(caller, logWithUniqueCounts);
  };

  public query ({ caller }) func hasBeltSubmission(belt : Belt, submissionName : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check their submission log");
    };

    func matchesName(existingName : Text, newName : Text) : Bool {
      Text.equal(existingName.trim(#char(' ')), newName.trim(#char(' ')));
    };

    let userLog = switch (submissionLogs.get(caller)) {
      case (null) {
        {
          whiteBelt = [];
          blueBelt = [];
          purpleBelt = [];
          brownBelt = [];
          blackBelt = [];
        };
      };
      case (?log) { log };
    };

    switch (belt) {
      case (#white) { userLog.whiteBelt.any(func(entry) { matchesName(entry.name.toLower(), submissionName.toLower()) }) };
      case (#blue) { userLog.blueBelt.any(func(entry) { matchesName(entry.name.toLower(), submissionName.toLower()) }) };
      case (#purple) { userLog.purpleBelt.any(func(entry) { matchesName(entry.name.toLower(), submissionName.toLower()) }) };
      case (#brown) { userLog.brownBelt.any(func(entry) { matchesName(entry.name.toLower(), submissionName.toLower()) }) };
      case (#black) { userLog.blackBelt.any(func(entry) { matchesName(entry.name.toLower(), submissionName.toLower()) }) };
    };
  };

  public query ({ caller }) func getSubmissionCountsByBelt(belt : Text) : async [SubmissionCount] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view submission counts by belt");
    };

    switch (submissionLogs.get(caller)) {
      case (null) {
        [];
      };
      case (?log) {
        switch (belt) {
          case ("white") { log.whiteBelt };
          case ("blue") { log.blueBelt };
          case ("purple") { log.purpleBelt };
          case ("brown") { log.brownBelt };
          case ("black") { log.blackBelt };
          case (_) { [] };
        };
      };
    };
  };
};

