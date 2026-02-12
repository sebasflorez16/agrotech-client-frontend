#!/bin/bash
# ==========================================================
# AgroTech - Cambiar entre entorno LOCAL y PRODUCCIÓN
# ==========================================================
# Uso:
#   ./scripts/switch-env.sh local   → desarrollo local
#   ./scripts/switch-env.sh prod    → restaurar producción (para git push)
#   ./scripts/switch-env.sh status  → ver estado actual
#
# CÓMO FUNCIONA:
#   - netlify.toml en git = SIEMPRE PRODUCCIÓN (apunta a Railway)
#   - Para local: se sobrescribe con netlify-local.toml (gitignored)
#   - Para prod:  se restaura con git checkout (la versión del repo)
#   - NUNCA se sube la config local a git
# ==========================================================

set -e
FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "$1" in
  local)
    if [ ! -f "$FRONTEND_DIR/netlify-local.toml" ]; then
      echo "❌ Error: netlify-local.toml no existe."
      echo "   Créalo primero (ver README-LOCAL-DEV.md)"
      exit 1
    fi
    cp "$FRONTEND_DIR/netlify-local.toml" "$FRONTEND_DIR/netlify.toml"
    echo ""
    echo "✅ Configurado para LOCAL"
    echo "   Backend  → localhost:8000"
    echo "   Frontend → localhost:8080"
    echo ""
    echo "   Para iniciar:"
    echo "   1. Backend:  cd ../agrotech-digital && python manage.py runserver"
    echo "   2. Frontend: cd $FRONTEND_DIR && npx netlify dev"
    echo ""
    ;;
  prod|production)
    cd "$FRONTEND_DIR"
    git checkout -- netlify.toml 2>/dev/null || {
      echo "⚠️  No se pudo restaurar desde git. Verificando si ya es producción..."
    }
    if grep -q "localhost:8000" "$FRONTEND_DIR/netlify.toml" 2>/dev/null; then
      echo "❌ Error: netlify.toml aún tiene config local. Restaura manualmente."
      exit 1
    fi
    echo ""
    echo "✅ Configurado para PRODUCCIÓN"
    echo "   Backend  → Railway (agrotech-digital-production.up.railway.app)"
    echo "   Frontend → Netlify"
    echo ""
    echo "   Listo para: git add . && git commit && git push"
    echo ""
    ;;
  status)
    echo ""
    if grep -q "localhost:8000" "$FRONTEND_DIR/netlify.toml" 2>/dev/null; then
      echo "📍 Estado actual: LOCAL (API → localhost:8000)"
      echo "   ⚠️  NO hagas git push en este estado"
    else
      echo "📍 Estado actual: PRODUCCIÓN (API → Railway)"
      echo "   ✅ Seguro para git push"
    fi
    echo ""
    ;;
  *)
    echo ""
    echo "🍎 AgroTech - Cambio de Entorno"
    echo "================================"
    echo "Uso: $0 {local|prod|status}"
    echo ""
    echo "  local   - Configura para desarrollo local (backend localhost:8000)"
    echo "  prod    - Restaura configuración de producción (para git push)"
    echo "  status  - Muestra en qué entorno estás"
    echo ""
    exit 1
    ;;
esac
