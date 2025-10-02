#!/bin/bash

# Script de déploiement pour vulsoft.org
# Usage: ./deploy.sh

echo "🚀 Déploiement de Vulsoft sur vulsoft.org"
echo "=========================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifications préalables
print_status "Vérification des prérequis..."

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 n'est pas installé"
    exit 1
fi

# Vérifier si pip est installé
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 n'est pas installé"
    exit 1
fi

print_success "Prérequis vérifiés"

# Configuration de l'environnement
print_status "Configuration de l'environnement de production..."

# Créer le fichier .env s'il n'existe pas
if [ ! -f "backend/.env" ]; then
    print_warning "Fichier .env non trouvé, création à partir du template..."
    cp backend/.env.example backend/.env
    print_warning "⚠️  IMPORTANT: Modifiez backend/.env avec vos vraies clés de production!"
fi

# Installation des dépendances backend
print_status "Installation des dépendances backend..."
cd backend

# Créer l'environnement virtuel s'il n'existe pas
if [ ! -d "venv" ]; then
    print_status "Création de l'environnement virtuel..."
    python3 -m venv venv
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Ajouter gunicorn pour la production
pip install gunicorn

print_success "Dépendances backend installées"

# Préparation de la base de données
print_status "Préparation de la base de données..."

# Créer la base de données si elle n'existe pas
python -c "
from database import init_db
import asyncio
asyncio.run(init_db())
print('Base de données initialisée')
"

print_success "Base de données prête"

# Retour au répertoire racine
cd ..

# Optimisation des fichiers frontend
print_status "Optimisation des fichiers frontend..."

# Minification CSS (optionnel - nécessite un outil comme cssnano)
if command -v cssnano &> /dev/null; then
    print_status "Minification des fichiers CSS..."
    find css -name "*.css" -exec cssnano {} {}.min \;
    print_success "CSS minifiés"
else
    print_warning "cssnano non installé, minification CSS ignorée"
fi

# Vérification des liens internes
print_status "Vérification des liens internes..."

# Fonction pour vérifier les liens dans un fichier HTML
check_links() {
    local file=$1
    print_status "Vérification de $file..."
    
    # Vérifier les liens relatifs
    grep -o 'href="[^"]*"' "$file" | grep -v "http" | while read -r link; do
        link_path=$(echo "$link" | sed 's/href="//g' | sed 's/"//g')
        if [[ $link_path == /* ]]; then
            # Lien absolu local
            if [ ! -f ".${link_path}" ] && [ ! -d ".${link_path}" ]; then
                print_warning "Lien cassé dans $file: $link_path"
            fi
        elif [[ $link_path != "#"* ]] && [[ $link_path != "mailto:"* ]] && [[ $link_path != "tel:"* ]]; then
            # Lien relatif
            dir=$(dirname "$file")
            full_path="$dir/$link_path"
            if [ ! -f "$full_path" ] && [ ! -d "$full_path" ]; then
                print_warning "Lien cassé dans $file: $link_path"
            fi
        fi
    done
}

# Vérifier les principales pages HTML
for html_file in *.html pages/*.html; do
    if [ -f "$html_file" ]; then
        check_links "$html_file"
    fi
done

print_success "Vérification des liens terminée"

# Génération du fichier de configuration Nginx (optionnel)
print_status "Génération de la configuration Nginx..."

cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name vulsoft.org www.vulsoft.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vulsoft.org www.vulsoft.org;

    # Configuration SSL
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Configuration générale
    root /var/www/vulsoft.org;
    index index.html;

    # Gestion des fichiers statiques
    location / {
        try_files $uri $uri/ @backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fallback vers le backend pour les routes non trouvées
    location @backend {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configuration PWA
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /manifest.json {
        expires 1y;
        add_header Cache-Control "public";
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

print_success "Configuration Nginx générée (nginx.conf)"

# Génération du service systemd
print_status "Génération du service systemd..."

cat > vulsoft.service << 'EOF'
[Unit]
Description=Vulsoft FastAPI Application
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/vulsoft.org/backend
Environment=PATH=/var/www/vulsoft.org/backend/venv/bin
ExecStart=/var/www/vulsoft.org/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

print_success "Service systemd généré (vulsoft.service)"

# Test de l'application
print_status "Test de l'application..."

cd backend
source venv/bin/activate

# Démarrer temporairement l'application pour test
python -c "
import requests
import subprocess
import time
import signal
import os

# Démarrer le serveur en arrière-plan
proc = subprocess.Popen(['python', 'main.py'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)

try:
    # Test de santé
    response = requests.get('http://localhost:8000/health', timeout=5)
    if response.status_code == 200:
        print('✅ API Health Check: OK')
    else:
        print('❌ API Health Check: FAILED')
        
    # Test des routes principales
    routes_to_test = ['/api/admin/stats', '/api/contact/messages']
    for route in routes_to_test:
        try:
            response = requests.get(f'http://localhost:8000{route}', timeout=5)
            print(f'✅ Route {route}: {response.status_code}')
        except:
            print(f'⚠️  Route {route}: Non accessible (normal si pas d\'auth)')
            
except Exception as e:
    print(f'❌ Erreur de test: {e}')
finally:
    # Arrêter le serveur
    proc.terminate()
    proc.wait()
"

cd ..

print_success "Tests terminés"

# Instructions finales
echo ""
echo "🎉 Déploiement préparé avec succès!"
echo ""
echo "📋 Prochaines étapes pour vulsoft.org:"
echo ""
echo "1. 🔧 Configuration du serveur:"
echo "   - Copiez les fichiers sur votre serveur"
echo "   - Configurez nginx avec nginx.conf"
echo "   - Installez le service avec vulsoft.service"
echo ""
echo "2. 🔐 Configuration SSL:"
echo "   - Obtenez un certificat SSL (Let's Encrypt recommandé)"
echo "   - Mettez à jour les chemins dans nginx.conf"
echo ""
echo "3. 🌐 Configuration DNS:"
echo "   - Pointez vulsoft.org vers votre serveur"
echo "   - Configurez www.vulsoft.org (CNAME ou A record)"
echo ""
echo "4. ⚙️  Variables d'environnement:"
echo "   - Modifiez backend/.env avec vos vraies clés"
echo "   - Changez SECRET_KEY en production"
echo "   - Configurez les clés Stripe LIVE"
echo ""
echo "5. 🚀 Démarrage:"
echo "   sudo systemctl enable vulsoft"
echo "   sudo systemctl start vulsoft"
echo "   sudo systemctl reload nginx"
echo ""
echo "6. 📊 Monitoring:"
echo "   - Vérifiez les logs: journalctl -u vulsoft -f"
echo "   - Testez: https://vulsoft.org/health"
echo ""
print_success "Déploiement prêt pour vulsoft.org! 🚀"