/**
 * WebRTC Configuration
 *
 * STUN servers are used to discover the public IP and port of the client.
 * TURN servers relay media when direct P2P connections fail (strict firewalls/NATs).
 *
 * Free STUN: Google provides free STUN servers (no credentials needed).
 * TURN: Requires a self-hosted or third-party relay. See TURN_SETUP_GUIDE.md.
 *
 * To enable TURN, set the following environment variables:
 *   NEXT_PUBLIC_TURN_URL   = "turn:your-server.com:3478"
 *   NEXT_PUBLIC_TURN_USERNAME = "username"
 *   NEXT_PUBLIC_TURN_CREDENTIAL = "credential"
 */

const iceServers: RTCIceServer[] = [
    // Google STUN (free, works ~85-90% of the time)
    {
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
        ],
    },
];

// Append TURN server if configured via environment variables
const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential,
    });
}

export const rtcConfig: RTCConfiguration = {
    iceServers,
    iceCandidatePoolSize: 2,
};
