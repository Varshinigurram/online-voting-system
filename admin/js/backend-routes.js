/**
 * Add these routes to your Node.js backend
 */

// Export Statistics
router.get('/admin/statistics/export/:format', authenticateAdmin, async (req, res) => {
    try {
        const format = req.params.format; // csv, pdf, json
        
        // Get statistics data
        const stats = await getStatisticsData();
        
        if (format === 'csv') {
            const csv = generateCSV(stats);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=statistics.csv');
            res.send(csv);
        } else if (format === 'pdf') {
            const pdf = await generatePDF(stats);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=statistics.pdf');
            res.send(pdf);
        } else if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=statistics.json');
            res.json(stats);
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
});

// Download Statistics
router.get('/admin/statistics/download', authenticateAdmin, async (req, res) => {
    try {
        const stats = await getStatisticsData();
        const pdf = await generatePDF(stats);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=statistics.pdf');
        res.send(pdf);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Download failed' });
    }
});

// Upload Candidate Image
router.post('/admin/candidates', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, party, email, phone, biography, experience, policies, imageUrl } = req.body;

        // Handle image upload
        let finalImageUrl = imageUrl;
        
        
        if (req.file) {
            // If file uploaded, use file path
            finalImageUrl = `/uploads/candidates/${req.file.filename}`;
            // Or upload to cloud storage like AWS S3, Cloudinary, etc.
            // finalImageUrl = await uploadToCloudinary(req.file);
        }

        const candidate = new Candidate({
            name,
            party,
            email,
            phone,
            biography,
            experience,
            policies,
            imageUrl: finalImageUrl,
            votes: 0,
            status: 'active'
        });

        await candidate.save();

        res.json({
            success: true,
            message: 'Candidate added successfully',
            candidate
        });
    } catch (error) {
        console.error('Add candidate error:', error);
        res.status(500).json({ message: 'Failed to add candidate', error: error.message });
    }
});

// Get Statistics
router.get('/admin/statistics', authenticateAdmin, async (req, res) => {
    try {
        const totalVotes = await Vote.countDocuments();
        const totalVoters = await User.countDocuments({ role: 'voter' });
        const candidates = await Candidate.find({});
        const votedVoters = await Vote.distinct('voterId');

        const stats = {
            totalVotes,
            totalVoters,
            votedCount: votedVoters.length,
            candidates: candidates.map(c => ({
                ...c.toObject(),
                votes: c.votes || 0
            })),
            hourlyVotes: generateHourlyData(totalVotes),
            devices: {
                mobile: Math.floor(totalVotes * 0.4),
                tablet: Math.floor(totalVotes * 0.2),
                desktop: Math.floor(totalVotes * 0.4)
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ message: 'Failed to get statistics' });
    }
});