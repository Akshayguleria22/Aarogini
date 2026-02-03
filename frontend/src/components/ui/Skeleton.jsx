import React from 'react'
import { cn } from '../../lib/utils'

const Skeleton = ({ className }) => {
  return (
    <div className={cn('skeleton relative overflow-hidden rounded-lg bg-zinc-200/80 dark:bg-zinc-800/70', className)} />
  )
}

export default Skeleton
