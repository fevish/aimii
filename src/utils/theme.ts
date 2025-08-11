export function applyTheme(theme: string): void {
  const htmlElement = document.documentElement;
  htmlElement.classList.remove('default', 'high-contrast');
  if (theme !== 'default') {
    htmlElement.classList.add(theme);
  }
}