'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Database, Eye, Pencil, Trash2 } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  canDelete?: (item: T) => boolean
  editLabel?: string
  deleteLabel?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  canDelete,
  editLabel = 'Editar registro',
  deleteLabel = 'Excluir registro',
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Os dados cadastrados aparecerão aqui.',
}: DataTableProps<T>) {
  const getCellValue = (item: T, column: Column<T>) => {
    if (column.render) return column.render(item)

    const value = item[column.key as keyof T]
    if (value instanceof Date) return value.toLocaleDateString('pt-BR')
    return String(value ?? '')
  }

  const hasActions = Boolean(onView || onEdit || onDelete)

  return (
    <div className="overflow-hidden rounded-xl border border-border/75 bg-background/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.015)]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/70 bg-secondary/35 hover:bg-secondary/35">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="h-11 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80"
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-[136px] text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="h-44 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-muted-foreground">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-secondary/35">
                      <Database className="h-5 w-5 text-muted-foreground/70" />
                    </div>
                    <p className="text-sm font-medium text-foreground/80">{emptyTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const deleteAllowed = canDelete ? canDelete(item) : true

                return (
                  <TableRow
                    key={item.id}
                    className="border-border/55 transition-colors hover:bg-primary/[0.035]"
                  >
                    {columns.map((column, index) => (
                      <TableCell
                        key={String(column.key)}
                        className={index === 0 ? 'py-4 font-medium text-foreground' : 'py-4 text-foreground/80'}
                      >
                        {getCellValue(item, column)}
                      </TableCell>
                    ))}

                    {hasActions && (
                      <TableCell className="py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView(item)}
                              title="Ver detalhes"
                              aria-label="Ver detalhes"
                              className="h-8 w-8 rounded-lg border border-transparent text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                              title={editLabel}
                              aria-label={editLabel}
                              className="h-8 w-8 rounded-lg border border-transparent text-muted-foreground transition-all hover:border-blue-400/20 hover:bg-blue-400/10 hover:text-blue-300"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {onDelete && deleteAllowed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(item)}
                              title={deleteLabel}
                              aria-label={deleteLabel}
                              className="h-8 w-8 rounded-lg border border-transparent text-muted-foreground transition-all hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
