#!/usr/bin/env node
/*
  Migration: Rename legacy fields bedrooms/bathrooms to CustomFieldOne/CustomFieldTwo
  - Copies values from bedrooms -> CustomFieldOne when CF1 is empty
  - Copies values from bathrooms -> CustomFieldTwo when CF2 is empty
  - Removes legacy fields from documents
*/

const { connectToDatabase, mongoose } = require('../backend/database/mongodb');
const Property = require('../backend/models/Property');

async function migrate() {
  await connectToDatabase();
  const session = await mongoose.startSession();
  session.startTransaction();
  let updatedCount = 0;
  try {
    const cursor = Property.find({ $or: [{ bedrooms: { $exists: true } }, { bathrooms: { $exists: true } }] }).cursor();
    for await (const doc of cursor) {
      const update = {};
      const unset = {};
      if (doc.bedrooms !== undefined && (doc.CustomFieldOne === undefined || doc.CustomFieldOne === null || doc.CustomFieldOne === '')) {
        update.CustomFieldOne = doc.bedrooms;
      }
      if (doc.bathrooms !== undefined && (doc.CustomFieldTwo === undefined || doc.CustomFieldTwo === null || doc.CustomFieldTwo === '')) {
        update.CustomFieldTwo = doc.bathrooms;
      }
      if (doc.bedrooms !== undefined) unset.bedrooms = '';
      if (doc.bathrooms !== undefined) unset.bathrooms = '';

      if (Object.keys(update).length > 0 || Object.keys(unset).length > 0) {
        await Property.updateOne({ _id: doc._id }, { ...(Object.keys(update).length ? { $set: update } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) }).session(session);
        updatedCount++;
      }
    }

    await session.commitTransaction();
    console.log(`✅ Migration complete. Documents updated: ${updatedCount}`);
  } catch (err) {
    await session.abortTransaction();
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    session.endSession();
    await mongoose.connection.close();
  }
}

migrate();


