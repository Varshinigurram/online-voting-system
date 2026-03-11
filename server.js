const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config();

const app = express();

console.log("\n" + "=".repeat(70));
console.log("🚀 VOTEHUB SERVER STARTING");
console.log("=".repeat(70));

require("dotenv").config();

const PORT = process.env.PORT || 5000;
const VOTER_JWT_SECRET = process.env.VOTER_JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!VOTER_JWT_SECRET || !ADMIN_JWT_SECRET) {
    console.error("❌ ERROR: VOTER_JWT_SECRET and ADMIN_JWT_SECRET must be set in .env file");
    process.exit(1);
}
console.log("📍 PORT:", PORT);
console.log("🔐 Secrets configured from .env");

// ===========================
// MIDDLEWARE - CRITICAL ORDER!
// ===========================

// 1. CORS FIRST
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

// 2. Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 3. Request Logger
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ===========================
// STATIC FILE SERVING - CRITICAL!
// ===========================

const publicPath = path.join(__dirname, "public");
const frontendPath = path.join(__dirname, "frontend");
const adminPath = path.join(__dirname, "admin");

// Create folders
[publicPath, path.join(publicPath, "uploads"), path.join(publicPath, "uploads", "candidates")].forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

console.log("\n📁 Static file paths:");
console.log("   Frontend:", frontendPath);
console.log("   Admin:", adminPath);
console.log("   Public:", publicPath);

// SERVE STATIC FILES - ORDER MATTERS!
// Frontend files (highest priority)
app.use(express.static(frontendPath));

// Admin files
if (fs.existsSync(adminPath)) {
    app.use("/admin", express.static(adminPath));
}

// Public uploads
app.use("/uploads", express.static(path.join(publicPath, "uploads")));
app.use(express.static(publicPath));

console.log("✅ Static files configured\n");

// ===========================
// DATABASE
// ===========================
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("❌ FATAL ERROR: Database credentials not found in .env file!");
    console.error("Please create .env file with required database credentials.");
    process.exit(1);
}

pool.getConnection()
    .then(conn => {
        console.log("✅ DATABASE CONNECTED");
        conn.release();
    })
    .catch(err => {
        console.error("❌ DATABASE ERROR:", err.message);
    });

// ===========================
// AUTH MIDDLEWARE
// ===========================

const authenticateVoter = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "No authorization header" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "No token" });
        }

        const decoded = jwt.verify(token, VOTER_JWT_SECRET);
        req.voter = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// ===========================
// API ROUTES
// ===========================

