// Navegación completa del documento: descarta todo el estado del cliente (stores y rutas que React conserva).
export function hardNavigate(url: string): void {
  window.location.replace(url);
}
