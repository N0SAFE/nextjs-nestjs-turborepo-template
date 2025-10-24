#!/usr/bin/env bash
# Task Management Script for .specify framework
# Provides commands to verify, check, reorganize, and update tasks in tasks.md files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script version
VERSION="1.0.0"

# Usage information
usage() {
    cat << EOF
Task Management Script v${VERSION}

USAGE:
    $(basename "$0") COMMAND [OPTIONS] [TASKS_FILE]

COMMANDS:
    verify          Verify tasks file follows correct format patterns
    check           Check for duplicate IDs, gaps, and organization issues  
    reorganize      Reorganize task IDs sequentially (with --auto flag)
    update          Update task completion status or content

OPTIONS:
    --auto          Auto-detect and fix issues (for reorganize)
    --complete      Mark task(s) as complete (for update)
    --incomplete    Mark task(s) as incomplete (for update)
    --task ID       Specify task ID(s) to update (comma-separated)
    --json          Output in JSON format
    --help          Show this help message

EXAMPLES:
    # Verify tasks file format
    $(basename "$0") verify specs/001-feature/tasks.md

    # Check for issues
    $(basename "$0") check specs/001-feature/tasks.md

    # Auto-reorganize tasks
    $(basename "$0") reorganize --auto specs/001-feature/tasks.md

    # Mark tasks as complete
    $(basename "$0") update --complete --task T001,T002,T003 specs/001-feature/tasks.md

    # Mark task as incomplete
    $(basename "$0") update --incomplete --task T010 specs/001-feature/tasks.md

EOF
    exit 0
}

