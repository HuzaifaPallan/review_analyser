export const metadata = {
  title: 'Play Store Viewer',
  description: 'Dynamic app details by bundle id'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}

