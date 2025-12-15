export default function Footer() {
  return (
    <footer className="w-full h-12 xl:h-16 bg-background border-t border-border flex items-center justify-center px-4 mt-auto">
      <a
        href={process.env.NEXT_PUBLIC_X_LINK || "https://x.com/"}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary transition-colors"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="26"
            height="26"
            viewBox="0 0 50 50"
          >
            <path d="M 6.9199219 6 L 21.136719 26.726562 L 6.2285156 44 L 9.40625 44 L 22.544922 28.777344 L 32.986328 44 L 43 44 L 28.123047 22.3125 L 42.203125 6 L 39.027344 6 L 26.716797 20.261719 L 16.933594 6 L 6.9199219 6 z"></path>
          </svg>
          <span className="text-xs">Follow us</span>
        </div>
      </a>
    </footer>
  );
}
