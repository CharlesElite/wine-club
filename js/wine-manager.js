// Wine Club - Wine Manager Module

const WineManager = {
    // Register a wine
    async registerWine(eventId, wineData) {
        const user = await WineClubAuth.ensureSignedIn();

        // Check if user already has a wine registered
        const existingWine = await this.getUserWine(eventId, user.uid);
        if (existingWine) {
            // Update existing wine
            return await this.updateWine(eventId, existingWine.id, wineData);
        }

        // Check if bag number is taken
        const bagTaken = await this.isBagNumberTaken(eventId, wineData.bagNumber);
        if (bagTaken) {
            throw new Error('This bag number is already taken. Please choose another.');
        }

        // Get participant name
        const displayName = await WineClubAuth.getDisplayName(eventId);

        try {
            const docRef = await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .add({
                    bagNumber: wineData.bagNumber,
                    name: wineData.name,
                    winery: wineData.winery || '',
                    vintage: wineData.vintage || '',
                    varietal: wineData.varietal || '',
                    price: wineData.price || null,
                    broughtById: user.uid,
                    broughtByName: displayName,
                    revealed: false,
                    registeredAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            return {
                id: docRef.id,
                ...wineData
            };
        } catch (error) {
            console.error('Error registering wine:', error);
            throw new Error('Failed to register wine. Please try again.');
        }
    },

    // Update a wine
    async updateWine(eventId, wineId, wineData) {
        try {
            await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .doc(wineId)
                .update({
                    bagNumber: wineData.bagNumber,
                    name: wineData.name,
                    winery: wineData.winery || '',
                    vintage: wineData.vintage || '',
                    varietal: wineData.varietal || '',
                    price: wineData.price || null,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            return { id: wineId, ...wineData };
        } catch (error) {
            console.error('Error updating wine:', error);
            throw new Error('Failed to update wine. Please try again.');
        }
    },

    // Get user's wine for this event
    async getUserWine(eventId, userId) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .where('broughtById', '==', userId)
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting user wine:', error);
            return null;
        }
    },

    // Check if bag number is taken
    async isBagNumberTaken(eventId, bagNumber, excludeWineId = null) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .where('bagNumber', '==', bagNumber)
                .limit(1)
                .get();

            if (snapshot.empty) return false;

            // If we're updating, check if it's the same wine
            if (excludeWineId && snapshot.docs[0].id === excludeWineId) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking bag number:', error);
            return false;
        }
    },

    // Get all wines for an event
    async getWines(eventId) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .orderBy('bagNumber')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting wines:', error);
            return [];
        }
    },

    // Get taken bag numbers
    async getTakenBagNumbers(eventId) {
        const wines = await this.getWines(eventId);
        return wines.map(w => w.bagNumber);
    },

    // Get wine by bag number
    async getWineByBagNumber(eventId, bagNumber) {
        try {
            const snapshot = await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .where('bagNumber', '==', bagNumber)
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting wine by bag number:', error);
            return null;
        }
    },

    // Reveal a wine
    async revealWine(eventId, wineId) {
        try {
            await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .doc(wineId)
                .update({
                    revealed: true,
                    revealedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
        } catch (error) {
            console.error('Error revealing wine:', error);
            throw new Error('Failed to reveal wine.');
        }
    },

    // Reveal all wines
    async revealAllWines(eventId) {
        const wines = await this.getWines(eventId);
        const batch = db.batch();

        for (const wine of wines) {
            const wineRef = db.collection('events')
                .doc(eventId)
                .collection('wines')
                .doc(wine.id);

            batch.update(wineRef, {
                revealed: true,
                revealedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        await batch.commit();
    },

    // Delete user's wine
    async deleteUserWine(eventId) {
        const user = WineClubAuth.currentUser;
        if (!user) throw new Error('Not authenticated');

        const wine = await this.getUserWine(eventId, user.uid);
        if (!wine) return;

        try {
            await db.collection('events')
                .doc(eventId)
                .collection('wines')
                .doc(wine.id)
                .delete();
        } catch (error) {
            console.error('Error deleting wine:', error);
            throw new Error('Failed to delete wine.');
        }
    }
};

// Export for use in other modules
window.WineManager = WineManager;
