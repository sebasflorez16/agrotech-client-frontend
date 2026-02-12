#!/bin/bash
# Pre-commit hook: Protege contra subir config local de Netlify
# Instalación: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

if grep -q "localhost:8000" netlify.toml 2>/dev/null; then
  echo ""
  echo "🚫 BLOQUEADO: netlify.toml tiene configuración LOCAL"
  echo ""
  echo "   Antes de hacer commit, ejecuta:"
  echo "   ./scripts/switch-env.sh prod"
  echo ""
  exit 1
fi
