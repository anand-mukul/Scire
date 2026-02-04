import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-8">
                Contact Us
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                Have questions about enterprise deployment, API access, or just want to say hi? We'd love to hear from you.
            </p>

            <div className="grid gap-6 mb-12">
                <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">Email Us</h3>
                        <p className="text-muted-foreground text-sm mb-2">For general inquiries and support.</p>
                        <a href="mailto:contact@scira.com" className="text-primary hover:underline font-medium">contact@scira.com</a>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">Live Chat</h3>
                        <p className="text-muted-foreground text-sm mb-2">Available Mon-Fri, 9am - 5pm EST.</p>
                        <span className="text-muted-foreground text-sm">Use the widget in the bottom right.</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                    <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">Office</h3>
                        <p className="text-muted-foreground text-sm">
                            123 Innovation Drive<br />
                            San Francisco, CA 94103
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-8 border border-border text-center">
                <h3 className="font-bold text-xl mb-4">Support for Students/Instructors</h3>
                <p className="text-muted-foreground mb-6">
                    Looking for technical help with an ongoing exam? Check our documentation or visit the help center.
                </p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline">Visit Help Center</Button>
                    <Button>Documentation</Button>
                </div>
            </div>
        </div>
    );
}
