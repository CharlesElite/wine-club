// Wine Club - Rating Manager Module

const RatingManager = {
    // Submit or update a rating
    async submitRating(eventId, bagNumber, score, notes = [], comment = '') {
        const user = await WineClubAuth.ensureSignedIn();
        const displayName = await WineClubAuth.getDisplayName(eventId);

        // Create rating ID based on user and bag number (one rating per wine per user)
        const ratingId = `${user.uid}_${bagNumber}`;

        try {
            await db.collection('events')
                .doc(eventId)
                .collection('ratings')
                .doc(ratingId)
                .set({
                    userId: user.uid,
                    userName: displayName,
                    bagNumber: bagNumber,
                    score: score,
                    notes: notes,
                    comment: comment,
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            return { id: ratingId, score, notes, comment };
        } catch (error) {
            console.error('Error submitting rating:', error);
            throw new Error('Failed to submit rating. Please try again.');
        }
    },

    // Get user's rating for a specific wine
    async getUserRating(eventId, bagNumber) {
        const user = WineClubAuth.currentUser;
        if (!user) return null;

        const ratingId = `${user.uid}_${bagNumber}`;

        try {
            const doc = await db.collection('events')
                .doc(eventId)
                .collection('ratings')
                .doc(ratingId)
                .get();

            if (!doc.exists) return null;

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting user rating:', error);
            return null;
        }
    },

    // Get all user's ratings for this event
    async getUserRatings(eventId) {
        const user = WineClubAuth.currentUser;
        if (!user) return [];

        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('ratings')
                .where('userId', '==', user.uid)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting user ratings:', error);
            return [];
        }
    },

    // Get all ratings for an event
    async getAllRatings(eventId) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('ratings')
                .orderBy('submittedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all ratings:', error);
            return [];
        }
    },

    // Get ratings for a specific wine
    async getWineRatings(eventId, bagNumber) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('ratings')
                .where('bagNumber', '==', bagNumber)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting wine ratings:', error);
            return [];
        }
    },

    // Calculate average rating for a wine
    async getWineAverage(eventId, bagNumber) {
        const ratings = await this.getWineRatings(eventId, bagNumber);

        if (ratings.length === 0) return { average: 0, count: 0 };

        const sum = ratings.reduce((acc, r) => acc + r.score, 0);
        return {
            average: sum / ratings.length,
            count: ratings.length
        };
    },

    // Get rating statistics for all wines
    async getEventStats(eventId) {
        const ratings = await this.getAllRatings(eventId);

        // Group by bag number
        const byWine = {};
        for (const rating of ratings) {
            if (!byWine[rating.bagNumber]) {
                byWine[rating.bagNumber] = [];
            }
            byWine[rating.bagNumber].push(rating);
        }

        // Calculate stats for each wine
        const stats = {};
        for (const [bagNumber, wineRatings] of Object.entries(byWine)) {
            const scores = wineRatings.map(r => r.score);
            stats[bagNumber] = {
                average: scores.reduce((a, b) => a + b, 0) / scores.length,
                count: scores.length,
                high: Math.max(...scores),
                low: Math.min(...scores),
                comments: wineRatings.filter(r => r.comment).map(r => ({
                    user: r.userName,
                    comment: r.comment
                }))
            };
        }

        return stats;
    },

    // Check if user has rated all wines
    async hasRatedAllWines(eventId, totalWines) {
        const userRatings = await this.getUserRatings(eventId);
        return userRatings.length >= totalWines;
    },

    // Get quick notes statistics (most popular notes)
    async getNoteStats(eventId, bagNumber) {
        const ratings = await this.getWineRatings(eventId, bagNumber);

        const noteCounts = {};
        for (const rating of ratings) {
            if (rating.notes) {
                for (const note of rating.notes) {
                    noteCounts[note] = (noteCounts[note] || 0) + 1;
                }
            }
        }

        // Sort by count
        return Object.entries(noteCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([note, count]) => ({ note, count }));
    }
};

// Export for use in other modules
window.RatingManager = RatingManager;
