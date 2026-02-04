export default function SecurityPage() {
    return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-8">
                Security
            </h1>
            <p className="lead text-xl text-muted-foreground mb-8">
                Security is at the core of our AI assessment infrastructure. We protect student data and exam integrity with enterprise-grade defenses.
            </p>

            <h3>Infrastructure Security</h3>
            <p>
                All of our services run in the cloud. We do not host or run our own routers, load balancers, DNS servers, or physical servers. Our infrastructure is spread across multiple availability zones and will continue to work should any one of those data centers fail.
            </p>

            <h3>Data Encryption</h3>
            <ul>
                <li><strong>In Transit:</strong> All data sent to or from our infrastructure is encrypted in transit via industry best-practices using Transport Layer Security (TLS).</li>
                <li><strong>At Rest:</strong> All user data, including exam recordings and transcripts, is encrypted at rest using AES-256 encryption.</li>
            </ul>

            <h3>Exam Integrity (Anti-Cheat)</h3>
            <p>
                Our AI proctoring system uses privacy-preserving analysis to detect anomalies. It analyzes:
            </p>
            <ul>
                <li><strong>Voice Biometrics:</strong> Ensuring the speaker matches the registered student.</li>
                <li><strong>Environment Analysis:</strong> Detecting unauthorized individuals or resources.</li>
                <li><strong>Browser Locking:</strong> Preventing tab switching or unauthorized tool usage during sessions.</li>
            </ul>

            <h3>Compliance</h3>
            <p>
                We are committed to complying with GDPR, FERPA, and other relevant data protection regulations. We perform regular security audits and penetration testing.
            </p>

            <div className="mt-12 p-6 bg-green-500/10 rounded-xl border border-green-500/20">
                <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mt-0 mb-2">Responsible Disclosure</h4>
                <p className="text-sm text-muted-foreground m-0">
                    If you discover a vulnerability, we would like to know about it so we can take steps to address it as quickly as possible. Please email <a href="mailto:security@scira.com" className="text-green-600 hover:underline">security@scira.com</a>.
                </p>
            </div>
        </div>
    );
}
