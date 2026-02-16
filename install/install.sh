#!/bin/bash
set -euo pipefail

# ==========================================================
# 🔐 Root-Check
# ==========================================================
if [ "$EUID" -ne 0 ]; then
  echo "❌ Bitte als root ausführen"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "🔧 Starte automatische Installation (Stabilitätsmodus)..."

# ==========================================================
# 📦 Konfiguration
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
# 🧱 System aktualisieren (OHNE Upgrade)
# ==========================================================
echo "📦 Aktualisiere Paketlisten..."
apt update -y

# ==========================================================
# 🐘 phpMyAdmin – Non-Interactive Preseed
# ==========================================================
echo "⚙️ Konfiguriere phpMyAdmin (non-interactive)..."

debconf-set-selections <<EOF
phpmyadmin phpmyadmin/dbconfig-install boolean true
phpmyadmin phpmyadmin/mysql/admin-pass password ${DB_PASS}
phpmyadmin phpmyadmin/mysql/app-pass password ${DB_PASS}
phpmyadmin phpmyadmin/app-password-confirm password ${DB_PASS}
phpmyadmin phpmyadmin/reconfigure-webserver multiselect apache2
EOF

# ==========================================================
# 📦 Pakete installieren
# ==========================================================
echo "📦 Installiere Systempakete..."

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
echo "▶️ Starte Dienste..."
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
echo "🌐 Konfiguriere Apache..."
a2enmod rewrite
a2enconf phpmyadmin
systemctl restart apache2

# ==========================================================
# 📥 Projektdateien laden
# ==========================================================
echo "📥 Lade Projektdateien..."

rm -f "${INSTALL_DIR}/index.html"

if ! wget -q -O "${ZIP_TMP}" "${ZIP_URL}"; then
  echo "❌ Download fehlgeschlagen: ${ZIP_URL}"
  exit 1
fi

if ! unzip -oq "${ZIP_TMP}" -d "${INSTALL_DIR}"; then
  echo "❌ ZIP-Datei konnte nicht entpackt werden"
  exit 1
fi

# ==========================================================
# 🔍 Struktur prüfen
# ==========================================================
if [ ! -f "${INSTALL_DIR}/install/setup.php" ]; then
  echo "❌ setup.php fehlt – ZIP-Struktur fehlerhaft"
  exit 1
fi

# ==========================================================
# 🔐 .db.env schreiben (Single Source of Truth)
# ==========================================================
echo "🔐 Erstelle .db.env..."

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
# 📁 Rechte & Struktur
# ==========================================================
echo "📁 Setze Dateirechte..."

mkdir -p "${INSTALL_DIR}/config"

chown -R www-data:www-data "${INSTALL_DIR}"

find "${INSTALL_DIR}" -type d -exec chmod 755 {} \;
find "${INSTALL_DIR}" -type f -exec chmod 644 {} \;

chmod 600 "${ENV_FILE}"

# ==========================================================
# ✅ Abschluss & Zusammenfassung
# ==========================================================
SERVER_IP="$(hostname -I | awk '{print $1}')"

# Farben für die Konsole
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "=========================================================="
echo "      ✅ BASISINSTALLATION ERFOLGREICH ABGESCHLOSSEN      "
echo "=========================================================="
echo -e "${NC}"

echo -e "${BLUE}🌐 WEB-ZUGANG:${NC}"
echo -e "  ➡ ${CYAN}Projekt-Landingpage:${NC}  http://${SERVER_IP}/"
echo -e "  ➡ ${YELLOW}Setup starten (Wichtig):${NC} http://${SERVER_IP}/install/setup.php"
echo ""

echo -e "${BLUE}🗄️ DATENBANK-VERWALTUNG:${NC}"
echo -e "  ➡ ${CYAN}phpMyAdmin:${NC}           http://${SERVER_IP}/phpmyadmin"
echo -e "    ${NC}Login via DB_USER:     ${DB_USER}"
echo ""

# Automatischer Check für Dateimanager im Verzeichnis
FM_URL="Nicht gefunden"
if [ -d "${INSTALL_DIR}/filemanager" ]; then FM_URL="http://${SERVER_IP}/filemanager"; fi
if [ -f "${INSTALL_DIR}/fm.php" ]; then FM_URL="http://${SERVER_IP}/fm.php"; fi
if [ -d "${INSTALL_DIR}/vendor" ]; then FM_URL="http://${SERVER_IP}/ (via Dashboard)"; fi

echo -e "${BLUE}📁 DATEI-VERWALTUNG:${NC}"
echo -e "  ➡ ${CYAN}Dateimanager:${NC}          ${FM_URL}"
echo ""

echo -e "${BLUE}🔐 INTERNE DATENBANK-LOGINS:${NC}"
echo -e "  ➡ ${NC}Datenbank:${NC}          ${DB_NAME}"
echo -e "  ➡ ${NC}Benutzer:${NC}           ${DB_USER}"
echo -e "  ➡ ${NC}Passwort:${NC}           ${DB_PASS}"
echo ""

echo -e "${YELLOW}ℹ️  WICHTIGER HINWEIS:${NC}"
echo "Das Setup im Browser muss einmalig ausgeführt werden, um die"
echo "Administrator-Zugänge zu setzen. Danach wird .db.env gelöscht."
echo "----------------------------------------------------------"
echo ""