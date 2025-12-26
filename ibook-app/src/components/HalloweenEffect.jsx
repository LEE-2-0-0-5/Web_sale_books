import React, { useEffect, useState } from 'react';
import './HalloweenEffect.css';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const HalloweenEffect = () => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (enabled) {
            document.body.classList.add('halloween-theme');
        } else {
            document.body.classList.remove('halloween-theme');
        }
        return () => document.body.classList.remove('halloween-theme');
    }, [enabled]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_URL}/settings`);
                if (res.data && res.data.halloween_effect === 'true') {
                    setEnabled(true);
                } else {
                    setEnabled(false);
                }
            } catch (error) {
                console.error("Failed to fetch halloween setting", error);
            }
        };

        fetchSettings();

        const handleSettingsChange = () => fetchSettings();
        window.addEventListener('settingsChange', handleSettingsChange);

        return () => {
            window.removeEventListener('settingsChange', handleSettingsChange);
        };
    }, []);

    if (!enabled) return null;

    return (
        <div className="halloween-container" aria-hidden="true">
            {/* --- HEADER DECORATIONS --- */}

            {/* Left Corner: Haunted House & Pumpkins */}
            <div className="halloween-header-left">
                <img src="/halloween_haunted_house.svg" alt="Haunted House" className="haunted-scene" width="200" height="80" />
            </div>

            {/* Right Corner: Spider Web & Moon */}
            <div className="halloween-header-right">
                <img src="/halloween_spider_web.svg" alt="Spider Web" className="spider-scene" width="150" height="80" />
            </div>

            {/* Flying Witch (Animation) */}
            <div className="witch-fly-container">
                <img src="/halloween_witch.svg" alt="Flying Witch" className="witch-svg" width="100" height="80" />
            </div>

            {/* Falling Pumpkins & Ghosts (Background) */}
            {/* Only a few for ambiance */}
            <div className="halloween-background-item item-1">🎃</div>
            <div className="halloween-background-item item-2">👻</div>
            <div className="halloween-background-item item-3">🦇</div>
            <div className="halloween-background-item item-4">🕸️</div>
            <div className="halloween-background-item item-5">🍬</div>
        </div>
    );
};

export default HalloweenEffect;
