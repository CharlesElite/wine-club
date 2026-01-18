// Wine Club - Event Manager Module

const EventManager = {
    // Generate a random join code (e.g., "ZIN-7K3M")
    generateJoinCode() {
        const prefixes = ['ZIN', 'CAB', 'MER', 'PIN', 'SYR', 'ROS', 'CHA', 'SAV', 'MAL', 'RIE'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
        let suffix = '';
        for (let i = 0; i < 4; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${prefix}-${suffix}`;
    },

    // Create a new event
    async createEvent(title, theme, hostName, maxParticipants = 8) {
        const user = await WineClubAuth.ensureSignedIn();

        // Generate unique join code
        let joinCode = this.generateJoinCode();
        let attempts = 0;
        while (await this.codeExists(joinCode) && attempts < 10) {
            joinCode = this.generateJoinCode();
            attempts++;
        }

        const eventData = {
            title: title,
            theme: theme,
            hostId: user.uid,
            hostName: hostName,
            joinCode: joinCode,
            status: 'setup', // setup, tasting, reveal, complete
            currentWineNumber: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            maxParticipants: maxParticipants
        };

        try {
            const docRef = await db.collection('events').add(eventData);

            // Add host as participant
            await db.collection('events').doc(docRef.id)
                .collection('participants').doc(user.uid).set({
                    displayName: hostName,
                    role: 'host',
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            return {
                id: docRef.id,
                ...eventData
            };
        } catch (error) {
            console.error('Error creating event:', error);
            throw new Error('Failed to create event. Please try again.');
        }
    },

    // Check if join code already exists
    async codeExists(code) {
        const snapshot = await db.collection('events')
            .where('joinCode', '==', code)
            .where('status', 'in', ['setup', 'tasting', 'reveal'])
            .limit(1)
            .get();
        return !snapshot.empty;
    },

    // Find event by join code
    async findEventByCode(code) {
        const normalizedCode = code.toUpperCase().trim();

        const snapshot = await db.collection('events')
            .where('joinCode', '==', normalizedCode)
            .where('status', 'in', ['setup', 'tasting', 'reveal'])
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    },

    // Join an event
    async joinEvent(code, displayName) {
        const user = await WineClubAuth.ensureSignedIn();

        const event = await this.findEventByCode(code);
        if (!event) {
            throw new Error('Event not found. Check your code and try again.');
        }

        if (event.status === 'complete') {
            throw new Error('This event has already ended.');
        }

        // Check if already a participant
        const existingParticipant = await db.collection('events')
            .doc(event.id)
            .collection('participants')
            .doc(user.uid)
            .get();

        if (existingParticipant.exists) {
            // Update name if rejoining
            await existingParticipant.ref.update({
                displayName: displayName,
                lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Check participant limit
            const participantsSnapshot = await db.collection('events')
                .doc(event.id)
                .collection('participants')
                .get();

            if (participantsSnapshot.size >= event.maxParticipants) {
                throw new Error('This event is full.');
            }

            // Add as new participant
            await db.collection('events')
                .doc(event.id)
                .collection('participants')
                .doc(user.uid)
                .set({
                    displayName: displayName,
                    role: 'participant',
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
        }

        // Store event ID locally
        localStorage.setItem('wineclub_currentEvent', event.id);
        localStorage.setItem('wineclub_displayName', displayName);

        return event.id;
    },

    // Get event by ID
    async getEvent(eventId) {
        try {
            const doc = await db.collection('events').doc(eventId).get();
            if (!doc.exists) {
                return null;
            }
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting event:', error);
            return null;
        }
    },

    // Update event status
    async updateStatus(eventId, status) {
        try {
            await db.collection('events').doc(eventId).update({
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating status:', error);
            throw new Error('Failed to update event status.');
        }
    },

    // Set current wine for tasting
    async setCurrentWine(eventId, bagNumber) {
        try {
            await db.collection('events').doc(eventId).update({
                currentWineNumber: bagNumber,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error setting current wine:', error);
            throw new Error('Failed to set current wine.');
        }
    },

    // Get all participants
    async getParticipants(eventId) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('participants')
                .orderBy('joinedAt')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting participants:', error);
            return [];
        }
    },

    // Start tasting phase
    async startTasting(eventId) {
        await this.updateStatus(eventId, 'tasting');
        await this.setCurrentWine(eventId, 1);
    },

    // Start reveal phase
    async startReveal(eventId) {
        await this.updateStatus(eventId, 'reveal');
    },

    // Complete event
    async completeEvent(eventId) {
        await this.updateStatus(eventId, 'complete');

        // Archive to wine history
        await this.archiveToHistory(eventId);
    },

    // Archive event wines to history
    async archiveToHistory(eventId) {
        try {
            const event = await this.getEvent(eventId);
            const wines = await WineManager.getWines(eventId);
            const ratings = await RatingManager.getAllRatings(eventId);

            for (const wine of wines) {
                // Calculate average rating for this wine
                const wineRatings = ratings.filter(r => r.bagNumber === wine.bagNumber);
                const avgRating = wineRatings.length > 0
                    ? wineRatings.reduce((sum, r) => sum + r.score, 0) / wineRatings.length
                    : 0;

                // Add to wine history
                await db.collection('wineHistory').add({
                    wineName: wine.name,
                    winery: wine.winery,
                    vintage: wine.vintage,
                    varietal: wine.varietal,
                    eventId: eventId,
                    eventTitle: event.title,
                    eventDate: event.createdAt,
                    averageRating: avgRating,
                    totalRatings: wineRatings.length,
                    broughtBy: wine.broughtByName,
                    archivedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error archiving to history:', error);
        }
    },

    // Get user's recent events
    async getRecentEvents(limit = 10) {
        const user = WineClubAuth.currentUser;
        if (!user) return [];

        try {
            // Get events where user is host
            const hostedSnapshot = await db.collection('events')
                .where('hostId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return hostedSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting recent events:', error);
            return [];
        }
    },

    // Get all completed events for history
    async getCompletedEvents() {
        try {
            const snapshot = await db.collection('events')
                .where('status', '==', 'complete')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting completed events:', error);
            return [];
        }
    }
};

// Export for use in other modules
window.EventManager = EventManager;
