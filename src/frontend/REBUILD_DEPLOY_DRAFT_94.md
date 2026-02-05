# Draft 94 Rebuild/Redeploy Checklist

**Date:** February 3, 2026  
**Version:** Draft 94  
**Type:** Rebuild and redeploy (no functional/UI/code changes)

## Purpose
This document tracks the rebuild and redeployment of Draft Version 94 from the current repository state without introducing any functional changes, UI modifications, or schema/state migrations.

## Pre-Rebuild State
- Draft 94 successfully deployed with all features operational
- Belt and submission dropdowns positioned side by side as requested
- Submission list loaded from static asset file (`/assets/submissions-list.txt`)
- All initialization flows (Internet Identity → Actor → Profile) working correctly

---

## Clean Rebuild & Redeploy (Current Repo State)

This section documents the exact commands and steps for a clean rebuild and redeploy of the current repository state.

### Prerequisites
- Current repository state matches Draft 94
- No pending code changes or modifications
- DFX and Node.js installed and configured

### Backend Deploy Steps
