# Secondary Clarification Report - Session 2

**Date**: 2025-10-16  
**Session Type**: Post-Tasks Validation Clarification  
**Branch**: `002-eject-and-customize`  
**Trigger**: Detailed task breakdown (tasks.md) completed. Scan for emerging ambiguities before implementation begins.

---

## Executive Summary

✅ **Result**: Specification remains solid. No contradictions between spec and 60-task breakdown.

🎯 **Clarifications Needed**: 2 detail-level decisions (not scope ambiguities)

📋 **Questions Asked**: 2 | **Answered**: 2 | **Resolution Rate**: 100%

⏱️ **Impact**: Both answers integrate cleanly into existing design. No rework required.

---

## Clarification Questions & Answers

### Q1: Interdependency Strategy for Feature Removal

**Context**:  
User Story 2 (Interactive Feature Selection) requires handling features with dependencies (e.g., "Better Auth requires Database"). Spec provided two acceptable strategies but didn't pick one.

**Problem**:  
Task T031 ("Build feature validation and dependency logic") needs a specific implementation strategy. Choosing wrong strategy now causes architecture rework later.

**Options Presented**:
- **Option A**: Auto-deselect with warning
- **Option B**: Prevent deselection (guided removal)

**User's Answer**: **Option B - Prevent Deselection**

**Rationale Provided**:
- More predictable user experience
- Forces explicit choices
- Reduces accidental broken states

**Impact**:
- Task T031: Implement validation that prevents deselection, shows error message directing user to remove dependents first
- Task T020: Update interactive prompts to show dependency chains
- Acceptance scenario US2-AS5: Updated to reflect prevent-deselection strategy

**Integration**: ✅ Integrated into spec.md (Clarifications Session 2, Assumption 12)

---

### Q2: Structured Error Message Format

**Context**:  
FR-014 requires structured error messages with: (1) what failed, (2) why, (3) auto-suggested recovery. Spec didn't specify the actual format users would see.

**Problem**:  
Task T023 ("Implement error handling template") and recovery.ts (T015) need to know exact format. Inconsistent format leads to poor UX.

**Options Presented**:
- **Option A**: JSON-style structured output
- **Option B**: Human-friendly prose with metadata
- **Option C**: Hybrid (both formats)

**User's Answer**: **Option C - Hybrid Format**

**Rationale Provided**:
- Best UX for end users (human-friendly in terminal)
- Machine-readable backup for debugging (JSON in `.logs/`)
- Supports operational transparency

**Impact**:
- Task T023: Implement dual output (prose to stdout, JSON to `.logs/errors.json`)
- Task T015 (recovery.ts): Also uses JSON format for machine parsing of past errors
- FR-014: Updated to specify both formats
- Logging infrastructure required in Phase 2 Foundational tasks

**Integration**: ✅ Integrated into spec.md (Clarifications Session 2, Assumption 13)

---

## Non-Blocking Findings

These emerged during analysis but don't require clarification (can resolve during implementation):

| Category | Finding | Resolution |
|----------|---------|-----------|
| **Performance Definition** | "Average-sized project" (SC-001) undefined | Define during QA phase (~100-500 files suggested) |
| **Documentation Scope** | Which files auto-update unclear | Follow convention: README + major docs only, not exhaustive |
| **Data Format Examples** | No example manifests in spec | Tasks reference contracts/ JSON schemas - spec reference not needed |
| **Test Location/Type** | Where tests live not specified | Deferred to Phase 7 (out of MVP per spec) |

---

## Updated Specification

All clarifications integrated into `/specs/002-eject-and-customize/spec.md`:

✅ Clarifications section: Session 2 questions and answers added  
✅ FR-014: Updated with dual-format requirement  
✅ User Story 2 AS5: Updated with prevent-deselection strategy  
✅ Assumptions: New assumptions 12-13 document both decisions  

---

## Task Impact Analysis

### High Priority (Must Update for Session 2 Clarifications)

| Task | Impact | Status |
|------|--------|--------|
| **T015** (recovery.ts) | Must persist JSON errors to `.logs/errors.json` per Q2 Option C | ⚠️ Requires expansion |
| **T023** (Error handling) | Must implement dual format per Q2 Option C | ⚠️ Requires expansion |
| **T031** (Feature validation) | Must prevent deselection per Q1 Option B (not auto-deselect) | ⚠️ Strategy clarified |
| **T020** (Interactive prompts) | May need enhancement to show dependency chains per Q1 | ✅ Already designed for this |

### No Changes Needed

| Task | Reason |
|------|--------|
| All Phase 1 (T001-T008) | Foundational - not affected |
| Phase 2 foundational (T009-T014 except T015) | Not affected by either clarification |
| T024-T027 (Eject workflow) | Not directly affected |
| T028-T047 (US2-US4) | Not directly affected |
| T048-T060 (Polish) | Not directly affected |

---

## Validation Checklist

✅ **Specification Coverage**:
- All 17 FR addressed by tasks
- All 7 SC measurable with clarifications
- All 10 assumptions documented
- No contradictions between spec and tasks

✅ **Clarification Quality**:
- Q1 resolves architecture decision (prevent vs. auto-deselect)
- Q2 resolves UX + operational decision (format choice)
- Both answers integrate cleanly without rework
- Rationale provided and documented

✅ **Ready for Implementation**:
- Phase 1 setup (T001-T008) can start immediately
- Phase 2 foundational (T009-T017) has all inputs
- User stories (T018-T047) can proceed with confidence
- No ambiguities blocking any path

---

## Next Steps

### Immediate (Before Implementation Starts)

1. ✅ **Document Clarifications** → Done (this report)
2. ✅ **Update spec.md** → Done (Clarifications section updated)
3. ⏳ **Ready for Phase 2 Implementation** → Dev team can begin T001-T008 (Phase 1 Setup)

### During Implementation

1. **T015 & T023**: Reference FR-014 and Assumption 13 for dual-format implementation
2. **T031**: Reference Q1 Option B and Assumption 12 for prevent-deselection logic
3. **T020**: Enhance prompts to show dependency chain guidance (per Q1)

### Validation Points

- After T031: Verify dependency prevention works as designed
- After T023: Verify dual-format errors appear correctly
- After T015: Verify JSON persists to `.logs/` correctly
- Phase 3 QA: Test all error paths with hybrid format

---

## Session Statistics

| Metric | Value |
|--------|-------|
| Questions Asked | 2 |
| Questions Answered | 2 |
| Resolution Rate | 100% |
| Ambiguities Eliminated | 2 |
| Non-blocking Findings | 4 |
| Task Revisions Needed | 2-4 (minor scope clarification) |
| Implementation Blockers | 0 |
| Ready for Dev: | ✅ YES |

---

## Conclusion

Specification is **100% validated** for Phase 2 implementation. Session 2 clarifications resolved 2 detail-level design decisions:

1. **Interdependency Prevention** (Q1): Feature removal prevents deselecting features with dependents
2. **Dual-format Errors** (Q2): Errors display as prose in terminal + JSON in `.logs/` for debugging

All changes integrated into spec.md. No contradictions with tasks.md. Development can proceed with confidence.

**Status**: ✅ **READY FOR IMPLEMENTATION**

---

**Prepared by**: Clarification Bot  
**Branch**: `002-eject-and-customize`  
**Session Date**: 2025-10-16
