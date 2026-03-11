app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM Voters WHERE email = ?",
        [email],
        async (err, result) => {

            if(result.length === 0)
                return res.send("User not found");

            const match = await bcrypt.compare(password, result[0].password);

            if(match)
                res.send(result[0]);
            else
                res.send("Wrong password");
        }
    );
});