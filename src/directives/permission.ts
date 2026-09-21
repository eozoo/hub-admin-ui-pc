import type { App, DirectiveBinding } from 'vue'
import { pinia } from '@/stores'
import { useUserStore } from '@/stores/modules/user'
import { hasPermission, hasRole } from '@/utils/permission'

function removeElement(el: HTMLElement): void {
  el.parentNode?.removeChild(el)
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<string[]>): void {
  const required = binding.value
  if (!Array.isArray(required) || required.length === 0) return
  const user = useUserStore(pinia)
  if (!hasPermission(user.permissions, required)) removeElement(el)
}

function checkRole(el: HTMLElement, binding: DirectiveBinding<string[]>): void {
  const required = binding.value
  if (!Array.isArray(required) || required.length === 0) return
  const user = useUserStore(pinia)
  if (!hasRole(user.roles, required)) removeElement(el)
}

export function setupPermissionDirectives(app: App): void {
  app.directive('has-permi', { mounted: checkPermission })
  app.directive('has-role', { mounted: checkRole })
}
