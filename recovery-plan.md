# Codessa Recovery Plan - Phase 1: Build System Restoration

## Current Status
- **126 -> 122 TypeScript errors** (4 errors resolved)
- **Core modules created**: Memory Manager, Model Router, Foresight Bridge
- **Major remaining issues**: Missing planner components, type conflicts, missing tool modules

## Priority 1: Critical Build Blockers (Execute First)

### 1. Fix PriorityLevel Type Issue
**Problem**: `'medium'` not assignable to `PriorityLevel`
**Files**: `core/codessa-kernel.ts:259`, `planner/models/taskTypes.ts`
**Action**: Check and fix PriorityLevel type definition

### 2. Fix Goal Status Type Issue  
**Problem**: `'pending'` not assignable to Goal status
**Files**: `core/codessa-kernel.ts:266`
**Action**: Update Goal status type to include 'pending'

### 3. Create Missing Planner Components
**Problem**: Missing critical planner modules
**Files needed**:
- `planner/decomposer/goalDecomposer.ts` - Missing LLMRouter, AgentRegistry imports
- `planner/scheduler/taskQueue.ts` - Missing Task import
- `planner/feedback/cognitionLoop.ts` - Missing ReflectorAgent import

### 4. Create Missing Tool Modules
**Problem**: Missing tool imports in agent files
**Files needed**:
- `tools/auditTools.ts`
- `tools/statusManager.ts`
- `tools/diagnostics.ts`
- `tools/manifestWriter.ts`

## Priority 2: Constructor Parameter Issues

### 1. Fix GoalDecomposer Constructor
**Problem**: `Expected 2 arguments, but got 0`
**Action**: Update constructor call in kernel or make parameters optional

### 2. Fix CognitionLoop Constructor
**Problem**: `Expected 2 arguments, but got 0`
**Action**: Update constructor call in kernel or make parameters optional

## Priority 3: Interface Mismatches

### 1. Fix TaskPlan vs Task[] Confusion
**Problem**: `decomposeGoal` returns `Task[]` but should return `TaskPlan`
**Action**: Update goal decomposer to return proper TaskPlan object

### 2. Fix Scheduler Interface
**Problem**: Missing methods like `queueTask`, `cancelTask`, `on`, `start`
**Action**: Update Scheduler class to implement EventEmitter with required methods

## Immediate Action Items

### Step 1: Quick Type Fixes
```bash
# 1. Fix PriorityLevel type
# 2. Fix Goal status type
# 3. Fix constructor parameter issues
```

### Step 2: Create Missing Modules
```bash
# Create basic implementations of:
# - Goal decomposer with proper constructors
# - Task scheduler with EventEmitter
# - Cognition loop with proper interface
# - Basic tool modules (audit, status, diagnostics, manifest)
```

### Step 3: Test Build
```bash
npm run build
# Target: Reduce errors from 122 to under 50
```

## Expected Outcome
After completing Priority 1 actions:
- **Build errors reduced to <50**
- **Core kernel compiles successfully**
- **Basic agent and planner infrastructure functional**
- **Memory and model routing working**

## Next Phase Preview
Once build is successful:
- Fix failing tests (16 failing tests)
- Implement missing agent functionalities
- Resolve plugin system type conflicts
- Complete Google Cloud integration

## Tools and Commands
```bash
# Check current error count
npm run build | grep -c "error TS"

# Run tests after build fixes
npm test

# Check for missing modules
find . -name "*.ts" -exec grep -l "Cannot find module" {} \;
```

---

**Priority Focus**: Get the build working first, then tackle functionality.
**Timeline**: Aim to complete Priority 1 in next 2-3 actions.
