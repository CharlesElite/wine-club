// Wine Club - Real-time Listeners Module

const RealtimeListeners = {
    // Store unsubscribe functions
    unsubscribers: {},

    // Listen to event changes
    listenToEvent(eventId, callback) {
        if (this.unsubscribers.event) {
            this.unsubscribers.event();
        }

        this.unsubscribers.event = db.collection('events')
            .doc(eventId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            }, (error) => {
                console.error('Event listener error:', error);
            });

        return this.unsubscribers.event;
    },

    // Listen to participants
    listenToParticipants(eventId, callback) {
        if (this.unsubscribers.participants) {
            this.unsubscribers.participants();
        }

        this.unsubscribers.participants = db.collection('events')
            .doc(eventId)
            .collection('participants')
            .orderBy('joinedAt')
            .onSnapshot((snapshot) => {
                const participants = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(participants);
            }, (error) => {
                console.error('Participants listener error:', error);
            });

        return this.unsubscribers.participants;
    },

    // Listen to wines
    listenToWines(eventId, callback) {
        if (this.unsubscribers.wines) {
            this.unsubscribers.wines();
        }

        this.unsubscribers.wines = db.collection('events')
            .doc(eventId)
            .collection('wines')
            .orderBy('bagNumber')
            .onSnapshot((snapshot) => {
                const wines = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(wines);
            }, (error) => {
                console.error('Wines listener error:', error);
            });

        return this.unsubscribers.wines;
    },

    // Listen to ratings
    listenToRatings(eventId, callback) {
        if (this.unsubscribers.ratings) {
            this.unsubscribers.ratings();
        }

        this.unsubscribers.ratings = db.collection('events')
            .doc(eventId)
            .collection('ratings')
            .onSnapshot((snapshot) => {
                const ratings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(ratings);
            }, (error) => {
                console.error('Ratings listener error:', error);
            });

        return this.unsubscribers.ratings;
    },

    // Listen to a specific wine's ratings
    listenToWineRatings(eventId, bagNumber, callback) {
        const key = `wineRatings_${bagNumber}`;
        if (this.unsubscribers[key]) {
            this.unsubscribers[key]();
        }

        this.unsubscribers[key] = db.collection('events')
            .doc(eventId)
            .collection('ratings')
            .where('bagNumber', '==', bagNumber)
            .onSnapshot((snapshot) => {
                const ratings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(ratings);
            }, (error) => {
                console.error('Wine ratings listener error:', error);
            });

        return this.unsubscribers[key];
    },

    // Listen to taken bag numbers
    listenToTakenBags(eventId, callback) {
        if (this.unsubscribers.takenBags) {
            this.unsubscribers.takenBags();
        }

        this.unsubscribers.takenBags = db.collection('events')
            .doc(eventId)
            .collection('wines')
            .onSnapshot((snapshot) => {
                const takenBags = snapshot.docs.map(doc => doc.data().bagNumber);
                callback(takenBags);
            }, (error) => {
                console.error('Taken bags listener error:', error);
            });

        return this.unsubscribers.takenBags;
    },

    // Cleanup specific listener
    cleanup(key) {
        if (this.unsubscribers[key]) {
            this.unsubscribers[key]();
            delete this.unsubscribers[key];
        }
    },

    // Cleanup all listeners
    cleanupAll() {
        for (const key in this.unsubscribers) {
            if (this.unsubscribers[key]) {
                this.unsubscribers[key]();
            }
        }
        this.unsubscribers = {};
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    RealtimeListeners.cleanupAll();
});

// Export for use in other modules
window.RealtimeListeners = RealtimeListeners;