// TEST
app.get("/api/test", (req, res) => {
    console.log("✅ Test route");
    res.json({
        success: true,
        message: "✅ API Working",
        timestamp: new Date().toISOString()
    });
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    let conn = null;
    try {
        const { fullName, email, password, dateOfBirth, phone } = req.body;

        console.log("📝 Register:", email);

        if (!fullName || !email || !password || !dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password too short"
            });
        }

        conn = await pool.getConnection();

        const [existing] = await conn.query(
            "SELECT id FROM voters WHERE email = ?",
            [email.toLowerCase()]
        );

        if (existing.length > 0) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await conn.query(
            `INSERT INTO voters (name, email, password, date_of_birth, phone, has_voted, created_at) 
             VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [fullName, email.toLowerCase(), hashedPassword, dateOfBirth, phone || null]
        );

        conn.release();

        const voterId = result.insertId;
        const token = jwt.sign(
            { id: voterId, email: email.toLowerCase(), role: "voter" },
            VOTER_JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("✅ Registered:", email);

        res.status(201).json({
            success: true,
            message: "✅ Registration successful",
            token,
            user: {
                id: voterId,
                name: fullName,
                email: email.toLowerCase(),
                hasVoted: false,
                dateOfBirth,
                phone: phone || null,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("❌ Register error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    let conn = null;
    try {
        const { email, password } = req.body;

        console.log("🔐 Login:", email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password required"
            });
        }

        conn = await pool.getConnection();

        const [voters] = await conn.query(
            `SELECT id, name, email, password, has_voted, voted_at, date_of_birth, phone, created_at 
             FROM voters WHERE email = ?`,
            [email.toLowerCase()]
        );

        if (voters.length === 0) {
            conn.release();
            console.log("❌ Not found:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const voter = voters[0];
        const isValid = await bcrypt.compare(password, voter.password);

        if (!isValid) {
            conn.release();
            console.log("❌ Wrong password");
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        conn.release();

        const token = jwt.sign(
            { id: voter.id, email: voter.email, role: "voter" },
            VOTER_JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("✅ Login successful");

        res.json({
            success: true,
            message: "✅ Login successful",
            token,
            user: {
                id: voter.id,
                name: voter.name,
                email: voter.email,
                hasVoted: voter.has_voted === 1,
                votedAt: voter.voted_at,
                dateOfBirth: voter.date_of_birth,
                phone: voter.phone,
                createdAt: voter.created_at
            }
        });

    } catch (error) {
        console.error("❌ Login error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});

// GET CANDIDATES
app.get("/api/voters/candidates", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("📋 Candidates");

        conn = await pool.getConnection();

        const [candidates] = await conn.query(
            `SELECT id, name, party, party_symbol, email, phone, biography, 
                    experience, policies, image_url, votes 
             FROM candidates 
             WHERE status = 'active' 
             ORDER BY name`
        );

        conn.release();

        console.log("✅ Found", candidates.length, "candidates");

        res.json({
            success: true,
            candidates: [
                ...candidates.map(c => ({
                    id: c.id,
                    name: c.name,
                    party: c.party,
                    partySymbol: c.party_symbol || "🏛️",
                    email: c.email,
                    phone: c.phone,
                    biography: c.biography || "No description",
                    experience: c.experience || "No experience",
                    policies: c.policies || "No policies",
                    imageUrl: c.image_url || "https://via.placeholder.com/200?text=Candidate",
                    votes: c.votes || 0,
                    isNota: false
                })),
                {
                    id: 0,
                    name: "NOTA",
                    party: "None of the Above",
                    partySymbol: "✋",
                    biography: "Vote for none",
                    imageUrl: "https://via.placeholder.com/200?text=NOTA",
                    votes: 0,
                    isNota: true
                }
            ]
        });

    } catch (error) {
        console.error("❌ Candidates error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// SUBMIT VOTE
app.post("/api/voters/vote", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        const { candidateId } = req.body;
        const voterId = req.voter.id;

        console.log("🗳️ Vote from voter:", voterId, "candidate:", candidateId);

        if (candidateId === undefined || candidateId === null) {
            return res.status(400).json({
                success: false,
                message: "Candidate ID required"
            });
        }

        conn = await pool.getConnection();

        const [election] = await conn.query(
            "SELECT status FROM election_control ORDER BY id DESC LIMIT 1"
        );

        if (!election.length || election[0].status !== 'ACTIVE') {
            conn.release();
            return res.status(400).json({
                success: false,
                message: "Election not active"
            });
        }

        const [existingVote] = await conn.query(
            "SELECT id FROM votes WHERE voter_id = ?",
            [voterId]
        );

        if (existingVote.length > 0) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: "Already voted"
            });
        }

        if (candidateId !== 0) {
            const [candidateCheck] = await conn.query(
                "SELECT id FROM candidates WHERE id = ? AND status = 'active'",
                [candidateId]
            );

            if (candidateCheck.length === 0) {
                conn.release();
                return res.status(400).json({
                    success: false,
                    message: "Invalid candidate"
                });
            }
        }

        await conn.query(
            "INSERT INTO votes (voter_id, candidate_id, created_at) VALUES (?, ?, NOW())",
            [voterId, candidateId === 0 ? null : candidateId]
        );

        if (candidateId !== 0) {
            await conn.query(
                "UPDATE candidates SET votes = votes + 1 WHERE id = ?",
                [candidateId]
            );
        }

        await conn.query(
            "UPDATE voters SET has_voted = 1, voted_at = NOW() WHERE id = ?",
            [voterId]
        );

        conn.release();

        console.log("✅ Vote recorded");

        res.json({
            success: true,
            message: "✅ Vote recorded"
        });

    } catch (error) {
        console.error("❌ Vote error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// GET RESULTS
app.get("/api/voters/results", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("📊 Results");

        conn = await pool.getConnection();

        const [candidates] = await conn.query(
            `SELECT id, name, party, party_symbol, image_url, votes 
             FROM candidates 
             ORDER BY votes DESC`
        );

        conn.release();

        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);

        console.log("✅ Results retrieved");

        res.json({
            success: true,
            results: candidates.map(c => ({
                id: c.id,
                name: c.name,
                party: c.party,
                partySymbol: c.party_symbol || "🏛️",
                imageUrl: c.image_url || "https://via.placeholder.com/200?text=Candidate",
                votes: c.votes || 0,
                percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0
            })),
            totalVotes
        });

    } catch (error) {
        console.error("❌ Results error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// GET PROFILE
app.get("/api/voters/profile", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("👤 Profile");

        conn = await pool.getConnection();

        const [voters] = await conn.query(
            `SELECT id, name, email, phone, date_of_birth, has_voted, voted_at, created_at 
             FROM voters WHERE id = ?`,
            [req.voter.id]
        );

        conn.release();
        if (voters.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Not found"
            });
        }

        const voter = voters[0];

        console.log("✅ Profile retrieved");

        res.json({
            success: true,
            profile: {
                id: voter.id,
                name: voter.name,
                email: voter.email,
                phone: voter.phone,
                dateOfBirth: voter.date_of_birth,
                hasVoted: voter.has_voted === 1,
                votedAt: voter.voted_at,
                createdAt: voter.created_at,
                voterId: `VOTER-${voter.id}`
            }
        });

    } catch (error) {
        console.error("❌ Profile error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// ELECTION STATUS
app.get("/api/admin/election-status", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("📋 Election status");

        conn = await pool.getConnection();

        const [status] = await conn.query(
            "SELECT status, start_time, end_time FROM election_control ORDER BY id DESC LIMIT 1"
        );

        conn.release();

        if (!status.length) {
            return res.json({
                success: true,
                status: 'CLOSED',
                startTime: null,
                endTime: null
            });
        }

        console.log("✅ Status:", status[0].status);

        res.json({
            success: true,
            status: status[0].status,
            startTime: status[0].start_time,
            endTime: status[0].end_time
        });

    } catch (error) {
        console.error("❌ Status error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// STATISTICS
app.get("/api/admin/statistics", authenticateVoter, async (req, res) => {
    let conn = null;
    try {
        console.log("📈 Statistics");

        conn = await pool.getConnection();

        const [[{ total_voters }]] = await conn.query(
            "SELECT COUNT(*) as total_voters FROM voters"
        );

        const [[{ total_candidates }]] = await conn.query(
            "SELECT COUNT(*) as total_candidates FROM candidates WHERE status = 'active'"
        );

        const [[{ total_votes }]] = await conn.query(
            "SELECT COUNT(*) as total_votes FROM votes"
        );

        conn.release();

        console.log("✅ Statistics retrieved");

        res.json({
            success: true,
            totalVoters: total_voters || 0,
            totalCandidates: total_candidates || 0,
            totalVotes: total_votes || 0
        });

    } catch (error) {
        console.error("❌ Statistics error:", error.message);
        if (conn) conn.release();
        res.status(500).json({
            success: false,
            message: "Failed",
            error: error.message
        });
    }
});

// ===========================
// FRONTEND ROUTES
// ===========================

app.get("/index.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/login.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "login.html"));
});

app.get("/register.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "register.html"));
});

app.get("/dashboard.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "dashboard.html"));
});

app.get("/voting.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "voting.html"));
});

app.get("/profile.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "profile.html"));
});

app.get("/results.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "results.html"));
});

app.get("/success.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "success.html"));
});

// ===========================
// FALLBACK ROUTES
// ===========================

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// ===========================
// ERROR HANDLERS
// ===========================

app.use((req, res) => {
    console.log("⚠️ 404 -", req.method, req.path);
    res.status(404).json({
        success: false,
        message: "Not found"
    });
});

app.use((err, req, res, next) => {
    console.error("❌ Error:", err.message);
    res.status(500).json({
        success: false,
        message: "Server error"
    });
});

// ===========================
// START SERVER
// ===========================

app.listen(PORT, () => {
    console.log("\n" + "=".repeat(70));
    console.log("✅ VOTEHUB READY");
    console.log("=".repeat(70));
    console.log(`

✅ Admin: http://localhost:${PORT}/admin
✅ Voter: http://localhost:${PORT}

📚 Routes:
   /index.html - Home
   /login.html - Login
   /register.html - Register
   /dashboard.html - Dashboard
   /voting.html - Vote
   /profile.html - Profile
   /results.html - Results
   /css/* - Styles
   /js/* - Scripts
    `);
    console.log("=".repeat(70) + "\n");
});

module.exports = app;