#!/bin/bash
set -e

# ==========================================================
# 🔐 Root-Check
# ==========================================================
if [ "$EUID" -ne 0 ]; then
  echo "❌ Bitte als root ausführen"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "🔧 Starte automatische Installation..."

# ==========================================================
# 📦 Variablen
# ==========================================================
DB_NAME="webprojekt"
DB_USER="webprojekt"
DB_PASS="$(openssl rand -base64 24)"

INSTALL_DIR="/var/www/html"
INSTALL_SUBDIR="${INSTALL_DIR}/install"
ENV_FILE="${INSTALL_SUBDIR}/.db.env"

ZIP_URL="https://web-service.ubodigat.com/install/webprojekt-template.zip"
ZIP_TMP="/tmp/webprojekt.zip"

# ==========================================================
# 🧱 System aktualisieren
# ==========================================================
apt update -y
apt upgrade -y

# ==========================================================
# 🐘 phpMyAdmin – Vorkonfiguration (WICHTIG!)
# ==========================================================
echo "⚙️ Konfiguriere phpMyAdmin (non-interactive)..."

echo "phpmyadmin phpmyadmin/dbconfig-install boolean true" | debconf-set-selections
echo "phpmyadmin phpmyadmin/mysql/admin-pass password ${DB_PASS}" | debconf-set-selections
echo "phpmyadmin phpmyadmin/mysql/app-pass password ${DB_PASS}" | debconf-set-selections
echo "phpmyadmin phpmyadmin/app-password-confirm password ${DB_PASS}" | debconf-set-selections
echo "phpmyadmin phpmyadmin/reconfigure-webserver multiselect apache2" | debconf-set-selections

# ==========================================================
# 📦 Pakete installieren
# ==========================================================
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

# ==========================================================
# ▶️ Dienste aktivieren & starten
# ==========================================================
systemctl enable apache2 mariadb
systemctl start apache2 mariadb

# ==========================================================
# 🗄️ Datenbank & Benutzer anlegen
# ==========================================================
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

# ==========================================================
# 🌐 Apache vorbereiten
# ==========================================================
a2enmod rewrite
a2enconf phpmyadmin
systemctl restart apache2

# ==========================================================
# 📥 Projektdateien laden
# ==========================================================
echo "📥 Lade Projektdateien..."

rm -f "${INSTALL_DIR}/index.html"

wget -O "${ZIP_TMP}" "${ZIP_URL}"
unzip -o "${ZIP_TMP}" -d "${INSTALL_DIR}"

# ==========================================================
# 🔐 .db.env schreiben (Single Source of Truth)
# ==========================================================
mkdir -p "${INSTALL_SUBDIR}"

cat > "${ENV_FILE}" <<EOF
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DB_NAME=${DB_NAME}
EOF

chown www-data:www-data "${ENV_FILE}"
chmod 600 "${ENV_FILE}"

# ==========================================================
# 📁 Verzeichnisstruktur & Rechte
# ==========================================================
mkdir -p "${INSTALL_DIR}/config"

chown -R www-data:www-data "${INSTALL_DIR}"
find "${INSTALL_DIR}" -type d -exec chmod 755 {} \;
find "${INSTALL_DIR}" -type f -exec chmod 644 {} \;

chmod 600 "${ENV_FILE}"

# ==========================================================
# ✅ Abschluss
# ==========================================================
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ BASISINSTALLATION ABGESCHLOSSEN"
echo ""
echo "➡ Setup im Browser starten:"
echo "   http://${SERVER_IP}/install/setup.php"
echo ""
echo "🔐 Datenbank-Zugang (intern):"
echo "   DB:   ${DB_NAME}"
echo "   User: ${DB_USER}"
echo "   Pass: (gespeichert in install/.db.env)"
echo ""