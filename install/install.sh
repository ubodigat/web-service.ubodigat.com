#!/bin/bash

# 🛡️ Root-Rechte prüfen
if [ "$EUID" -ne 0 ]; then
  echo "❌ Dieses Skript muss als root ausgeführt werden."
  exit 1
fi

echo "🔧 Starte automatische Webserver-Installation..."

# 🔄 Paketlisten aktualisieren
apt update && apt upgrade -y

# 📦 Apache, PHP, MariaDB und phpMyAdmin installieren
apt install -y apache2 php libapache2-mod-php php-mysql mariadb-server unzip curl wget php-cli php-curl php-zip php-mbstring php-xml phpmyadmin

# 🔐 MariaDB sichern
mysql_secure_installation

# 📁 Zielverzeichnis erstellen
mkdir -p /var/www/html

# 🌐 Projekt-ZIP herunterladen
echo "📥 Lade Projektvorlage herunter..."
wget -O /tmp/webprojekt-template.zip https://web-service.ubodigat.com/install/webprojekt-template.zip

# 📦 Entpacken
unzip -o /tmp/webprojekt-template.zip -d /var/www/html

# 🔐 Setup-Datei vorbereiten
cp /var/www/html/filemanager/config.sample.php /var/www/html/filemanager/config.php
cp /var/www/html/projekt/config.sample.php /var/www/html/projekt/config.php

# 📂 Berechtigungen
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 🔁 Apache neustarten
systemctl restart apache2

# 🧠 Info
echo "✅ Die Basisinstallation ist abgeschlossen."
echo ""
echo "👉 Bitte rufe im Browser folgende Seite auf, um die Einrichtung abzuschließen:"
echo "     http://<SERVER-IP>/install/setup.php"