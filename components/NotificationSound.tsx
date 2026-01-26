'use client';

import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { config } from '../lib/config';

export const NotificationSound = () => {
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (!user?.id) return;

        // Determine the WebSocket URL
        // Transform http://localhost:8000/api -> ws://localhost:8000/api/copy-trading/ws/notifications/USER_ID
        // We use the copy-trading router prefix we added in main.py
        let wsUrl = '';
        if (config.apiBaseUrl.startsWith('http')) {
            wsUrl = config.apiBaseUrl.replace('http', 'ws') + `/copy-trading/ws/notifications/${user.id}`;
        } else {
            // Absolute path on the same host
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${window.location.host}${config.apiBaseUrl}/copy-trading/ws/notifications/${user.id}`;
        }

        console.log(`Connecting to notifications WebSocket: ${wsUrl}`);
        let socket: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('Notifications WebSocket connected');
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received notification:', data);

                    if (data.type === 'SWAP_SUCCESS') {
                        // Play notification sound
                        const soundFile = data.sound || 'success.mp3';
                        const audio = new Audio(`/sounds/${soundFile}`);
                        audio.play().catch(e => {
                            console.warn("Audio playback failed (usually due to browser's autoplay policy):", e);
                        });
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            socket.onclose = (event) => {
                console.log(`Notifications WebSocket closed: ${event.reason}. Retrying in 5 seconds...`);
                reconnectTimeout = setTimeout(connect, 5000);
            };

            socket.onerror = (error) => {
                console.error('Notifications WebSocket error:', error);
                socket?.close();
            };
        };

        connect();

        return () => {
            if (socket) {
                socket.onclose = null; // Prevent reconnection on intentional unmount
                socket.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, [user?.id]);

    return null;
};
