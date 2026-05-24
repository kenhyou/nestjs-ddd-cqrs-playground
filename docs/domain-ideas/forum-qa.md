---
name: Forum / Q&A
slug: forum-qa
core-aggregates: [Question, Answer, Vote, Comment, Reputation]
learning-focus: Business policies such as no self-vote and moderation
---

# Forum / Q&A

## Overview

A question-and-answer system like Stack Overflow or a community forum. Users post Questions, other users post Answers, and participants vote up or down. The core learning point is implementing precise business policy, such as no voting on your own content, only the question author can accept an answer, and reputation-based permissions. Higher tiers add Reputation, Moderation, and Badge policy engines.

DDD learning value: Specification pattern for policy encapsulation, Domain Service for cross-aggregate policy checks, and modeling permissions as domain rules.

## Universal Actors

- **Primary**: Member who asks questions, answers, and votes.
- **Secondary**: Moderator who handles reports and hides content.

## Universal Domain Events

- QuestionPosted
- QuestionEdited
- QuestionClosed
- AnswerPosted
- AnswerEdited
- AnswerAccepted
- AnswerUnaccepted
- VoteCast
- VoteRescinded
- CommentPosted
- ContentReported
- ContentHidden
- ReputationGained
- ReputationLost
- BadgeAwarded
- UserSuspended

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, state transition, policy methods.

**Scope**: One Question Aggregate Root. Post, edit, and close questions. No Answer or Vote.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: N/A

2. **Domain Events (5)**:
   - QuestionPosted
   - QuestionEdited
   - QuestionClosed
   - QuestionReopened
   - QuestionDeleted

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Answer until intermediate tier
   - Vote
   - Reputation
   - Moderation
   - Authentication/user management; author ID is just an identifier.

### Suggested BC Candidate

- **Single BC**: `Question` -- question lifecycle.

### Key Learning Goals

- VO: `QuestionId`, `Title` with min/max length, `Content` with min length, and `Tags` with a maximum count.
- Aggregate Root OPEN/CLOSED state transition.
- Author permission check: `editBy(userId)` allows only the author and throws a domain exception otherwise.
- Single-Aggregate CQRS.

---

## Tier: Intermediate

**Target learning pattern**: 3 Aggregates, policy methods, cross-aggregate validation.

**Scope**: Question, Answer, and Vote Aggregates across 1-2 BCs. Add answers, voting, and answer acceptance. Validate policies such as no self-vote.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: N/A

2. **Domain Events (8-10)**:
   - QuestionPosted
   - QuestionEdited
   - QuestionClosed
   - AnswerPosted
   - AnswerEdited
   - AnswerAccepted
   - AnswerUnaccepted
   - VoteCast
   - VoteRescinded
   - SelfVoteRejected

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Reputation and badges
   - Moderation reports and hiding
   - Comment
   - Authentication
   - Notifications

### Suggested BC Candidates

- **BC-1: Q&A** (Core) -- Question and Answer Aggregates.
- **BC-2: Voting** (Supporting) -- Vote Aggregate and vote policy validation.

### Key Learning Goals

- Domain Service: `VotePolicy` for cross-aggregate author policy.
- Specification pattern: `CanVoteSpec`, `CanAcceptAnswerSpec`.
- Aggregate references by ID only, such as Vote -> Answer ID.
- Policy method: `Question.acceptAnswer(answerId, userId)` allowed only for the question author.
- Domain exceptions such as `SelfVoteException` and `UnauthorizedAcceptException`.

---

## Tier: Advanced

**Target learning pattern**: 4+ BCs, policy engine, accumulated Reputation events, Moderation BC.

**Scope**: Separate Q&A, Voting, Reputation, Moderation, and Privilege BCs. Apply reputation-based permissions, moderation workflow for reports/hiding, and badges.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Moderator, often based on reputation threshold
   - Tertiary: System for automatic badges and moderation rules

2. **Domain Events (12-14)**:
   - QuestionPosted / QuestionClosed
   - AnswerPosted / AnswerAccepted
   - VoteCast / VoteRescinded
   - ReputationGained
   - ReputationLost
   - BadgeAwarded
   - ContentReported
   - ContentHidden
   - ContentRestored
   - UserSuspended
   - PrivilegeEarned

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Real notification delivery; publish events only.
   - Authentication; assume User ID comes from an external system.
   - UI/UX
   - Analytics

### Suggested BC Candidates

- **BC-1: Q&A** (Core) -- Question, Answer, and Comment.
- **BC-2: Voting** (Supporting) -- voting policy.
- **BC-3: Reputation** (Core) -- consumes domain events, accumulates score, and awards badges.
- **BC-4: Moderation** (Supporting) -- report queue and moderation workflow: REPORTED -> REVIEWED -> HIDDEN/DISMISSED.
- **BC-5: Privilege** (Supporting) -- reputation-based permission policy engine.

### Key Learning Goals

- Domain Event publish/subscribe; Reputation subscribes to events from other BCs.
- Eventual Consistency: VoteCast -> ReputationGained asynchronously.
- Policy engine: PrivilegeRule, such as vote permission at reputation >= 15 and moderation permission at reputation >= 2000.
- Heavy use of Specification pattern.
- Same-word-different-meaning: User as author in Q&A, score subject in Reputation, and report target in Moderation.
- Saga-style moderation workflow: report -> review -> action.
