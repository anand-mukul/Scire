'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
    function handlePrint() {
        const style = document.createElement('style');
        style.id = '__cert-print-style';
        style.innerHTML = `
            @media print {
                #certificate-toolbar { display: none !important; }
                body > *:not(:has(#certificate-printable)) { display: none !important; }
                #certificate-printable {
                    position: fixed !important;
                    inset: 0 !important;
                    width: 100vw !important;
                    height: auto !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 24px !important;
                    box-sizing: border-box !important;
                    background: white !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    z-index: 99999 !important;
                }
                .min-h-screen { min-height: auto !important; padding: 0 !important; background: white !important; }
                p.mt-5 { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        window.addEventListener('afterprint', () => {
            document.getElementById('__cert-print-style')?.remove();
        }, { once: true });
    }

    return (
        <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
        >
            <Printer size={15} />
            Print
        </button>
    );
}