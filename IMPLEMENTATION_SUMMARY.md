# View-Only Mode for Finalized Batch Status - Implementation Summary

## Overview

Implemented the ability to **view** labeled/reviewed data when batch status is `APPROVED`, `SUBMITTED`, or `RE_SUBMITTED`, while **preventing** any editing/approval/rejection actions.

## What Was Fixed

### 1. ReviewWorkspace.jsx - Status Constant Bug (CRITICAL)

**File**: `src/pages/Reviewer/ReviewWorkspace.jsx` (Line 268)

**Before**:

```javascript
const isFinalizedAssignment =
  assignmentStatus === "APPROVED" ||
  assignmentStatus === "REJECTED" ||
  assignmentStatus === "SUBMITTED" ||
  assignmentStatus === "RESUBMITTED";
```

**After**:

```javascript
const isFinalizedAssignment =
  assignmentStatus === "APPROVED" ||
  assignmentStatus === "REJECTED" ||
  assignmentStatus === "SUBMITTED" ||
  assignmentStatus === "RE_SUBMITTED";
```

**Issue**: The status constant was `"RESUBMITTED"` (no underscore) but backend uses `"RE_SUBMITTED"` (with underscore). This caused the finalized check to fail for resubmitted assignments.

**Impact**: Now all three finalized states are properly recognized.

## How It Works

### Annotator Workspace (View-Only Mode)

When assignment status is `SUBMITTED`, `RE_SUBMITTED`, or `APPROVED`:

- **✓ CAN**: View all labeled data
- **✓ CAN**: View annotations on the canvas (read-only)
- **✗ CANNOT**: Draw or edit annotations
- **✗ CANNOT**: Submit assignment
- **UI Status**: Tool selector disabled, only "Select" mode available

### Reviewer Workspace (View-Only Mode)

When assignment status is `SUBMITTED`, `RE_SUBMITTED`, `APPROVED`, or `REJECTED`:

- **✓ CAN**: View all reviewed data with labels and decisions
- **✓ CAN**: View annotation details and rejection reasons
- **✓ CAN**: Click annotations to highlight them
- **✗ CANNOT**: Approve annotations
- **✗ CANNOT**: Reject annotations
- **✗ CANNOT**: Submit review
- **UI Status**: Approve/Reject buttons disabled with message

## User Experience

### When Viewing a Finalized Batch:

1. **Annotator sees**:
   - All images with their labels displayed
   - Message: "Assignment đã ở trạng thái cuối {STATUS}"
   - All drawing tools grayed out
   - Submit button disabled

2. **Reviewer sees**:
   - All images with review decisions
   - Annotations showing approval/rejection status
   - Approve/Reject buttons disabled
   - Message: "Assignment đã ở trạng thái cuối {STATUS}"
   - Submit button disabled

## Technical Implementation

### Key Variables:

**Annotator Workspace**:

```javascript
const isReadOnly = ["SUBMITTED", "RE_SUBMITTED", "APPROVED"].includes(
  workspace?.assignmentStatus?.toUpperCase(),
);
```

**Reviewer Workspace**:

```javascript
const isFinalizedAssignment =
  assignmentStatus === "APPROVED" ||
  assignmentStatus === "REJECTED" ||
  assignmentStatus === "SUBMITTED" ||
  assignmentStatus === "RE_SUBMITTED";
```

### Button Disabling Logic:

**Annotator**:

- `isReadOnly ? "select" : activeTool` (forces select mode)
- `disabled={isReadOnly}` (disables submit button)
- `drawingHandlers={isReadOnly ? {} : drawing}` (disables drawing)

**Reviewer**:

- `canReviewCurrentImage = !isFinalizedAssignment && !imageLoading && !hasImageLoadError && imageBlobUrl`
- `disabled={reviewSubmitting || !canReviewCurrentImage || isRejecting}` (disables approve)
- `disabled={reviewSubmitting || policies.length === 0 || !canReviewCurrentImage}` (disables reject)

## Status Constants

All components now consistently use:

- `"APPROVED"` - Assignment/Review approved
- `"SUBMITTED"` - Annotator submitted work for review
- `"RE_SUBMITTED"` - Annotator resubmitted after rejection
- `"REJECTED"` - Review rejected work (Reviewer only)

## Testing Checklist

- [ ] Create an assignment and submit it
- [ ] Open as Annotator → Should see view-only mode
- [ ] View all images and labels
- [ ] Confirm approve/reject/submit buttons are disabled
- [ ] Confirm drawing tools are disabled
- [ ] Open as Reviewer → Should see view-only (read-only) annotations
- [ ] Click annotations to highlight
- [ ] Confirm can view rejection details
- [ ] Confirm buttons are properly disabled with tooltips

## Files Modified

1. `src/pages/Reviewer/ReviewWorkspace.jsx` - Fixed status constant on line 268

## Files Already Correct (No Changes Needed)

1. `src/pages/Annotator/Workspace.jsx` - Already has correct implementation
2. `src/pages/Reviewer/ReviewQueue.jsx` - Already uses "RE_SUBMITTED"
3. Backend services - Already validate assignment status correctly
