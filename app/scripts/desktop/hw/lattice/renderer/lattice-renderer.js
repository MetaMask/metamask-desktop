/* eslint-disable import/unambiguous */
let listenInterval;

function receiveMessage(event) {
  try {
    // Stop the listener
    clearInterval(listenInterval);
    // Parse and return credentials
    const creds = JSON.parse(event.data);
    if (!creds.deviceID || !creds.password) {
      window.latticeApi.sendCredentialsResponse({
        error: 'Invalid credentials returned from Lattice',
      });
    }
    window.latticeApi.sendCredentialsResponse({ result: creds });
  } catch (err) {
    window.latticeApi.sendCredentialsResponse({ error: 'Invalid response' });
  }
}

window.latticeApi.addCredentialsListener((payload) => {
  const response = window.open(payload, '_blank', 'width=1200,height=700');

  window.addEventListener('message', receiveMessage, false);

  listenInterval = setInterval(() => {
    if (response && response.closed) {
      clearInterval(listenInterval);
      window.latticeApi.sendCredentialsResponse({
        error: 'Lattice connector closed',
      });
    }
  }, 500);
});
