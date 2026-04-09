// Safe: hardcoded string literal with no user input — prevents flash of wrong theme
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var s=localStorage.getItem('dnd-theme');if(s)document.documentElement.setAttribute('data-theme',s)})();`,
      }}
    />
  );
}
