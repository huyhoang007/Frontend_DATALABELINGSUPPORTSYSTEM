import React, { useState } from 'react';

export default function AdminPolicies() {
    const [policies, setPolicies] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPolicy, setNewPolicy] = useState({
        name: '',
        description: '',
        rules: ''
    });

    const handleCreatePolicy = async () => {
        // TODO_BACKEND: Implement policy creation API
        console.log('Create policy:', newPolicy);
        setShowCreateModal(false);
    };

    return (
        <div className="flex h-screen bg-background">
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                📋 Policy Management
                            </h1>
                            <p className="text-muted-foreground">
                                Configure global policies and rules
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            ➕ Create Policy
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-center text-muted-foreground py-12">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-lg font-medium mb-2">No policies configured</p>
                            <p className="text-sm">Policy management API integration pending</p>
                            <p className="text-xs mt-2 text-yellow-600">TODO_BACKEND: GET /api/policies</p>
                        </div>
                    </div>

                    {showCreateModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-bold text-foreground mb-4">Create New Policy</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Policy Name</label>
                                        <input
                                            type="text"
                                            value={newPolicy.name}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                                            placeholder="e.g., Quality Assurance Policy"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                                        <textarea
                                            value={newPolicy.description}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                                            rows={3}
                                            placeholder="Describe the policy purpose..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">Rules (JSON)</label>
                                        <textarea
                                            value={newPolicy.rules}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, rules: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-sm"
                                            rows={4}
                                            placeholder='{"minAnnotations": 3, "requireReview": true}'
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreatePolicy}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>

                                <p className="text-xs text-yellow-600 mt-4">TODO_BACKEND: POST /api/policies</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
