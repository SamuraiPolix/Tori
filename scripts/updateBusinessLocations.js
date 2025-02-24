const FirebaseApi = require('../src/utils/FirebaseApi').default;

console.log('Starting business location update...');

FirebaseApi.updateBusinessesWithoutLocation()
  .then(result => {
    console.log('Update completed successfully:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Update failed:', error);
    process.exit(1);
  });
