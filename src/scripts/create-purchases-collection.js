/*
 * This script shows how to create the purchases collection in Appwrite
 * You can run this in the Appwrite console or use the Node.js SDK
 * 
 * Steps:
 * 1. Create a collection named 'purchases'
 * 2. Add the following attributes:
 *    - userId (string, required)
 *    - videoId (string, required)
 *    - purchaseDate (datetime, required)
 *    - amount (number, required)
 * 3. Create indexes for faster lookups
 */

// Collection structure
const purchasesCollection = {
  databaseId: '681f818100229727cfc0',
  collectionId: 'purchases',
  name: 'Video Purchases',
  attributes: [
    {
      key: 'userId',
      type: 'string',
      size: 255,
      required: true
    },
    {
      key: 'videoId',
      type: 'string',
      size: 255,
      required: true
    },
    {
      key: 'purchaseDate',
      type: 'datetime',
      required: true
    },
    {
      key: 'amount',
      type: 'double',
      required: true
    }
  ],
  indexes: [
    {
      key: 'userId_index',
      type: 'key',
      attributes: ['userId']
    },
    {
      key: 'videoId_index',
      type: 'key',
      attributes: ['videoId']
    },
    {
      key: 'userId_videoId_index',
      type: 'key',
      attributes: ['userId', 'videoId']
    }
  ]
};

// Example using the Appwrite SDK (Node.js)
/*
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('681f80fb0002d0579432')
  .setKey('YOUR_API_KEY');

const databases = new Databases(client);

// Create the collection
async function createPurchasesCollection() {
  try {
    // Create collection
    const collection = await databases.createCollection(
      purchasesCollection.databaseId,
      purchasesCollection.collectionId,
      purchasesCollection.name
    );
    
    console.log('Collection created:', collection);
    
    // Create attributes
    for (const attr of purchasesCollection.attributes) {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          purchasesCollection.databaseId,
          purchasesCollection.collectionId,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          purchasesCollection.databaseId,
          purchasesCollection.collectionId,
          attr.key,
          attr.required
        );
      } else if (attr.type === 'double') {
        await databases.createFloatAttribute(
          purchasesCollection.databaseId,
          purchasesCollection.collectionId,
          attr.key,
          attr.required
        );
      }
      
      console.log(`Attribute ${attr.key} created`);
    }
    
    // Create indexes
    for (const index of purchasesCollection.indexes) {
      await databases.createIndex(
        purchasesCollection.databaseId,
        purchasesCollection.collectionId,
        index.key,
        index.type,
        index.attributes
      );
      
      console.log(`Index ${index.key} created`);
    }
    
    console.log('Purchases collection setup complete!');
  } catch (error) {
    console.error('Error creating purchases collection:', error);
  }
}

createPurchasesCollection();
*/ 