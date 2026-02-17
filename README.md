# 🌐 web-service.ubodigat.com

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-Apache%20License%202.0-green)
![Platform](https://img.shields.io/badge/platform-Ubuntu%20%7C%20Debian-orange.svg)

**Ein leistungsstarker, automatisierter Webserver-Stack mit Datenbank und integriertem Web-Dateimanager – optimiert für Schnelligkeit und Benutzerfreundlichkeit.**

---

## 🚀 Das Konzept

Die Grundidee dieses Projekts ist die radikale Vereinfachung der Server-Einrichtung. Mit nur einem Befehl verwandelst du einen frischen Ubuntu/Debian-Server in eine voll funktionsfähige Web-Umgebung inklusive:

*   **Apache2 Webserver**: Vorkonfiguriert und optimiert.
*   **MariaDB Datenbank**: Sicher eingerichtet inklusive Verwaltungstool.
*   **Web-Dateimanager**: Verwaltung deiner Dateien direkt im Browser.
*   **phpMyAdmin**: Volle Kontrolle über deine Datenbanken.
*   **Modernes Setup**: Ein intuitives Web-Interface für die finale Konfiguration.

---

## 🛠️ Installation

Du benötigst lediglich einen SSH-Zugang zu deinem Server. Kopiere den folgenden Block und füge ihn in dein Terminal ein:

```bash
wget -O install.sh https://web-service.ubodigat.com/install/install.sh && \
chmod +x install.sh && \
./install.sh
```

---

## ✨ Highlights

### 🎨 Modernes Dashboard
Nach der Installation erwartet dich ein elegantes Setup-Interface im Darkmode-Design. Hier konfigurierst du Passwörter, Administrator-Accounts und sogar das Design deiner Login-Seiten.

### 📁 Datei-Verwaltung 2.0
Kein FTP/SFTP mehr nötig. Der integrierte Dateimanager ermöglicht es dir, Dateien hochzuladen, direkt im Browser zu bearbeiten (Monaco Editor Integration) und Verzeichnisse zu verwalten.

### 🔐 Layered Security
*   Automatisierter MariaDB Secure-Install.
*   Optionaler Passwortschutz für die gesamte Webseite.
*   Timeout-gesteuerte Sessions für den Dateimanager.

---

## 🛠 Entfaltung des Templates

Das System nutzt ein vorkonfiguriertes Template (`webprojekt-template`), welches bei der Installation automatisch entpackt und personalisiert wird. Dies beinhaltet bereits eine Demo-Datenbank mit Beispielinhalten, damit du sofort loslegen kannst.

---

## 📄 Lizenz

Dieses Projekt ist unter der **Apache License 2.0** lizenziert. Weitere Informationen findest du in der [LICENSE](LICENSE) Datei.

---

<p align="center">
  Entwickelt mit ❤️ von <a href="https://ubodigat.com">ubodigat.com</a>
</p>