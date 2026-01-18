// Wine Club - Authentication Module

const WineClubAuth = {
    currentUser: null,

    // Initialize auth state listener
    init() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                resolve(user);
            });
        });
    },

    // Sign in anonymously (for guests)
    async signInAnonymously() {
        try {
            const result = await auth.signInAnonymously();
            this.currentUser = result.user;
            return result.user;
        } catch (error) {
            console.error('Anonymous sign in failed:', error);
            throw new Error('Failed to sign in. Please try again.');
        }
    },

    // Sign in or get current user
    async ensureSignedIn() {
        if (this.currentUser) {
            return this.currentUser;
        }

        // Check if already signed in
        await this.init();

        if (this.currentUser) {
            return this.currentUser;
        }

        // Sign in anonymously
        return await this.signInAnonymously();
    },

    // Get current user ID
    getUserId() {
        return this.currentUser?.uid || null;
    },

    // Check if user is host of an event
    async isHostOf(eventId) {
        if (!this.currentUser) return false;

        try {
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (!eventDoc.exists) return false;

            return eventDoc.data().hostId === this.currentUser.uid;
        } catch (error) {
            console.error('Error checking host status:', error);
            return false;
        }
    },

    // Get user's display name from event
    async getDisplayName(eventId) {
        if (!this.currentUser) return null;

        try {
            const participantDoc = await db
                .collection('events')
                .doc(eventId)
                .collection('participants')
                .doc(this.currentUser.uid)
                .get();

            if (participantDoc.exists) {
                return participantDoc.data().displayName;
            }

            // Check if they're the host
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (eventDoc.exists && eventDoc.data().hostId === this.currentUser.uid) {
                return eventDoc.data().hostName;
            }

            return null;
        } catch (error) {
            console.error('Error getting display name:', error);
            return null;
        }
    },

    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            this.currentUser = null;
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    }
};

// Export for use in other modules
window.WineClubAuth = WineClubAuth;
