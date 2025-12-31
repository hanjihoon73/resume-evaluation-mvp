export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen text-foreground overflow-x-hidden">
            {/* Background Overlay for better text readability vs neon */}
            <div className="absolute inset-0 bg-background/80 pointer-events-none z-[-1]" />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
