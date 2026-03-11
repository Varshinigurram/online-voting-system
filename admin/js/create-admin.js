const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "7080",
    database: "Online_Voting_System"
});

async function createAdmin() {
    try {
        console.log("Creating admin account...");

        const email = "admin@votehub.com";
        const password = "admin123";
        const name = "Admin User";

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Hashed password:", hashedPassword);

        const conn = await pool.getConnection();

        // Delete existing admin
        await conn.query("DELETE FROM admins WHERE email = ?", [email]);
        console.log("Deleted existing admin");

        // Insert new admin
        const [result] = await conn.query(
            "INSERT INTO admins (name, email, password, created_at) VALUES (?, ?, ?, NOW())",
            [name, email, hashedPassword]
        );

        conn.release();

        console.log("✅ Admin created successfully!");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("ID:", result.insertId);

        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}
