import React, { useEffect, useState } from 'react';
import './SnowEffect.css';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const SnowEffect = () => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (enabled) {
            document.body.classList.add('noel-theme');
        } else {
            document.body.classList.remove('noel-theme');
        }
        return () => document.body.classList.remove('noel-theme');
    }, [enabled]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_URL}/settings`);
                if (res.data && res.data.snow_effect === 'true') {
                    setEnabled(true);
                } else {
                    setEnabled(false);
                }
            } catch (error) {
                console.error("Failed to fetch snow setting", error);
            }
        };

        fetchSettings();

        // Optional: Polling to update effect in real-time without refresh?
        // Or just load once. Let's stick to load once or maybe slow poll.
        // For user experience, usually load once is fine.
    }, []);

    if (!enabled) return null;

    return (
        <div className="snow-container" aria-hidden="true">
            <div className="snowflake">❅</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❄</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❄</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
        </div>
    );
};

export default SnowEffect;
