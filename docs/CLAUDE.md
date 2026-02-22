# CLAUDE.md

Instructions for Claude Code when working with this repository.

## Critical Workflow

### Before ANY Work

1. **GitHub Issue Management** - **REQUIRED** before starting any work:
   - Check if task/epic exists: `gh issue list --search "task name"`
   - If task exists:
     - Move task to "In Progress": `gh issue edit <number> --add-label "in-progress"`
     - Reference issue in commits: `git commit -m "feat: description (#123)"`
   - If task does NOT exist:
     - **For small tasks**: Create task issue: `gh issue create --template task.md`
     - **For large tasks (>1 day)**: Create epic with 2+ sub-tasks:
       - Create epic: `gh issue create --template epic.md`
       - Create sub-tasks: `gh issue create --template task.md`
       - Link sub-tasks to epic using GraphQL API or manually
     - Move created task to "In Progress"
   - **Epic rules**:
     - Epics must have at least 2 tasks
     - Don't move epics to "In Progress" - they track overall status
     - Epic closes automatically when all sub-tasks are done
   - **This is MANDATORY** - No work without a tracked issue

### After Completing Work

1. **Close GitHub Issue**:
   - Commit with issue reference: `git commit -m "feat: description (closes #123)"`
   - Or manually close: `gh issue close <number> --comment "Completed in PR #X"`
   - Issue automatically moves to "Done" when closed
   - If part of epic, epic progress updates automatically

## Documentation Navigation

### Start Here

- **GitHub Issues** - **CHECK FIRST** - `gh issue list` for current priorities

## When Guidelines Conflict with Requirements

If documentation makes a requested change impossible or conflicts with requirements:

1. **Do NOT** proceed with the change
2. **Do NOT** try to work around guidelines
3. **Explain** to user:
   - What guideline prevents the change
   - Why the guideline exists
   - What would need to change in guidelines to allow it
4. **Wait** for user to clarify or update guidelines

## Documentation Standards

When updating documentation:

- Max 400 lines per file
- 70% tables/lists, 30% prose
- Link don't duplicate
- Examples < 5-10 lines
- Link to external tool docs

## GitHub Issue Commands

| Command                                           | Purpose                   |
| ------------------------------------------------- | ------------------------- |
| `gh issue list`                                   | List all open issues      |
| `gh issue list --search "keyword"`                | Search for existing issue |
| `gh issue create --template task.md`              | Create new task           |
| `gh issue create --template epic.md`              | Create new epic           |
| `gh issue edit <number> --add-label in-progress`  | Move to in progress       |
| `gh issue close <number>`                         | Close completed issue     |
| `git commit -m "feat: description (#123)"`        | Reference issue in commit |
| `git commit -m "feat: description (closes #123)"` | Close issue with commit   |

## Linking Sub-Issues to Epics

To create proper parent-child issue relationships (sub-issues), use GitHub's GraphQL API with the `sub_issues` preview feature:

```bash
# Helper function to get issue node ID
get_issue_node_id() {
  gh api graphql -f query='
    query {
      repository(owner: "OWNER", name: "REPO") {
        issue(number: '$1') { id }
      }
    }
  ' --jq '.data.repository.issue.id'
}

# Link task as sub-issue of epic
PARENT_ID=$(get_issue_node_id 26)  # Epic issue number
CHILD_ID=$(get_issue_node_id 33)   # Task issue number

gh api graphql \
  -H "GraphQL-Features: sub_issues" \
  -f query='
    mutation {
      addSubIssue(input: {
        issueId: "'$PARENT_ID'",
        subIssueId: "'$CHILD_ID'"
      }) {
        issue { number title }
        subIssue { number title }
      }
    }
  '
```

**Key Points:**

- Requires `GraphQL-Features: sub_issues` header to enable preview feature
- Uses issue node IDs (not numbers) in the GraphQL mutation
- Creates visual progress tracking in GitHub UI
- Sub-issues show as checkboxes under parent epic

**Reference:** [Creating GitHub Issue Hierarchies](https://jessehouwing.net/create-github-issue-hierarchy-using-the-api/)
