// Ref de callback estable: mueve el foco al elemento cuando aparece (por ejemplo, el título de un resultado).
export function focusOnMount(element: HTMLElement | null): void {
  element?.focus();
}
