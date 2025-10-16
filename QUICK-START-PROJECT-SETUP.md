# Quick Start: Setting Up Your Project Board

Follow these steps to create a GitHub Project and populate it with features from the roadmap.

## 1. Create GitHub Project (5 minutes)

### Via GitHub Web UI

1. **Navigate to Projects**
   - Go to: https://github.com/N0SAFE/nextjs-nestjs-turborepo-template
   - Click the "Projects" tab
   - Click "New project" button

2. **Configure Project**
   - Choose: "Board" template
   - Name: `Feature Development Roadmap`
   - Description: `Tracking unimplemented features and enhancements for the Next.js + NestJS monorepo template`
   - Visibility: Choose based on your needs (Public/Private)
   - Click "Create project"

3. **Customize Columns** (drag to reorder)
   - 📋 Backlog (for planned features)
   - 🔄 In Progress (for active work)
   - 👀 In Review (for PR review)
   - ✅ Done (for completed features)

4. **Add Custom Fields**
   - Click "⋮" menu → Settings → Custom fields
   - Add these fields:
     - **Priority**: Single select → Add options: Critical, High, Medium, Low
     - **Category**: Single select → Add options: API, Frontend, Testing, DevOps, Docs, DX, MCP
     - **Effort**: Single select → Add options: Small, Medium, Large
     - **Phase**: Single select → Add options: Phase 1, Phase 2, Phase 3, Phase 4

5. **Create Views**
   - Create additional views for different perspectives:
     - "By Priority" (group by Priority)
     - "By Category" (group by Category)
     - "By Phase" (group by Phase)
     - "Table View" (for detailed view)

## 2. Create Issues (10 minutes)

### Option A: Automated with Script (Fastest)

```bash
# Navigate to repository
cd /path/to/nextjs-nestjs-turborepo-template

# Preview what will be created
./scripts/create-roadmap-issues.sh --dry-run

# Create Phase 1 (Critical) issues
./scripts/create-roadmap-issues.sh
```

This creates 10 critical Phase 1 issues with:
- Proper labels
- Detailed descriptions
- Task checklists
- Acceptance criteria

### Option B: Manual Creation (Most Control)

1. **Read the Roadmap**
   - Open: `.docs/planning/FEATURE-ROADMAP.md`
   - Review Phase 1 features

2. **Create First Issue**
   - Click "Issues" tab → "New issue"
   - Use this template:

```markdown
Title: [API] Example CRUD Operations

Labels: priority: critical, api, enhancement

Description:
## Description
Complete CRUD examples beyond basic user module to demonstrate best practices.

## Benefits
- Demonstrates best practices for API development
- Provides templates for new features

## Tasks
- [ ] Create Posts module (complete CRUD example)
- [ ] Add Comments module (nested CRUD example)
- [ ] Implement Categories module (many-to-many relationships)

## Acceptance Criteria
- [ ] Posts module with create, read, update, delete operations
- [ ] Tests covering all endpoints
- [ ] Documentation with usage examples

## Priority
Critical

## Phase
Phase 1
```

3. **Repeat for Other Phase 1 Features**
   - See `.docs/planning/FEATURE-ROADMAP.md` Section "Phase 1: Foundation"

## 3. Link Issues to Project (2 minutes)

### Automatic (Recommended)
1. Go to Project Settings → Workflows
2. Enable "Auto-add items"
3. Set filter: `is:issue is:open`
4. All new issues will auto-add to project

### Manual
1. Open each issue
2. Click "Projects" in right sidebar
3. Select your project
4. Issue appears in Backlog column

## 4. Organize Initial Backlog (5 minutes)

1. **Move Issues to Backlog**
   - Drag all newly created issues to "Backlog" column

2. **Set Custom Fields**
   - For each issue, set:
     - Priority (from issue labels)
     - Category (from issue labels)
     - Effort (Small/Medium/Large)
     - Phase (Phase 1)

3. **Order by Priority**
   - Drag critical items to top
   - Keep Phase 1 features together

## 5. Set Up Project Automation (3 minutes)

1. **Go to Project Settings → Workflows**

2. **Enable These Workflows:**

   **Item added to project:**
   - Auto-set Status to "Backlog"

   **Pull request linked:**
   - Auto-move Status to "In Progress"

   **Pull request merged:**
   - Auto-move Status to "Done"
   - Auto-archive item (optional)

   **Item closed:**
   - Auto-move Status to "Done"

3. **Save Changes**

## 6. Start Using the Project! 🚀

### For Developers

1. **Pick a Task**
   - Go to Project Board
   - Filter: Priority = Critical, Status = Backlog
   - Pick the top item
   - Drag to "In Progress"

2. **Implement Feature**
   - Follow tasks in issue description
   - Reference acceptance criteria
   - Add tests
   - Update documentation

3. **Create Pull Request**
   - Create PR for your changes
   - Link to issue (use "Closes #123" in PR description)
   - Issue auto-moves to "In Review"

4. **Complete**
   - PR gets merged
   - Issue auto-moves to "Done"
   - Pick next task!

### For Project Managers

1. **Weekly Planning**
   - Review Backlog
   - Prioritize next items
   - Assign to milestones
   - Update estimates

2. **Daily Standup**
   - Review "In Progress" column
   - Check for blockers
   - Celebrate completions in "Done"

3. **Monthly Review**
   - Calculate velocity
   - Plan next phase
   - Update roadmap
   - Archive old items

## Verification Checklist

After setup, verify:

- [ ] Project created with 4 columns
- [ ] Custom fields added (Priority, Category, Effort, Phase)
- [ ] At least 10 Phase 1 issues created
- [ ] Issues have proper labels
- [ ] Issues linked to project
- [ ] Automation workflows enabled
- [ ] Additional views created
- [ ] Team has access to project

## Common Issues & Solutions

### Issue: Script fails with "gh not authenticated"
**Solution**: Run `gh auth login` first

### Issue: Labels already exist
**Solution**: Normal - script will skip existing labels

### Issue: Can't find custom fields
**Solution**: Click ⋮ menu → Settings → Custom fields

### Issue: Issues not auto-adding
**Solution**: Check Project Settings → Workflows → Auto-add items

### Issue: Automation not working
**Solution**: Verify workflows are enabled in Settings

## Next Steps

Once your project is set up:

1. **Start Phase 1**
   - Pick first critical feature
   - Read implementation details in roadmap
   - Create branch and start coding

2. **Add More Features**
   - Run script for Phase 2 when ready
   - Or create issues manually from roadmap

3. **Customize**
   - Adjust priorities based on your needs
   - Add custom labels
   - Create additional views

4. **Maintain**
   - Weekly backlog grooming
   - Monthly roadmap review
   - Quarterly planning

## Resources

- **Feature Roadmap**: `.docs/planning/FEATURE-ROADMAP.md`
- **Detailed Setup Guide**: `scripts/generate-project-tasks.md`
- **Issue Creation Script**: `scripts/create-roadmap-issues.sh`
- **Project Summary**: `PROJECT-SETUP-SUMMARY.md`

## Getting Help

- **GitHub Projects Docs**: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- **Repository Docs**: `.docs/README.md`
- **Development Workflow**: `.docs/guides/DEVELOPMENT-WORKFLOW.md`

---

**Total Time**: ~25 minutes  
**Difficulty**: Easy  
**Result**: Fully configured project tracking system

Happy tracking! 🎉
