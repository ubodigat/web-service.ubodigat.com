<?php
declare(strict_types=1);

// 1. Sperre prüfen
$lockFile = __DIR__ . '/.installed';
if (file_exists($lockFile)) {
    // Sicherheit: Keine Details verraten, nur Status melden
    http_response_code(403);
    die("❌ Installation bereits abgeschlossen. Um das Setup erneut auszuführen, muss die Datei '.installed' gelöscht werden.");
}

$error = '';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    
    // --- EINGABEN SAMMELN & BEREINIGEN ---
    $adminUser = trim($_POST["admin_user"] ?? '');
    $adminPass = $_POST["admin_pass"] ?? '';
    
    $dbHost = trim($_POST["db_host"] ?? 'localhost');
    $dbUser = trim($_POST["db_user"] ?? '');
    $dbPass = $_POST["db_pass"] ?? '';
    $dbName = trim($_POST["db_name"] ?? '');

    $webAccessEnabled = isset($_POST["web_access_enabled"]);
    $webAccessPass    = $_POST["web_access_pass"] ?? '';
    
    // VALIDIERUNG 1: Timeout (Kritikpunkt 1 behoben)
    $timeoutInput = (int)($_POST["filemanager_timeout"] ?? 1800);
    $timeout = ($timeoutInput > 0) ? $timeoutInput : 1800;

    // --- VALIDIERUNG ALLGEMEIN ---
    if (empty($adminUser) || empty($adminPass) || empty($dbUser) || empty($dbName)) {
        $error = "Bitte alle Pflichtfelder ausfüllen.";
    } elseif ($webAccessEnabled && empty($webAccessPass)) {
        $error = "Wenn Web-Access aktiviert ist, muss ein Passwort vergeben werden.";
    } else {
        
        // --- 2. DATENBANK VERBINDUNG ---
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        try {
            $conn = new mysqli($dbHost, $dbUser, $dbPass);
            // OPTIONAL: Charset setzen (Best Practice)
            $conn->set_charset('utf8mb4'); 
            
            $conn->query("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $conn->select_db($dbName);
        } catch (Exception $e) {
            // VALIDIERUNG 4: Keine internen Fehler nach außen (Kritikpunkt 4 behoben)
            $error = "Datenbankverbindung fehlgeschlagen. Bitte Zugangsdaten (Host, Benutzer, Passwort) prüfen.";
            // Für Debugging im Server-Log: error_log($e->getMessage());
        }

        if (!$error) {
            try {
                // --- 3. DB STRUKTUR & ADMIN ---
                $sqlFile = __DIR__ . "/../sql/struktur.sql";
                if (file_exists($sqlFile)) {
                    $sql = file_get_contents($sqlFile);
                    $conn->multi_query($sql);
                    while ($conn->more_results()) $conn->next_result();
                } else {
                    // Fallback Tabelle
                    $conn->query("CREATE TABLE IF NOT EXISTS benutzer (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        nutzername VARCHAR(255) UNIQUE,
                        passwort VARCHAR(255)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                }

                // Admin anlegen
                $adminHash = password_hash($adminPass, PASSWORD_BCRYPT);
                // INSERT IGNORE verhindert Fehler bei Doppelausführung
                $stmt = $conn->prepare("INSERT IGNORE INTO benutzer (nutzername, passwort) VALUES (?, ?)");
                $stmt->bind_param("ss", $adminUser, $adminHash);
                $stmt->execute();
                
                // --- 4. CONFIG DATEIEN SCHREIBEN ---
                
                // Inhalt für DB-Configs
                $configContent = "<?php\n"
                . "\$db_host = '" . addslashes($dbHost) . "';\n"
                . "\$db_user = '" . addslashes($dbUser) . "';\n"
                . "\$db_pass = '" . addslashes($dbPass) . "';\n"
                . "\$db_name = '" . addslashes($dbName) . "';\n";

                // Pfade definieren
                $projConfig = __DIR__ . "/../projekt/config.php";
                $fmConfig   = __DIR__ . "/../filemanager/config.php";

                // Schreiben & Härten (Kritikpunkt 2 behoben)
                file_put_contents($projConfig, $configContent, LOCK_EX);
                @chmod($projConfig, 0640); // Nur User/Group lesbar

                file_put_contents($fmConfig, $configContent, LOCK_EX);
                @chmod($fmConfig, 0640);

                // --- 5. SECURITY.PHP SCHREIBEN ---
                $configDir = __DIR__ . "/../config";
                if (!is_dir($configDir)) mkdir($configDir, 0755, true);
                $secFile = $configDir . "/security.php";

                $webHash = $webAccessEnabled ? password_hash($webAccessPass, PASSWORD_BCRYPT) : '';
                $webBool = $webAccessEnabled ? 'true' : 'false';

                $securityContent = "<?php\n"
                . "declare(strict_types=1);\n\n"
                . "define('WEB_ACCESS_ENABLED', $webBool);\n"
                . "define('WEB_ACCESS_HASH', '$webHash');\n"
                . "define('FILEMANAGER_TIMEOUT', $timeout);\n";

                file_put_contents($secFile, $securityContent, LOCK_EX);
                @chmod($secFile, 0640); // WICHTIG: Härten!

                // --- 6. ABSCHLUSS ---
                file_put_contents($lockFile, date('c'));
                
                // Selbstzerstörung
                @unlink(__FILE__);

                // VALIDIERUNG 3: Relativer Redirect (Kritikpunkt 3 behoben)
                header("Location: ../index.php");
                exit;

            } catch (Exception $e) {
                $error = "Einrichtungsfehler: Konnte Tabellen oder Dateien nicht schreiben.";
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup – Webprojekt</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f0f2f5; color: #1f2937; display: flex; justify-content: center; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 500px; width: 100%; }
        h1 { text-align: center; color: #2563eb; margin-bottom: 30px; }
        h3 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px; color: #374151; font-size: 1.1rem; }
        label { display: block; margin-top: 15px; font-weight: 600; font-size: 0.9rem; color: #4b5563; }
        input[type="text"], input[type="password"], select { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 1rem; }
        input:focus, select:focus { outline: none; border-color: #2563eb; ring: 2px solid #2563eb; }
        button { width: 100%; margin-top: 30px; padding: 12px; font-size: 1rem; background: #22c55e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
        button:hover { background: #16a34a; }
        .error { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #f87171; }
        .checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        input[type="checkbox"] { width: 18px; height: 18px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 System-Installation</h1>
        
        <?php if ($error): ?>
            <div class="error">⚠️ <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST">
            <h3>1. Datenbank Verbindung</h3>
            <label>Host <small>(meist localhost)</small>
                <input type="text" name="db_host" value="localhost" required>
            </label>
            <label>Benutzer
                <input type="text" name="db_user" required placeholder="z.B. root">
            </label>
            <label>Passwort
                <input type="password" name="db_pass" placeholder="DB Passwort">
            </label>
            <label>Datenbank-Name
                <input type="text" name="db_name" required placeholder="z.B. mein_projekt">
            </label>

            <h3>2. Admin-Zugang (Backend)</h3>
            <label>Admin-Benutzername
                <input type="text" name="admin_user" required placeholder="Benutzername">
            </label>
            <label>Admin-Passwort
                <input type="password" name="admin_pass" required placeholder="Sicheres Passwort">
            </label>

            <h3>3. Sicherheit & Einstellungen</h3>
            <label class="checkbox-label">
                <input type="checkbox" name="web_access_enabled"> 
                Öffentliche Webseite mit Passwort schützen?
            </label>
            <label>Webseiten-Passwort <small>(nur wenn oben aktiviert)</small>
                <input type="password" name="web_access_pass" placeholder="Besucher-Passwort">
            </label>
            
            <label>Filemanager Timeout
                <select name="filemanager_timeout">
                    <option value="900">15 Minuten</option>
                    <option value="1800" selected>30 Minuten (Standard)</option>
                    <option value="3600">1 Stunde</option>
                </select>
            </label>

            <button type="submit">🚀 Installation starten</button>
        </form>
    </div>
</body>
</html>