import {openDB} from 'idb';

async function createStoreInDB () {
  const dbPromise = await openDB('videos-database', 1, {
    upgrade (db) {
      console.log('Creating a new object store...');
      // Creates an object store: 
       // Checks if the object store exists:
      if (!db.objectStoreNames.contains('videos')) {
        // If the object store does not exist, create it:
       const videoObjectStore = db.createObjectStore('videos', {keyPath: "id", autoIncrement: true});
       videoObjectStore.createIndex('indexName', 'property', options);
      }
    }
  });
}

createStoreInDB();

async function createIndexInStore() {
  const dbPromise = await openDB('videos-database', 1, {
    upgrade (db) {
      const objectStore = db.createObjectStore('videos');

      objectStore.createIndex('titulo', 'titulo', {unique: false});
    }
  });
}

createIndexInStore();

async function addVideoToDB () {
  const db = await openDB('videos-database', 1);
  const tx = db.transaction('videos', 'readwrite');

  await Promise.all([
    tx.store.add('videos', {
    titulo: 'titulo',
    url: 'url',
    id: id
  }),
  tx.done
  ])
}
addVideoToDB();


async function getVideoInVideos () {
  const db = await openDB('videos-database', 1);

  // Get a value from the object store by its primary key value:
  const video = await db.get('videos', 'id');
  console.dir(video);
}
getVideoInVideos();


async function updateVideoInVideos () {
  const db = await openDB('videos-database', 1);
  
  // Create a transaction on the 'foods' store in read/write mode:
  const tx = db.transaction('videos', 'readwrite');

  // Update multiple items in the 'foods' store in a single transaction:
  await Promise.all([
    tx.store.put({
      titulo: 'titulo',
      url: 'url',
      updated: new id // This creates a new field
    }),
      tx.done
  ])
}
updateVideoInVideos();


async function deleteItemFromStore () {
  const db = await openDB('videos-database', 1);

  // Delete a value 
  await db.delete('videos', 'id');
}
deleteItemFromStore();