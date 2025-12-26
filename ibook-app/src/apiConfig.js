const getBaseUrl = () => {
    const { hostname } = window.location;
    return `http://${hostname}:3001`;
};

export const API_BASE_URL = getBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