# Get tasks file path
get_tasks_file() {
    local file="$1"
    
    if [[ -z "$file" ]]; then
        # Try to find most recent tasks.md
        file=$(find specs -name "tasks.md" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
        
        if [[ -z "$file" ]]; then
            echo "Error: No tasks file specified and none found in specs/" >&2
            exit 1
        fi
        
        echo "Using most recent tasks file: $file" >&2
    fi
    
    if [[ ! -f "$file" ]]; then
        echo "Error: Tasks file not found: $file" >&2
        exit 1
    fi
    
    echo "$file"
}

# Verify task format
verify_format() {
    local file="$1"
    local json_output="${2:-false}"
    
    local errors=0
    local warnings=0
    local issues=()
    
    # Check for required checkbox format
    local line_num=0
    while IFS= read -r line; do
        ((line_num++)) || true
        
        # Skip empty lines, headers, and markdown formatting (- **, plain bullets without checkboxes under headers)
        [[ -z "$line" || "$line" =~ ^#+ || "$line" =~ ^-[[:space:]]*\*\* ]] && continue
        
        # Skip plain bullet points that are clearly not tasks (under ## headers, have colons, etc.)
        if [[ "$line" =~ ^-[[:space:]][^[].*: ]] || [[ "$line" =~ ^-[[:space:]]+(Include|API|Schemas|Migrations|CLI|Setup|Foundational|User|Polish|NO) ]]; then
            continue
        fi
        
        # Check if line looks like a task
        if [[ "$line" =~ ^-[[:space:]]*\[[[:space:]xX[:space:]]\] ]]; then
            # Valid task line - check format
            
            # Extract task ID
            if [[ "$line" =~ T[0-9]{3,} ]]; then
                local task_id="${BASH_REMATCH[0]}"
                
                # Check if followed by proper labels
                if ! [[ "$line" =~ ^-[[:space:]]*\[[[:space:]xX[:space:]]\][[:space:]]+T[0-9]{3,}([[:space:]]+\[P\])?([[:space:]]+\[US[0-9]+[a-z]?\])? ]]; then
                    issues+=("Line $line_num: Invalid task format - missing proper spacing or labels")
                    warnings=$((warnings + 1))
                fi
                
                # Check for file path in description (allow exceptions for CLI commands, migrations, client generation)
                if ! [[ "$line" =~ (src/|apps/|packages/|specs/|\.docs/|tests/|bun run|db:generate|db:push|db:migrate|-- generate) ]]; then
                    issues+=("Line $line_num: Task $task_id missing file path in description")
                    warnings=$((warnings + 1))
                fi
            else
                issues+=("Line $line_num: Task missing ID (T###)")
                errors=$((errors + 1))
            fi
        elif [[ "$line" =~ ^-[[:space:]]T[0-9] ]]; then
            # Line starts with "- T###" but no checkbox - likely malformed task
            issues+=("Line $line_num: Invalid task format - must start with - [ ] or - [x]")
            errors=$((errors + 1))
        fi
    done < "$file"
    
    # Output results
    if [[ "$json_output" == "true" ]]; then
        cat << JSON
{
  "file": "$file",
  "valid": $([ $errors -eq 0 ] && echo "true" || echo "false"),
  "errors": $errors,
  "warnings": $warnings,
  "issues": [
$(printf '    "%s"' "${issues[@]}" | sed 's/$/,/g' | sed '$ s/,$//')
  ]
}
JSON
    else
        
        echo -e "${BLUE}Task Format Verification: $file${NC}"
        echo ""
        
        if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
            echo -e "${GREEN}✓ All tasks follow correct format${NC}"
        else
            [[ $errors -gt 0 ]] && echo -e "${RED}✗ Errors: $errors${NC}"
            [[ $warnings -gt 0 ]] && echo -e "${YELLOW}⚠ Warnings: $warnings${NC}"
            echo ""
            
            for issue in "${issues[@]}"; do
                if [[ "$issue" =~ ^Line.*missing ]]; then
                    echo -e "${YELLOW}  ⚠ $issue${NC}"
                else
                    echo -e "${RED}  ✗ $issue${NC}"
                fi
            done
        fi
        
        if [[ $errors -gt 0 ]]; then
            exit 1
        fi
    fi
}

# Check for duplicates and gaps
check_tasks() {
    local file="$1"
    local json_output="${2:-false}"
    
    local errors=0
    local warnings=0
    local issues=()
    local -A task_ids
    local -a all_ids
    
    # Extract all task IDs (only from actual task lines with checkboxes)
    while IFS= read -r line; do
        if [[ "$line" =~ ^-[[:space:]]*\[[[:space:]xX[:space:]]\][[:space:]]+T([0-9]{3,}) ]]; then
            local id="${BASH_REMATCH[1]}"
            local task_id="T$id"
            
            # Check for duplicates
            if [[ -n "${task_ids[$task_id]:-}" ]]; then
                issues+=("Duplicate task ID: $task_id (lines ${task_ids[$task_id]} and current)")
                errors=$((errors + 1))
            else
                task_ids[$task_id]="$line"
            fi
            
            all_ids+=("$id")
        fi
    done < "$file"
    
    # Sort IDs numerically
    IFS=$'\n' sorted_ids=($(sort -n <<<"${all_ids[*]}"))
    unset IFS
    
    # Check for gaps
    local expected=1
    for id in "${sorted_ids[@]}"; do
        id="${id#0}" # Remove leading zeros
        id="${id#0}"
        
        if [[ $id -ne $expected ]]; then
            issues+=("Gap in task sequence: Expected T$(printf "%03d" $expected), found T$(printf "%03d" $id)")
            warnings=$((warnings + 1))
        fi
        expected=$((id + 1))
    done
    
    # Check phase organization
    local current_phase=""
    local phase_order=("Setup" "Foundational" "User Story" "Polish")
    local phase_idx=0
    local orphaned=0
    
    while IFS= read -r line; do
        if [[ "$line" =~ ^##[[:space:]]+Phase ]]; then
            current_phase="$line"
        elif [[ "$line" =~ ^-[[:space:]]*\[[[:space:]xX[:space:]]\][[:space:]]+T[0-9]{3,} ]] && [[ -z "$current_phase" ]]; then
            orphaned=$((orphaned + 1))
        fi
    done < "$file"
    
    if [[ $orphaned -gt 0 ]]; then
        issues+=("Found $orphaned orphaned tasks (not under any phase header)")
        errors=$((errors + 1))
    fi
    
    # Output results
    if [[ "$json_output" == "true" ]]; then
        cat << JSON
{
  "file": "$file",
  "valid": $([ $errors -eq 0 ] && echo "true" || echo "false"),
  "total_tasks": ${#all_ids[@]},
  "duplicates": $(grep -c "Duplicate" <<<"${issues[*]}" 2>/dev/null || echo 0),
  "gaps": $(grep -c "Gap" <<<"${issues[*]}" 2>/dev/null || echo 0),
  "orphaned": $orphaned,
  "errors": $errors,
  "warnings": $warnings,
  "issues": [
$(printf '    "%s"' "${issues[@]}" | sed 's/$/,/g' | sed '$ s/,$//')
  ]
}
JSON
    else
        echo -e "${BLUE}Task Organization Check: $file${NC}"
        echo ""
        echo "Total tasks: ${#all_ids[@]}"
        
        if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
            echo -e "${GREEN}✓ No duplicates, gaps, or organizational issues${NC}"
        else
            [[ $errors -gt 0 ]] && echo -e "${RED}✗ Errors: $errors${NC}"
            [[ $warnings -gt 0 ]] && echo -e "${YELLOW}⚠ Warnings: $warnings${NC}"
            echo ""
            
            for issue in "${issues[@]}"; do
                if [[ "$issue" =~ ^Gap ]]; then
                    echo -e "${YELLOW}  ⚠ $issue${NC}"
                else
                    echo -e "${RED}  ✗ $issue${NC}"
                fi
            done
        fi
        
        if [[ $errors -gt 0 ]]; then
            exit 1
        fi
    fi
}

# Reorganize tasks
reorganize_tasks() {
    local file="$1"
    local auto="${2:-false}"
    
    if [[ "$auto" != "true" ]]; then
        echo "Error: --auto flag required for reorganize command" >&2
        echo "This prevents accidental reorganization of task files" >&2
        exit 1
    fi
    
    echo -e "${BLUE}Reorganizing tasks in: $file${NC}"
    
    # Create backup
    local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$file" "$backup"
    echo "Created backup: $backup"
    
    # Extract all tasks with their content
    local -a tasks=()
    local current_phase=""
    local task_counter=1
    
    # Read file and reorganize
    local output=""
    while IFS= read -r line; do
        if [[ "$line" =~ ^##[[:space:]]+Phase ]]; then
            current_phase="$line"
            output+="$line"$'\n'
        elif [[ "$line" =~ ^-[[:space:]]*\[([[:space:]xX[:space:]])\][[:space:]]+T[0-9]{3,}(.*)$ ]]; then
            local checkbox="${BASH_REMATCH[1]}"
            local rest="${BASH_REMATCH[2]}"
            
            # Replace old task ID with new sequential ID
            local new_id=$(printf "T%03d" $task_counter)
            output+="- [$checkbox] $new_id$rest"$'\n'
            ((task_counter++))
        else
            output+="$line"$'\n'
        fi
    done < "$file"
    
    # Write reorganized content
    echo -n "$output" > "$file"
    
    local new_total=$((task_counter - 1))
    echo -e "${GREEN}✓ Reorganized $new_total tasks with sequential IDs${NC}"
    echo "Backup saved at: $backup"
}

# Update task status or content
update_tasks() {
    local file="$1"
    local action="$2"  # complete/incomplete
    local task_list="$3"  # comma-separated task IDs
    
    if [[ -z "$task_list" ]]; then
        echo "Error: --task option required with comma-separated task IDs" >&2
        exit 1
    fi
    
    # Create backup
    local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$file" "$backup"
    
    # Split task list
    IFS=',' read -ra tasks <<< "$task_list"
    
    local updated=0
    local temp_file="${file}.tmp"
    
    while IFS= read -r line; do
        local modified=false
        
        for task_id in "${tasks[@]}"; do
            if [[ "$line" =~ ^-[[:space:]]*\[([[:space:]xX[:space:]])\][[:space:]]+${task_id}[[:space:]] ]]; then
                if [[ "$action" == "complete" ]]; then
                    line="${line/- [ ] /- [x] }"
                    modified=true
                elif [[ "$action" == "incomplete" ]]; then
                    line="${line/- [x] /- [ ] }"
                    modified=true
                fi
            fi
        done
        
        echo "$line" >> "$temp_file"
        [[ "$modified" == "true" ]] && ((updated++))
    done < "$file"
    
    mv "$temp_file" "$file"
    
    if [[ $updated -gt 0 ]]; then
        echo -e "${GREEN}✓ Updated $updated tasks${NC}"
        echo "Backup saved at: $backup"
    else
        echo -e "${YELLOW}⚠ No tasks were updated (IDs not found or already in desired state)${NC}"
        rm "$backup"
    fi
}

# Main script
main() {
    local command=""
    local tasks_file=""
    local auto=false
    local json_output=false
    local action=""
    local task_ids=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            verify|check|reorganize|update)
                command="$1"
                shift
                ;;
            --auto)
                auto=true
                shift
                ;;
            --complete)
                action="complete"
                shift
                ;;
            --incomplete)
                action="incomplete"
                shift
                ;;
            --task)
                task_ids="$2"
                shift 2
                ;;
            --json)
                json_output=true
                shift
                ;;
            --help|-h)
                usage
                ;;
            --version)
                echo "Task Management Script v${VERSION}"
                exit 0
                ;;
            *)
                if [[ -z "$tasks_file" ]]; then
                    tasks_file="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Validate command
    if [[ -z "$command" ]]; then
        echo "Error: No command specified" >&2
        usage
    fi
    
    # Get tasks file
    tasks_file=$(get_tasks_file "$tasks_file")
    
    # Execute command
    case "$command" in
        verify)
            verify_format "$tasks_file" "$json_output"
            ;;
        check)
            check_tasks "$tasks_file" "$json_output"
            ;;
        reorganize)
            reorganize_tasks "$tasks_file" "$auto"
            ;;
        update)
            if [[ -z "$action" ]]; then
                echo "Error: --complete or --incomplete flag required for update command" >&2
                exit 1
            fi
            update_tasks "$tasks_file" "$action" "$task_ids"
            ;;
        *)
            echo "Error: Unknown command: $command" >&2
            usage
            ;;
    esac
}

main "$@"
