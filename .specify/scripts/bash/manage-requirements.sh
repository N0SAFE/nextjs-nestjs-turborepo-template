#!/usr/bin/env bash
# Manage Functional Requirements for .specify framework
# Similar style to manage-tasks.sh - analyze spec.md for functional requirements (FR-###)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VERSION="1.0.0"

usage() {
    cat << EOF
Manage Functional Requirements v${VERSION}

USAGE:
    $(basename "$0") analyze SPEC_FILE TASKS_FILE [--json]

COMMANDS:
    analyze     Analyze a spec.md for FR-### entries and correlate with tasks.md

OPTIONS:
    --json      Output machine-readable JSON
    --help      Show this help

EXAMPLE:
    $(basename "$0") analyze specs/002-build-package-handler/spec.md specs/002-build-package-handler/tasks.md

EOF
    exit 0
}

get_file() {
    local f="$1"
    if [[ -z "$f" || ! -f "$f" ]]; then
        echo "Error: file not found: $f" >&2
        exit 1
    fi
    echo "$f"
}

# Extract FR ids and titles
extract_frs() {
    local spec="$1"
    # Look for lines containing FR-### or FR ### or starting with "Functional Requirement" bullets
    # Capture ID and text
    awk 'BEGIN{IGNORECASE=1}
    {
    if(match($0, /FR[- _]?[0-9]{3,}/)){
    id=substr($0, RSTART, RLENGTH)
    # normalize id to FR-###
    gsub(/[_ ]/,"-",id)
    sub(/^[[:space:]]*[-*+][[:space:]]*/,"",$0)
    print id "::" substr($0, RSTART+RLENGTH)
      } else if(match($0, /^-[[:space:]]*Functional Requirement[:]?/i)){
        # possible bullet like - Functional Requirement: description
        # generate synthetic id using NR
        print "FR-000::" $0
      }
    }' "$spec" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Count tasks referencing a given fr id
count_tasks_for_fr() {
    local fr="$1"
    local tasks_file="$2"
    # Count lines where the fr id appears (case-insensitive)
    grep -i -E "\b${fr//-/[-_ ]}\b|${fr}\b" -n "$tasks_file" | wc -l || true
}

analyze() {
    local spec_file=$(get_file "$1")
    local tasks_file=$(get_file "$2")
    local json_out=false
    if [[ "${3:-}" == "--json" ]]; then
        json_out=true
    fi

    # Extract FR list
    mapfile -t fr_lines < <(extract_frs "$spec_file")

    declare -A fr_counts
    declare -A fr_titles
    declare -a fr_ids

    for line in "${fr_lines[@]}"; do
        # line format: ID::rest
        IFS='::' read -r id rest <<< "$line"
        id_trim=$(echo "$id" | tr -d '[:space:]')
        if [[ -z "$id_trim" ]]; then
            continue
        fi
        fr_ids+=("$id_trim")
        # title: trim rest
        title=$(echo "$rest" | sed 's/^[:[:space:]]*//')
        fr_titles["$id_trim"]="$title"
        c=$(count_tasks_for_fr "$id_trim" "$tasks_file")
        fr_counts["$id_trim"]=$c
    done

    # Also find tasks that mention no FR
    # Collect all task lines
    mapfile -t task_lines < <(grep -nE '^-[[:space:]]*\[[ xX]\]' "$tasks_file" || true)
    orphaned=0
    declare -a orphan_tasks
    for tline in "${task_lines[@]}"; do
        # check if any FR id occurs in line
        matched=false
        for id in "${fr_ids[@]}"; do
            if echo "$tline" | grep -qi -E "\b${id//-/[-_ ]}\b|${id}\b"; then
                matched=true
                break
            fi
        done
        if [[ "$matched" == "false" ]]; then
            orphaned=$((orphaned+1))
            orphan_tasks+=("$tline")
        fi
    done

    total_frs=${#fr_ids[@]}
    total_tasks=${#task_lines[@]}

    if [[ "$json_out" == "true" ]]; then
        # Emit JSON
        echo "{"
        echo "  \"spec\": \"$spec_file\"," 
        echo "  \"tasks\": \"$tasks_file\"," 
        echo "  \"summary\": { \"total_frs\": $total_frs, \"total_tasks\": $total_tasks, \"orphan_tasks\": $orphaned },"
        echo "  \"frs\": {"
        first=true
        for id in "${fr_ids[@]}"; do
            if [[ "$first" == "true" ]]; then first=false; else echo ","; fi
            count=${fr_counts[$id]:-0}
            # escape any double-quotes in the title for JSON
            title=${fr_titles[$id]//\"/\\\"}
            echo -n "    \"$id\": { \"title\": \"$title\", \"task_count\": $count }"
        done
        echo ""
        echo "  },"
        echo "  \"orphan_tasks\": ["
        for i in "${!orphan_tasks[@]}"; do
            # escape double quotes in the task line for JSON output
            line=${orphan_tasks[$i]//\"/\\\"}
            echo -n "    \"${line}\""
            if [[ $i -lt $((${#orphan_tasks[@]}-1)) ]]; then echo ","; fi
        done
        echo ""
        echo "  ]"
        echo "}"
    else
        echo -e "${BLUE}Functional Requirements Analysis${NC}"
        echo "Spec: $spec_file"
        echo "Tasks: $tasks_file"
        echo ""
        echo "Total FRs: $total_frs"
        echo "Total tasks: $total_tasks"
        echo "Orphaned tasks (no FR referenced): $orphaned"
        echo ""
        printf "%s\n" "FR ID | Tasks | Title"
        printf "%s\n" "---------------------------------------------"
        for id in "${fr_ids[@]}"; do
            count=${fr_counts[$id]:-0}
            printf "%s | %s | %s\n" "$id" "$count" "${fr_titles[$id]}"
        done

        if [[ $orphaned -gt 0 ]]; then
            echo ""
            echo "Orphaned tasks (sample):"
            for i in "${!orphan_tasks[@]}"; do
                echo "  ${orphan_tasks[$i]}"
                if [[ $i -ge 9 ]]; then
                    echo "  ... (showing first 10)"
                    break
                fi
            done
        fi
    fi
}

main() {
    if [[ $# -lt 2 ]]; then
        usage
    fi

    cmd="$1"
    shift

    case "$cmd" in
        analyze)
            analyze "$@"
            ;;
        *)
            echo "Unknown command: $cmd" >&2
            usage
            ;;
    esac
}

main "$@"
