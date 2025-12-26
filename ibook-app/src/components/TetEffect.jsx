import React, { useEffect, useState } from 'react';
import './TetEffect.css';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const TetEffect = () => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (enabled) {
            document.body.classList.add('tet-theme');
        } else {
            document.body.classList.remove('tet-theme');
        }
        return () => document.body.classList.remove('tet-theme');
    }, [enabled]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_URL}/settings`); // Use API_URL
                // Check for 'tet_effect' key
                if (res.data && res.data.tet_effect === 'true') {
                    setEnabled(true);
                } else {
                    setEnabled(false);
                }
            } catch (error) {
                console.error("Failed to fetch tet setting", error);
            }
        };

        fetchSettings();
    }, []);

    if (!enabled) return null;

    // Mix of flowers and lucky items
    return (
        <div className="tet-container" aria-hidden="true">
            <div className="tet-flower">🌸</div>
            <div className="tet-flower">🌼</div>
            <div className="tet-flower">🌸</div>
            <div className="tet-flower">🧧</div>
            <div className="tet-flower">🌼</div>
            <div className="tet-flower">🌸</div>
            <div className="tet-flower">💰</div>
            <div className="tet-flower">🌼</div>
            <div className="tet-flower">🌸</div>
            <div className="tet-flower">🧧</div>
            <div className="tet-flower">🌼</div>
            <div className="tet-flower">🌸</div>
            <div className="tet-flower">💰</div>
            <div className="tet-flower">🌼</div>
            <div className="tet-flower">🌼</div>
        </div>
    );
};

export default TetEffect;
