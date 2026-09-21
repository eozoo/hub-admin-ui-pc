function matchPermission(source: string, target: string): boolean {
  const sourceParts = source.split(':')
  const targetParts = target.split(':')
  return sourceParts.every((part, index) => part === '*' || part === targetParts[index])
}

export function hasPermission(owned: string[], required: string[]): boolean {
  return required.some((target) => owned.some((source) => matchPermission(source, target)))
}

export function hasRole(owned: string[], required: string[]): boolean {
  return owned.includes('sysAdmin') || required.some((role) => owned.includes(role))
}
