export const rtcConfig: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
            ]
        }
    ],
    iceCandidatePoolSize: 2
};
