const admin = require('firebase-admin');
const serviceAccount = require('./backend/serviceAccountKey.json'); // Assumed path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
db.collection('users').get().then(snapshot => {
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
