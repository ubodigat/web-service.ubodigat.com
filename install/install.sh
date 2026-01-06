#!/bin/bash
set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Bitte als root ausführen"
  exit 1
fi

echo "🔧 Starte automatische Installation..."

# -----------------------------
# Variablen
# -----------------------------
DB_NAME="webprojekt"
DB_USER="webprojekt"
DB_PASS="$(openssl rand -base64 18)"

INSTALL_DIR="/var/www/html"
ENV_FILE="${INSTALL_DIR}/install/.db.env"

# -----------------------------
# 1. Pakete installieren
# -----------------------------
apt update && apt upgrade -y
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
  openssl \
  phpmyadmin

# -----------------------------
# 2. Dienste starten
# -----------------------------
systemctl enable apache2 mariadb
systemctl start apache2 mariadb

# -----------------------------
# 3. Datenbank automatisch anlegen
# -----------------------------
echo "🗄️ Erstelle Datenbank & Benutzer..."

mysql <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
  IDENTIFIED BY '${DB_PASS}';

GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.*
  TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;
EOF

# -----------------------------
# 4. Apache vorbereiten
# -----------------------------
a2enmod rewrite
a2enconf phpmyadmin
systemctl restart apache2

# -----------------------------
# 5. Projektdateien laden
# -----------------------------
echo "📥 Lade Projektdateien..."

rm -f /var/www/html/index.html

wget -O /tmp/webprojekt.zip \
  https://web-service.ubodigat.com/install/webprojekt-template.zip

unzip -o /tmp/webprojekt.zip -d /var/www/html

# -----------------------------
# 6. .db.env schreiben (JETZT)
# -----------------------------
mkdir -p /var/www/html/install

cat > "${ENV_FILE}" <<EOF
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DB_NAME=${DB_NAME}
EOF

chown www-data:www-data "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

# -----------------------------
# 7. Rechte setzen
# -----------------------------
mkdir -p /var/www/html/config
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# -----------------------------
# 8. Abschluss
# -----------------------------
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ BASISINSTALLATION ABGESCHLOSSEN"
echo ""
echo "➡ Setup im Browser starten:"
echo "   http://${SERVER_IP}/install/setup.php"
echo ""