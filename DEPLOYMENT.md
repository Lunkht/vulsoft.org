# 🚀 Guide de Déploiement - vulsoft.org

Ce guide vous accompagne pour déployer le site Vulsoft sur **vulsoft.org** et **www.vulsoft.org**.

## 📋 Prérequis

### Serveur
- Ubuntu 20.04+ ou CentOS 8+
- Python 3.8+
- Nginx
- Certificat SSL (Let's Encrypt recommandé)
- Nom de domaine configuré

### Accès
- Accès SSH au serveur
- Droits sudo
- Accès aux DNS du domaine

## 🔧 Installation Étape par Étape

### 1. Préparation du Serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y python3 python3-pip python3-venv nginx git certbot python3-certbot-nginx

# Création de l'utilisateur (optionnel)
sudo useradd -m -s /bin/bash vulsoft
sudo usermod -aG sudo vulsoft
```

### 2. Configuration du Domaine

```bash
# Vérifier que le domaine pointe vers votre serveur
dig vulsoft.org
dig www.vulsoft.org

# Les deux doivent retourner l'IP de votre serveur
```

### 3. Déploiement des Fichiers

```bash
# Se connecter au serveur
ssh user@your-server-ip

# Cloner ou copier les fichiers
sudo mkdir -p /var/www/vulsoft.org
sudo chown -R $USER:$USER /var/www/vulsoft.org

# Copier tous les fichiers du projet dans /var/www/vulsoft.org/
# (via scp, rsync, git clone, etc.)

cd /var/www/vulsoft.org
```

### 4. Configuration du Backend

```bash
# Aller dans le dossier backend
cd /var/www/vulsoft.org/backend

# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
pip install gunicorn

# Configurer les variables d'environnement
cp .env.example .env
nano .env  # Modifier avec vos vraies valeurs
```

### 5. Configuration de la Base de Données

```bash
# Initialiser la base de données
cd /var/www/vulsoft.org/backend
source venv/bin/activate

python -c "
from database import init_db
import asyncio
asyncio.run(init_db())
print('Base de données initialisée')
"

# Créer le premier administrateur
python create_admin.py
```

### 6. Configuration du Service Systemd

```bash
# Copier le fichier de service
sudo cp /var/www/vulsoft.org/vulsoft.service /etc/systemd/system/

# Modifier les chemins si nécessaire
sudo nano /etc/systemd/system/vulsoft.service

# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable vulsoft
sudo systemctl start vulsoft

# Vérifier le statut
sudo systemctl status vulsoft
```

### 7. Configuration SSL avec Let's Encrypt

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d vulsoft.org -d www.vulsoft.org

# Le certificat sera automatiquement configuré dans Nginx
# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

### 8. Configuration Nginx

```bash
# Copier la configuration
sudo cp /var/www/vulsoft.org/nginx.conf /etc/nginx/sites-available/vulsoft.org

# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/vulsoft.org /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 9. Configuration des Permissions

```bash
# Définir les bonnes permissions
sudo chown -R www-data:www-data /var/www/vulsoft.org
sudo chmod -R 755 /var/www/vulsoft.org

# Permissions spéciales pour les fichiers sensibles
sudo chmod 600 /var/www/vulsoft.org/backend/.env
sudo chmod 644 /var/www/vulsoft.org/backend/vulsoft.db
```

## 🔍 Vérification du Déploiement

### Tests Automatiques

```bash
# Utiliser le script de vérification
cd /var/www/vulsoft.org
python3 check-production.py --url https://vulsoft.org
```

### Tests Manuels

1. **Site Web** : https://vulsoft.org
2. **API Health** : https://vulsoft.org/health
3. **PWA** : Installer l'app depuis le navigateur
4. **SSL** : Vérifier le cadenas vert
5. **Redirections** : http://vulsoft.org → https://vulsoft.org

### Vérifications Importantes

```bash
# Logs du service
sudo journalctl -u vulsoft -f

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Statut des services
sudo systemctl status vulsoft
sudo systemctl status nginx

# Test de l'API
curl -I https://vulsoft.org/health
```

## 🔧 Configuration des Variables d'Environnement

### Variables Critiques à Modifier

```bash
# Dans /var/www/vulsoft.org/backend/.env

# OBLIGATOIRE : Changer la clé secrète
SECRET_KEY="VOTRE_NOUVELLE_CLE_SUPER_SECRETE_ICI"

# Email de contact
MAIL_USERNAME="contact@vulsoft.org"
MAIL_FROM="contact@vulsoft.org"

# Clés Stripe LIVE (pas de test!)
STRIPE_PUBLIC_KEY="pk_live_VOTRE_CLE"
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE"

# OAuth avec les bonnes URLs de callback
GOOGLE_REDIRECT_URI="https://vulsoft.org/auth/google/callback"
GITHUB_REDIRECT_URI="https://vulsoft.org/auth/github/callback"
```

## 🛡️ Sécurité

### Firewall

```bash
# Configuration UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Sauvegardes

```bash
# Script de sauvegarde quotidienne
sudo crontab -e

# Ajouter cette ligne pour sauvegarder à 2h du matin
0 2 * * * /usr/bin/rsync -av /var/www/vulsoft.org/ /backup/vulsoft-$(date +\%Y\%m\%d)/
```

### Monitoring

```bash
# Installer htop pour le monitoring
sudo apt install htop

# Surveiller les ressources
htop

# Surveiller les logs en temps réel
sudo journalctl -u vulsoft -f
```

## 🚀 Mise en Production

### Checklist Finale

- [ ] Domaine configuré et accessible
- [ ] SSL activé et fonctionnel
- [ ] Service backend démarré
- [ ] Nginx configuré et redémarré
- [ ] Base de données initialisée
- [ ] Administrateur créé
- [ ] Variables d'environnement configurées
- [ ] Tests automatiques passés
- [ ] Sauvegardes configurées
- [ ] Monitoring en place

### Commandes de Maintenance

```bash
# Redémarrer l'application
sudo systemctl restart vulsoft

# Voir les logs
sudo journalctl -u vulsoft --since "1 hour ago"

# Mettre à jour l'application
cd /var/www/vulsoft.org
git pull  # si utilisation de git
sudo systemctl restart vulsoft

# Renouveler SSL
sudo certbot renew
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs : `sudo journalctl -u vulsoft -f`
2. Testez l'API : `curl https://vulsoft.org/health`
3. Vérifiez Nginx : `sudo nginx -t`
4. Contactez l'équipe Vulsoft : contact@vulsoft.org

## 🎉 Félicitations !

Votre site Vulsoft est maintenant en ligne sur **https://vulsoft.org** ! 🚀

N'oubliez pas de :
- Configurer Google Analytics
- Soumettre le sitemap à Google Search Console
- Tester les fonctionnalités PWA
- Surveiller les performances