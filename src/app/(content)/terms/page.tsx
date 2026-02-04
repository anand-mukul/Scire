export default function TermsPage() {
    return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-8">
                Terms of Service
            </h1>
            <p className="lead text-xl text-muted-foreground mb-8">
                By accessing Scire, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>

            <h3>1. Use License</h3>
            <p>
                Permission is granted to temporarily access the materials (information or software) on Scire's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>attempt to decompile or reverse engineer any software contained on Scire's website;</li>
                <li>remove any copyright or other proprietary notations from the materials; or</li>
                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h3>2. Disclaimer</h3>
            <p>
                The materials on Scire's website are provided on an 'as is' basis. Scire makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h3>3. Academic Integrity</h3>
            <p>
                Users agree to interact with the AI Examiner honestly. Any attempt to manipulate, exploit, or bypass the integrity checks (including gaze tracking and voice analysis) constitutes a violation of these terms and may result in immediate account termination and reporting to relevant academic institutions.
            </p>

            <h3>4. Limitations</h3>
            <p>
                In no event shall Scire or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Scire's website.
            </p>

            <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-muted-foreground m-0">
                    Last updated: January 2026. If you have any questions, please contact us at <a href="mailto:legal@scira.com" className="text-primary hover:underline">legal@scira.com</a>.
                </p>
            </div>
        </div>
    );
}
