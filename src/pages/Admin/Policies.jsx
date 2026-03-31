import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

export default function AdminPolicies() {
    const { t } = useTranslation(["admin", "common"]);
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
                                {t("admin:policies.title")}
                            </h1>
                            <p className="text-muted-foreground">
                                {t("admin:policies.subtitle")}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            {t("admin:policies.create")}
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-center text-muted-foreground py-12">
                            <div className="text-6xl mb-4 font-bold">P</div>
                            <p className="text-lg font-medium mb-2">{t("admin:policies.emptyTitle")}</p>
                            <p className="text-sm">{t("admin:policies.emptyHint")}</p>
                            <p className="text-xs mt-2 text-yellow-600">TODO_BACKEND: GET /api/policies</p>
                        </div>
                    </div>

                    {showCreateModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-bold text-foreground mb-4">{t("admin:policies.createTitle")}</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t("admin:policies.name")}</label>
                                        <input
                                            type="text"
                                            value={newPolicy.name}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                                            placeholder={t("admin:policies.placeholders.name")}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t("admin:policies.description")}</label>
                                        <textarea
                                            value={newPolicy.description}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                                            rows={3}
                                            placeholder={t("admin:policies.placeholders.description")}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t("admin:policies.rules")}</label>
                                        <textarea
                                            value={newPolicy.rules}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, rules: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-sm"
                                            rows={4}
                                            placeholder={t("admin:policies.placeholders.rules")}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                                    >
                                        {t("common:actions.cancel")}
                                    </button>
                                    <button
                                        onClick={handleCreatePolicy}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {t("common:actions.create")}
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
