export default function PrivacyPage() {
    return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-8">
                Privacy Policy
            </h1>
            <p className="lead text-xl text-muted-foreground mb-8">
                Your privacy is critically important to us. At Scire, we have a few fundamental principles:
            </p>

            <h3>1. Data We Collect</h3>
            <p>
                We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
            </p>

            <h3>2. Visual & Audio Data</h3>
            <p>
                As an AI oral examination platform, Scire processes audio and visual data during exams to ensure integrity and provide assessment. This data is:
            </p>
            <ul>
                <li>Encrypted in transit and at rest.</li>
                <li>Used solely for the purpose of the immediate exam session and grading.</li>
                <li>Not used to train public AI models without explicit, opt-in consent.</li>
            </ul>

            <h3>3. Data Retention</h3>
            <p>
                We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
            </p>

            <h3>4. Sharing of Information</h3>
            <p>
                We don’t share any personally identifying information publicly or with third-parties, except when required to by law.
            </p>

            <h3>5. User Rights</h3>
            <p>
                You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
            </p>

            <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-muted-foreground m-0">
                    Last updated: January 2026. If you have any questions about our privacy policy, please contact us at <a href="mailto:privacy@scira.com" className="text-primary hover:underline">privacy@scira.com</a>.
                </p>
            </div>
        </div>
    );
}
