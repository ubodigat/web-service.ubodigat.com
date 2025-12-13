#!/bin/bash
set -e

# 🛡️ Root-Rechte prüfen
if [ "$EUID" -ne 0 ]; then
  echo "❌ Dieses Skript muss als root ausgeführt werden."
  exit 1
fi

echo "🔧 Starte automatische Webserver-Installation..."

# 🔄 Paketlisten aktualisieren (KEIN upgrade!)
apt update -y

# 📦 Apache, PHP, MariaDB, phpMyAdmin (non-interactive)
export DEBIAN_FRONTEND=noninteractive

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
  phpmyadmin

# 🔐 MariaDB absichern (non-interactive)
mysql -e "DELETE FROM mysql.user WHERE User='';"
mysql -e "DROP DATABASE IF EXISTS test;"
mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
mysql -e "FLUSH PRIVILEGES;"

# 🔧 Apache vorbereiten
a2enmod rewrite
sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf
sed -i 's/DirectoryIndex .*/DirectoryIndex index.php index.html/' /etc/apache2/mods-enabled/dir.conf

# 📁 Webroot
mkdir -p /var/www/html

# 🌐 Projekt laden
echo "📥 Lade Projektvorlage herunter..."
wget -O /tmp/webprojekt-template.zip \
  https://web-service.ubodigat.com/install/webprojekt-template.zip

# 📦 Entpacken
unzip -oq /tmp/webprojekt-template.zip -d /var/www/html

# ⚙️ Konfigurationsvorlagen
cp /var/www/html/filemanager/config.sample.php /var/www/html/filemanager/config.php
cp /var/www/html/projekt/config.sample.php /var/www/html/projekt/config.php

# 🔐 Rechte setzen
chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;

# 🔁 Apache neu starten
systemctl restart apache2

# 🌍 IP anzeigen
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Die Basisinstallation ist abgeschlossen."
echo ""
echo "👉 Bitte rufe im Browser folgende Seite auf, um die Einrichtung abzuschließen:"
echo ""
echo "    http://${SERVER_IP}/install/setup.php"
echo ""