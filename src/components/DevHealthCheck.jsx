import { useEffect, useState } from 'react';
import axios from 'axios';

const DevHealthCheck = () => {
    const [state, setState] = useState({
        loading: true,
        success: false,
        data: null,
        error: null,
        responseTime: null,
    });

    useEffect(() => {
        const checkHealth = async () => {
            const startTime = Date.now();
            // Use relative URL for Vite proxy
            const healthUrl = '/api/health';

            try {
                console.info('[API] Request', { method: 'GET', url: healthUrl });
                const response = await axios.get(healthUrl);
                const responseTime = Date.now() - startTime;
                console.info('[API] Response', {
                    url: healthUrl,
                    status: response.status,
                    data: response.data,
                });

                setState({
                    loading: false,
                    success: true,
                    data: response.data,
                    error: null,
                    responseTime,
                });
            } catch (err) {
                const responseTime = Date.now() - startTime;
                const status = err.response?.status || 500;
                const message = err.message || 'Unknown error';
                console.error('[API] Error', { url: healthUrl, status, message });

                setState({
                    loading: false,
                    success: false,
                    data: null,
                    error: message,
                    responseTime,
                });
            }
        };

        checkHealth();
    }, []);

    if (state.loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                    <h2 className="text-2xl font-bold mb-4">Dev Health Check</h2>
                    <p className="text-gray-600">Checking backend connectivity...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-6">Dev Health Check</h2>

                <div className={`p-6 rounded-lg mb-6 ${state.success
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-red-50 border-2 border-red-200'
                    }`}>
                    <h3 className="text-xl font-semibold mb-4">
                        {state.success ? 'Backend Connected' : 'Connection Failed'}
                    </h3>

                    {state.success && state.data && (
                        <div className="space-y-2 text-sm">
                            <p><strong>Status:</strong> {state.data.status}</p>
                            <p><strong>Service:</strong> {state.data.service || 'N/A'}</p>
                            <p><strong>Timestamp:</strong> {state.data.timestamp}</p>
                            <p><strong>Response Time:</strong> {state.responseTime}ms</p>
                        </div>
                    )}

                    {!state.success && (
                        <div className="space-y-2 text-sm">
                            <p><strong>Error:</strong> {state.error}</p>
                            <p><strong>Response Time:</strong> {state.responseTime}ms</p>
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-xs text-gray-700">
                                    <strong>Make sure the backend is running:</strong><br />
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        $env:JAVA_HOME='C:\Program Files\Java\jdk-17'; $env:SPRING_PROFILES_ACTIVE='dev'; .\mvnw.cmd spring-boot:run
                                    </code>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
                    <p><strong>Backend URL:</strong> (via Vite proxy to localhost:8080)</p>
                    <p><strong>Health Endpoint:</strong> /api/health</p>
                    <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to App
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DevHealthCheck;
