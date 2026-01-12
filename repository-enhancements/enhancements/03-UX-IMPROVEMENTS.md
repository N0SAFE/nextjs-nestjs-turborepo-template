# UI/UX Improvements

> Missing UI components and user experience enhancements

## Selected Components

The following 5 components will be implemented:
- **DataTable** - Full-featured data table with sorting/filtering/pagination
- **EmptyState** - Reusable empty state with presets
- **ErrorState** - Error display with retry functionality
- **LoadingState** - Consistent loading indicators
- **ConfirmDialog** - Confirmation modal with async support

### Why These Components?

During our discussion, we reviewed 9 potential components and selected 5 based on:

| Component | Selected | Reason |
|-----------|----------|--------|
| DataTable | ✅ Yes | Essential for admin pages, user lists, data-heavy features |
| EmptyState | ✅ Yes | Common UX pattern, needed everywhere data might be empty |
| ErrorState | ✅ Yes | Consistent error display across the app |
| LoadingState | ✅ Yes | Replace inconsistent loading indicators |
| ConfirmDialog | ✅ Yes | Destructive actions need confirmation |
| PageHeader | ❌ No | Too simple, just use existing layout patterns |
| StatCard | ❌ No | Dashboard-specific, can build when needed |
| SearchInput | ❌ No | ShadCN Input + custom logic is sufficient |
| CopyButton | ❌ No | Too specialized, use `navigator.clipboard` directly |

### How to Use These Components

All components live in `packages/ui/base/src/components/` and are exported from `@repo/ui`:

```typescript
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  ConfirmDialog,
  useConfirmDialog
} from '@repo/ui'
```

---

## 1. Add DataTable Component

### Current State
Using basic `table.tsx` from ShadCN without advanced features

### Enhancement: Full-Featured DataTable

**Location:** `packages/ui/base/src/components/shadcn/data-table.tsx`

```typescript
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: boolean
  sorting?: boolean
  filtering?: boolean
  selection?: boolean
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = true,
  sorting = true,
  filtering = false,
  selection = false,
  loading = false,
  emptyMessage = 'No results found.',
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filtering, setFiltering] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      globalFilter: filtering,
      rowSelection,
    },
  })

  return (
    <div>
      {filtering && (
        <Input
          placeholder="Search..."
          value={filtering}
          onChange={(e) => setFiltering(e.target.value)}
          className="max-w-sm mb-4"
        />
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {/* Sortable header */}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>Deprecated | Legacy user hooks |
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && <DataTablePagination table={table} />}
    </div>
  )
}
```

**Additional Files:**
- `data-table-pagination.tsx`
- `data-table-column-header.tsx`
- `data-table-toolbar.tsx`
- `data-table-faceted-filter.tsx`

---

## 2. Add EmptyState Component

### Enhancement: Reusable Empty State

**Location:** `packages/ui/base/src/components/atomics/molecules/EmptyState.tsx`

```typescript
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button 
          onClick={action.onClick} 
          className="mt-4"
          variant="outline"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Preset variants
export function NoResults({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description="Try adjusting your search or filters"
      action={onReset ? { label: 'Clear filters', onClick: onReset } : undefined}
    />
  )
}

export function NoData({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No data yet"
      description="Get started by creating your first item"
      action={onCreate ? { label: 'Create', onClick: onCreate } : undefined}
    />
  )
}

export function NoAccess() {
  return (
    <EmptyState
      icon={Lock}
      title="Access restricted"
      description="You don't have permission to view this content"
    />
  )
}
```

---

## 3. Add ErrorState Component

### Enhancement: Reusable Error Display

**Location:** `packages/ui/base/src/components/atomics/molecules/ErrorState.tsx`

```typescript
interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const displayMessage = message || error?.message || 'An unexpected error occurred'
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <div className="mb-4 rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {displayMessage}
      </p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          className="mt-4"
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 text-left text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Technical details
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  )
}

// Query error wrapper
export function QueryErrorState({ 
  error, 
  refetch 
}: { 
  error: Error | null
  refetch?: () => void 
}) {
  return (
    <ErrorState
      title="Failed to load data"
      error={error}
      onRetry={refetch}
    />
  )
}
```

---

## 4. Add LoadingState Component

### Enhancement: Consistent Loading Display

**Location:** `packages/ui/base/src/components/atomics/molecules/LoadingState.tsx`

```typescript
interface LoadingStateProps {
  message?: string
  variant?: 'spinner' | 'skeleton' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8',
      className
    )}>
      {variant === 'spinner' && (
        <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      )}
      {variant === 'skeleton' && (
        <div className="space-y-2 w-full max-w-md">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      {variant === 'pulse' && (
        <div className={cn('rounded-full bg-muted animate-pulse', sizeClasses[size])} />
      )}
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

// Table loading state
export function TableLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

// Card loading state
export function CardLoadingState() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
```

---

## 5. Add ConfirmDialog Component

### Enhancement: Reusable Confirmation Modal

**Location:** `packages/ui/base/src/components/shadcn/confirm-dialog.tsx`

```typescript
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading || loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || loading}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {(isLoading || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for easier usage
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>
  }>({
    open: false,
    props: { title: '', onConfirm: () => {} },
  })

  const confirm = (props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => {
    setState({ open: true, props })
  }

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      {...state.props}
    />
  )

  return { confirm, dialog }
}
```

---

## 6. Improve Admin Users Page

### Current State
`apps/web/src/app/dashboard/admin/users/page.tsx` (266 lines) uses basic table

### Enhancement: Use DataTable with Features

```typescript
// Updated admin users page
export default function AdminUsersPage() {
  const { data, isLoading, error, refetch } = useAdminListUsers()
  const { confirm, dialog } = useConfirmDialog()
  const actions = useAdminActions()

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => <Checkbox ... />,
      cell: ({ row }) => <Checkbox ... />,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={row.original.image} />
            <AvatarFallback>{row.original.name?.[0]}</AvatarFallback>
          </Avatar>
          <span>{row.original.name}</span>
        </div>
      ),
    },
    // ... more columns
  ]

  if (error) {
    return <QueryErrorState error={error} refetch={refetch} />
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.users ?? []}
        loading={isLoading}
        pagination
        sorting
        filtering
      />
      
      {dialog}
    </>
  )
}
```

---

## Implementation Priority

| Component | Impact | Effort | Priority |
|-----------|--------|--------|----------|
| DataTable | High | High | 1 |
| EmptyState | High | Low | 2 |
| ErrorState | High | Low | 3 |
| LoadingState | High | Low | 4 |
| ConfirmDialog | High | Medium | 5 |
| Admin page refactor | Medium | Medium | 6 |

---

## Checklist

- [ ] DataTable component created
- [ ] EmptyState component created
- [ ] ErrorState component created
- [ ] LoadingState component created
- [ ] ConfirmDialog component created
- [ ] Admin users page refactored
- [ ] Components exported from package
- [ ] Components documented
