import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode
} from 'react'

function isIgnorableMdxChild(node: ReactNode) {
  return (
    node == null ||
    node === false ||
    node === true ||
    (typeof node === 'string' && node.trim() === '')
  )
}

export function groupMdxHeadingSections(
  children: ReactNode,
  headingTypes: readonly ReactElement['type'][]
) {
  const groups: ReactNode[][] = []
  let current: ReactNode[] = []

  Children.forEach(children, child => {
    if (isIgnorableMdxChild(child)) return

    if (
      isValidElement(child) &&
      headingTypes.includes(child.type)
    ) {
      if (current.length > 0) groups.push(current)
      current = [child]
      return
    }

    current.push(child)
  })

  if (current.length > 0) groups.push(current)
  return groups
}
