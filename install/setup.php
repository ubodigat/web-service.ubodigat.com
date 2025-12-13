<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $adminUser = $_POST["admin_user"];
    $adminPass = password_hash($_POST["admin_pass"], PASSWORD_BCRYPT);
    $dbHost = $_POST["db_host"];
    $dbUser = $_POST["db_user"];
    $dbPass = $_POST["db_pass"];
    $dbName = $_POST["db_name"];

    // 🔧 config.php schreiben
    $configContent = "<?php
\$db_host = '$dbHost';
\$db_user = '$dbUser';
\$db_pass = '$dbPass';
\$db_name = '$dbName';
?>";

    file_put_contents(__DIR__ . "/projekt/config.php", $configContent);
    file_put_contents(__DIR__ . "/filemanager/config.php", $configContent);

    // 🔌 Mit Datenbank verbinden
    $conn = new mysqli($dbHost, $dbUser, $dbPass);
    if ($conn->connect_error) die("Verbindung fehlgeschlagen: " . $conn->connect_error);

    // 🧱 DB erstellen (falls noch nicht da)
    $conn->query("CREATE DATABASE IF NOT EXISTS `$dbName`");
    $conn->select_db($dbName);

    // 📜 SQL-Struktur importieren
    $sql = file_get_contents(__DIR__ . "/sql/struktur.sql");
    $conn->multi_query($sql);
    while ($conn->more_results()) $conn->next_result();

    // 🔐 Admin-User einfügen (z. B. für filemanager oder Login)
    $conn->query("CREATE TABLE IF NOT EXISTS benutzer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nutzername VARCHAR(255),
        passwort TEXT
    )");

    $stmt = $conn->prepare("INSERT INTO benutzer (nutzername, passwort) VALUES (?, ?)");
    $stmt->bind_param("ss", $adminUser, $adminPass);
    $stmt->execute();

    echo "<h2>✅ Einrichtung erfolgreich!</h2><p>Du kannst das Projekt jetzt nutzen.</p>";
    exit;
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Setup – Webprojekt</title>
    <style>
        body { font-family: sans-serif; padding: 30px; max-width: 600px; margin: auto; background: #f9f9f9; }
        h1 { color: #444; }
        label { display: block; margin-top: 15px; }
        input { width: 100%; padding: 8px; margin-top: 5px; }
        button { margin-top: 20px; padding: 10px 20px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>🔧 Einrichtung – Webprojekt</h1>
    <form method="POST">
        <label>🧑‍💻 Admin-Nutzername:
            <input type="text" name="admin_user" required>
        </label>
        <label>🔑 Admin-Passwort:
            <input type="password" name="admin_pass" required>
        </label>
        <label>🗃️ Datenbank-Host (z. B. localhost):
            <input type="text" name="db_host" value="localhost" required>
        </label>
        <label>👤 DB-Benutzer:
            <input type="text" name="db_user" required>
        </label>
        <label>🔐 DB-Passwort:
            <input type="password" name="db_pass">
        </label>
        <label>📛 DB-Name:
            <input type="text" name="db_name" required>
        </label>
        <button type="submit">✅ Einrichtung starten</button>
    </form>
</body>
</html>