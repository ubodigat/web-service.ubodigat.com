#!/bin/bash
set -e

# =========================
# Root prüfen
# =========================
if [ "$EUID" -ne 0 ]; then
  echo "❌ Dieses Skript muss als root ausgeführt werden."
  exit 1
fi

echo "🔧 Starte automatische Webprojekt-Installation …"

# =========================
# System vorbereiten
# =========================
apt update -y
apt install -y \
  apache2 \
  mariadb-server \
  php \
  libapache2-mod-php \
  php-mysql \
  php-cli \
  php-curl \
  php-zip \
  php-mbstring \
  php-xml \
  unzip \
  curl \
  wget \
  openssl

systemctl enable apache2 mariadb
systemctl start apache2 mariadb

# =========================
# Datenbank automatisch anlegen
# =========================
DB_NAME="webprojekt"
DB_USER="webprojekt_user"
DB_PASS="$(openssl rand -base64 24)"

echo "🗄️ Erstelle Datenbank & Benutzer …"

mysql <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
  IDENTIFIED BY '${DB_PASS}';

GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

# =========================
# Projekt herunterladen
# =========================
echo "📥 Lade Projektvorlage …"

wget -O /tmp/webprojekt-template.zip \
  https://web-service.ubodigat.com/install/webprojekt-template.zip

rm -rf /var/www/html/*
unzip -q /tmp/webprojekt-template.zip -d /var/www/html

# =========================
# DB-Zugang für Setup ablegen
# =========================
cat > /var/www/html/install/.db.env <<EOF
DB_HOST=localhost
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
EOF

chown www-data:www-data /var/www/html/install/.db.env
chmod 600 /var/www/html/install/.db.env

# =========================
# Rechte setzen
# =========================
chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;

systemctl restart apache2

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Basisinstallation abgeschlossen"
echo ""
echo "👉 Öffne im Browser:"
echo "   http://${SERVER_IP}/install/setup.php"
echo ""