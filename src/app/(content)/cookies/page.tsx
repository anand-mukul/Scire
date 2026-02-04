export default function CookiesPage() {
    return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-8">
                Cookie Policy
            </h1>
            <p className="lead text-xl text-muted-foreground mb-8">
                This Cookie Policy explains how Scire uses cookies and similar technologies to recognize you when you visit our website.
            </p>

            <h3>What are cookies?</h3>
            <p>
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>

            <h3>Why do we use cookies?</h3>
            <p>
                We use first and third party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties.
            </p>

            <h3>Essential Cookies</h3>
            <p>
                These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas (Auth sessions).
            </p>

            <h3>Analytics Cookies</h3>
            <p>
                These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.
            </p>

            <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-muted-foreground m-0">
                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your browser controls.
                </p>
            </div>
        </div>
    );
}
