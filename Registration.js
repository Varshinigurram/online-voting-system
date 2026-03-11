app.post("/register", async (req, res) => {
    console.log("REGISTER ROUTE HIT");
    console.log(req.body);

    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.promise().query(
            "INSERT INTO Voters (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        console.log("INSERT RESULT:", result);

        res.send("Registered successfully");

    } catch (error) {
        console.log("ERROR:", error);
        res.status(500).send("Registration failed");
    }
});