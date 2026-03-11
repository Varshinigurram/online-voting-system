const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function setup() {
    try {
        console.log("🔧 SETTING UP DATABASE");

        const pool = mysql.createPool({
            host: "localhost",
            user: "root",
            password: "7080",
            database: "Online_Voting_System"
        });

        const conn = await pool.getConnection();

        // Delete old admin
        await conn.query("DELETE FROM admins WHERE email = 'admin@votehub.com'");
        console.log("✅ Deleted old admin");

        // Hash password
        const hash = await bcrypt.hash("admin123", 10);
        console.log("✅ Password hashed:", hash);

        // Insert new admin
        const [result] = await conn.query(
            "INSERT INTO admins (name, email, password, created_at) VALUES (?, ?, ?, NOW())",
            ["Admin User", "admin@votehub.com", hash]
        );

        console.log("✅ Admin created!");
        console.log("Email: admin@votehub.com");
        console.log("Password: admin123");
        console.log("ID:", result.insertId);

        // Verify
        const [admins] = await conn.query("SELECT * FROM admins");
        console.log("\n📋 All admins:", admins);

        conn.release();
        pool.end();

    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    }
}

setup();