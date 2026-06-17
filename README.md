# web-service.ubodigat.com

![Version](https://img.shields.io/badge/version-1.7.1-blue.svg)
![License](https://img.shields.io/badge/license-Apache%20License%202.0-green)
![Platform](https://img.shields.io/badge/platform-Ubuntu%20%7C%20Debian-orange.svg)
![Stack](https://img.shields.io/badge/stack-Apache%20%7C%20PHP%20%7C%20MariaDB-lightgrey.svg)

**web-service** ist ein Open-Source-Webserver-Stack für Ubuntu/Debian. Ein Installationsskript richtet Apache, PHP, MariaDB, phpMyAdmin, Web-Dateimanager, Admin-Panel, Benutzerverwaltung, Rollen/Rechte, 2FA/TOTP, Media-Viewer, Versionscheck und One-Click-Updates automatisch ein.

Website: [https://web-service.ubodigat.com/](https://web-service.ubodigat.com/)  
GitHub: [https://github.com/ubodigat/web-service.ubodigat.com](https://github.com/ubodigat/web-service.ubodigat.com)

---

## Aktuelle Webseiten-Darstellung

Die Projektseite wurde als moderne Installations- und Produktseite aufgebaut. Der visuelle Stil nutzt einen dunklen, animierten Constellation-/Particle-Network-Hintergrund mit langsam bewegten Lichtpunkten, feinen Verbindungslinien und dezentem Farbverlauf.

Der Dateimanager-Bereich ist bewusst nicht mehr als generischer Mockup-Kasten umgesetzt. Er orientiert sich an der realen installierten Oberfläche:

- Logo und Titel links, Verwaltungsbuttons rechts
- Upload-Karte mit Datei-Auswahl, Drag-Hinweis und Upload-Button
- Suchfeld, Filterchips und Pfadfeld `/var/www/html`
- getrennte Eingaben für Datei erstellen und Ordner erstellen
- Tabellenansicht mit den realen Spalten `Name`, `Status Normalnutzer`, `Typ`, `Größe`, `Letzte Änderung` und `Aktionen`
- Beispielzeilen wie `config`, `filemanager`, `install`, `projekt` und `index.php`
- Aktionsbuttons für Öffnen, Bearbeiten, Löschen, Download und Sichtbarkeit

Die Live-Demos sind statisch. Sie führen keine echten Befehle aus und greifen nicht auf echte Dateien zu.

---

## Installation

> Bitte nur auf einem frischen oder vorher gesicherten Server ausführen.

```bash
wget -O install.sh https://web-service.ubodigat.com/install/install.sh && chmod +x install.sh && ./install.sh
```

Kurzablauf:

1. Ubuntu/Debian-Server vorbereiten
2. Per SSH verbinden
3. Installationsbefehl ausführen
4. Webinterface öffnen
5. Admin einrichten

---

## Enthaltene Funktionen

- **Server-Setup:** Apache, PHP, MariaDB und benötigte PHP-Module automatisch installieren.
- **Web-Dateimanager:** Dateien und Ordner im Browser verwalten.
- **Monaco Editor:** Projektdateien direkt im Browser bearbeiten.
- **Admin-Dashboard:** Status, Benutzer, Sicherheit und Updates zentral steuern.
- **Benutzerverwaltung:** Admins und Normalnutzer getrennt verwalten.
- **Rollen / ACL:** Ordnerspezifische Rechte für Upload, Erstellen, Bearbeiten, Umbenennen und Löschen.
- **2FA / TOTP:** Admin-Logins mit Authenticator-App absichern.
- **Media-Viewer:** Bilder und Videos direkt in der Oberfläche ansehen.
- **Uploads:** Upload-Fluss mit Fortschritt und Browser-Feedback.
- **phpMyAdmin:** Datenbankverwaltung über bekannte Oberfläche.
- **Versionscheck:** Aktuelle Projektversion prüfen.
- **One-Click-Updates:** Dateimanager aktualisieren, ohne Konfigurationen zu überschreiben.
- **Sicherheitsschutz:** Session-Timeout, MIME-Prüfung, Pfadschutz und geschützte Systemordner.

---

## Sicherheit

web-service bringt mehrere Schutzmechanismen mit:

- 2FA/TOTP für Admin-Konten
- Session-Timeout für Filemanager-Zugriffe
- Rollen- und Rechteverwaltung
- ordnerspezifische ACL-Regeln
- Pfadschutz gegen Ausbruch aus erlaubten Verzeichnissen
- MIME-Prüfung bei Dateioperationen
- geschützte Systemordner
- Update-Mechanik mit Erhalt bestehender Konfigurationen

---

## Projektstruktur

```text
.
├── index.html          # öffentliche Produkt-/Installationsseite
├── style.css           # Layout, Constellation-Hintergrund, Dateimanager-Demo
├── script.js           # statische Interaktionen und Demo-Animationen
├── install.html        # Installationshinweise
├── install/            # Installationsskript, Template und Versionierung
└── README.md
```

---

## Lizenz

Dieses Projekt ist unter der **Apache License 2.0** lizenziert. Details stehen in [LICENSE](LICENSE).

Entwickelt von [ubodigat.com](https://ubodigat.com).