import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { t } = useTranslation(["common"]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">🚫</div>

        <h1 className="text-2xl font-extrabold text-destructive mb-2 tracking-tight">
          {t("common:unauthorized.title")}
        </h1>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {t("common:unauthorized.description")}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="h-8 px-4 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded transition-colors"
          >
            {t("common:actions.backToHome")}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="h-8 px-4 text-xs font-semibold text-foreground bg-background hover:bg-accent border border-border rounded transition-colors"
          >
            {t("common:actions.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
