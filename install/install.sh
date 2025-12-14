set -e

if [ "$EUID" -ne 0 ]; then
  echo "❌ Bitte als root ausführen"
  exit 1
fi

echo "🔧 Starte automatische Installation..."

# 1. Pakete installieren
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
  phpmyadmin

# 2. Dienste starten
systemctl enable apache2 mariadb
systemctl start apache2 mariadb

# 3. WICHTIG: Mod Rewrite aktivieren (für .htaccess Schutz)
a2enmod rewrite
a2enconf phpmyadmin
systemctl restart apache2

echo "📥 Lade Projektdateien..."

# Aufräumen (Standard Apache Seite löschen)
rm -f /var/www/html/index.html

# Download & Entpacken
wget -O /tmp/webprojekt.zip https://web-service.ubodigat.com/install/webprojekt-template.zip
unzip -o /tmp/webprojekt.zip -d /var/www/html

# 4. Config-Ordner vorbereiten (falls nicht im ZIP)
mkdir -p /var/www/html/config

# Rechte setzen
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ BASISINSTALLATION ABGESCHLOSSEN"
echo ""
echo "➡ Setup starten:"
echo "   http://${SERVER_IP}/install/setup.php"
echo ""