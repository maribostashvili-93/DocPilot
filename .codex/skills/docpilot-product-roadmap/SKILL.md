---
name: docpilot-product-roadmap
description: Plan DocPilot product evolution, phase work, and prioritize missing capabilities. Use when the user asks what DocPilot is missing, what to build next, how to phase work, how to separate Foundation vs Collaboration vs Publishing vs Reader/Search/Integrations work, or when roadmap/planning context should be reused consistently.
---

# DocPilot Product Roadmap

## Overview

Use this skill to turn scattered product ideas into a phased DocPilot roadmap with concrete priorities and implementation sequencing. Prefer pragmatic planning tied to the current codebase state: lightweight backend, multi-tenant CMS, content editor, translations, publishing, and media library already exist.

## Workflow

When using this skill:

1. Identify the user's request type:
- `positioning`: what DocPilot is, who it is for, what problem it solves
- `gap analysis`: what is missing and why
- `roadmap`: what to do now, next, later
- `phase planning`: what belongs in Foundation, Collaboration, Publishing, Reader, Search, Integrations, AI

2. Anchor the answer to the current DocPilot product spine:
- `Product -> Document -> Section -> Review -> Translate -> Release -> Publish`
- Call out when the current system behaves like separate pages instead of one workflow.

3. Prioritize in this order unless the user explicitly redirects:
- Foundation
- Collaboration
- Publishing
- Public Reader
- Search
- Localization Ops
- Integrations
- Analytics
- AI

4. If the user wants a plan, return:
- what to do now
- what to postpone
- phase breakdown
- expected output of each phase

## Core Phases

### 1. Foundation

Use for persistence, backend structure, permissions, workflow spine, readiness logic, and activity/audit.

Expected outputs:
- entity map
- DB schema draft
- permission matrix
- workflow matrix
- migration sequence

### 2. Collaboration

Use for comments, reviewer workflow, assignments, approvals, notifications, and activity history.

Expected outputs:
- section feedback model
- review request model
- sidebar/task UX
- approval rules

### 3. Publishing

Use for release governance, stage vs production, publish gates, rollback, and checklists.

Expected outputs:
- release state machine
- blocking rules
- checklist UI plan
- rollback metadata plan

### 4. Reader and Discovery

Use for public docs experience, search, version/language switching, and reader feedback.

Expected outputs:
- delivery architecture
- docs reader scope
- search scope
- analytics starter metrics

### 5. Growth

Use for integrations, asset governance, analytics maturity, and AI.

Expected outputs:
- integration sequence
- API/webhook scope
- AI MVP options
- advanced governance features

## Response Rules

- Keep recommendations in order of dependency, not novelty.
- Do not recommend AI, analytics, or heavy integrations before the backend/workflow spine is stable.
- Say explicitly when a feature is `now`, `next`, or `later`.
- If the user asks "what should I do", default to:
  1. Foundation
  2. Collaboration
  3. Publishing
- If the user asks about "what DocPilot is", frame it as docs operations software, not a generic file archive.
- Tie every recommendation back to the current product spine and current modules already present in the codebase.

## Deliverable Templates

Use these compact templates when useful:

### Short Plan
- `Now`: current phase tasks
- `Next`: follow-on phase tasks
- `Later`: deferred work

### Gap Analysis
- `Missing`
- `Why it matters`
- `How to add it`
- `When to do it`

### Phase Breakdown
- `Phase`
- `Goal`
- `What it includes`
- `Dependencies`
- `What we do now`
- `What we postpone`
