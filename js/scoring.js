// Wine Club - Scoring Module

const Scoring = {
    // Calculate winner (highest average rating)
    async calculateWinner(eventId) {
        const wines = await WineManager.getWines(eventId);
        const ratings = await RatingManager.getAllRatings(eventId);

        let winner = null;
        let highestAvg = 0;

        for (const wine of wines) {
            const wineRatings = ratings.filter(r => r.bagNumber === wine.bagNumber);
            if (wineRatings.length === 0) continue;

            const avg = wineRatings.reduce((sum, r) => sum + r.score, 0) / wineRatings.length;

            if (avg > highestAvg) {
                highestAvg = avg;
                winner = {
                    ...wine,
                    averageRating: avg,
                    ratingCount: wineRatings.length
                };
            }
        }

        return winner;
    },

    // Get full leaderboard
    async getLeaderboard(eventId) {
        const wines = await WineManager.getWines(eventId);
        const ratings = await RatingManager.getAllRatings(eventId);

        const results = wines.map(wine => {
            const wineRatings = ratings.filter(r => r.bagNumber === wine.bagNumber);
            const scores = wineRatings.map(r => r.score);

            return {
                ...wine,
                averageRating: scores.length > 0
                    ? scores.reduce((a, b) => a + b, 0) / scores.length
                    : 0,
                ratingCount: scores.length,
                highScore: scores.length > 0 ? Math.max(...scores) : 0,
                lowScore: scores.length > 0 ? Math.min(...scores) : 0,
                notes: this.aggregateNotes(wineRatings),
                comments: wineRatings.filter(r => r.comment).map(r => ({
                    user: r.userName,
                    comment: r.comment,
                    score: r.score
                }))
            };
        });

        // Sort by average rating (descending)
        return results.sort((a, b) => b.averageRating - a.averageRating);
    },

    // Aggregate tasting notes
    aggregateNotes(ratings) {
        const noteCounts = {};

        for (const rating of ratings) {
            if (rating.notes && Array.isArray(rating.notes)) {
                for (const note of rating.notes) {
                    noteCounts[note] = (noteCounts[note] || 0) + 1;
                }
            }
        }

        return Object.entries(noteCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([note, count]) => ({ note, count }));
    },

    // Calculate value score (rating vs price)
    calculateValueScore(rating, price) {
        if (!price || price <= 0) return null;

        // Higher rating per dollar = better value
        // Normalize to a 1-10 scale
        const valueRatio = rating / price;
        // Assume $10 per point is average, adjust scale
        const valueScore = Math.min(10, valueRatio * 10);

        return valueScore;
    },

    // Get participant statistics
    async getParticipantStats(eventId) {
        const ratings = await RatingManager.getAllRatings(eventId);
        const participants = await EventManager.getParticipants(eventId);

        return participants.map(participant => {
            const userRatings = ratings.filter(r => r.userId === participant.id);

            return {
                ...participant,
                ratingsSubmitted: userRatings.length,
                averageGiven: userRatings.length > 0
                    ? userRatings.reduce((sum, r) => sum + r.score, 0) / userRatings.length
                    : 0,
                highestGiven: userRatings.length > 0
                    ? Math.max(...userRatings.map(r => r.score))
                    : 0,
                lowestGiven: userRatings.length > 0
                    ? Math.min(...userRatings.map(r => r.score))
                    : 0
            };
        });
    },

    // Check for consensus (wines everyone agrees on)
    async findConsensusWines(eventId) {
        const leaderboard = await this.getLeaderboard(eventId);

        return leaderboard.filter(wine => {
            if (wine.ratingCount < 2) return false;

            const variance = wine.highScore - wine.lowScore;
            return variance <= 2; // Low variance = consensus
        });
    },

    // Find controversial wines (high disagreement)
    async findControversialWines(eventId) {
        const leaderboard = await this.getLeaderboard(eventId);

        return leaderboard.filter(wine => {
            if (wine.ratingCount < 2) return false;

            const variance = wine.highScore - wine.lowScore;
            return variance >= 4; // High variance = controversial
        });
    },

    // Generate summary stats for an event
    async getEventSummary(eventId) {
        const event = await EventManager.getEvent(eventId);
        const leaderboard = await this.getLeaderboard(eventId);
        const participantStats = await this.getParticipantStats(eventId);

        const allRatings = leaderboard.reduce((acc, wine) => acc + wine.ratingCount, 0);
        const avgOverall = leaderboard.length > 0
            ? leaderboard.reduce((sum, w) => sum + w.averageRating * w.ratingCount, 0) / allRatings
            : 0;

        return {
            event,
            totalWines: leaderboard.length,
            totalRatings: allRatings,
            totalParticipants: participantStats.length,
            averageOverall: avgOverall,
            winner: leaderboard[0] || null,
            runnerUp: leaderboard[1] || null,
            mostPopularNotes: this.getOverallNotes(leaderboard),
            participantStats
        };
    },

    // Get most common notes across all wines
    getOverallNotes(leaderboard) {
        const allNotes = {};

        for (const wine of leaderboard) {
            for (const { note, count } of wine.notes) {
                allNotes[note] = (allNotes[note] || 0) + count;
            }
        }

        return Object.entries(allNotes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([note, count]) => ({ note, count }));
    }
};

// Export for use in other modules
window.Scoring = Scoring;
