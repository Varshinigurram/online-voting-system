app.post("/vote", async (req, res) => {

    const { voter_id, candidate_id } = req.body;

    const connection = db.promise();

    try {

        // Start transaction
        await connection.query("START TRANSACTION");

        // Step 1: Lock voter row (prevents double voting in concurrency)
        const [voterRows] = await connection.query(
            "SELECT has_voted FROM Voters WHERE voter_id = ? FOR UPDATE",
            [voter_id]
        );

        if (voterRows.length === 0) {
            throw new Error("Voter not found");
        }

        if (voterRows[0].has_voted) {
            throw new Error("You have already voted");
        }

        // Step 2: Verify candidate exists (including NOTA)
        const [candidateRows] = await connection.query(
            "SELECT candidate_id FROM Candidates WHERE candidate_id = ?",
            [candidate_id]
        );

        if (candidateRows.length === 0) {
            throw new Error("Invalid candidate selected");
        }

        // Step 3: Insert vote
        await connection.query(
            "INSERT INTO Votes (voter_id, candidate_id, vote_time) VALUES (?, ?, NOW())",
            [voter_id, candidate_id]
        );

        // Step 4: Update vote count
        await connection.query(
            "UPDATE Candidates SET vote_count = vote_count + 1 WHERE candidate_id = ?",
            [candidate_id]
        );

        // Step 5: Update voter status
        await connection.query(
            "UPDATE Voters SET has_voted = TRUE WHERE voter_id = ?",
            [voter_id]
        );

        // Step 6: Commit transaction
        await connection.query("COMMIT");

        res.send("Vote cast successfully");

    } catch (error) {

        // If anything fails → rollback
        await connection.query("ROLLBACK");

        res.status(400).send(error.message);
    }
});