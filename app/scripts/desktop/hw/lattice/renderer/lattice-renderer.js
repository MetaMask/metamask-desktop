/* eslint-disable import/unambiguous */
let listenInterval;

function receiveMessage(event) {
  try {
    // Stop the listener
    clearInterval(listenInterval);
    // Parse and return credentials
    const creds = JSON.parse(event.data);
    if (!creds.deviceID || !creds.password) {
      window.latticeApi.openWindowResponse({
        error: 'Invalid credentials returned from Lattice',
      });
    }
    window.latticeApi.openWindowResponse({ result: creds });
  } catch (err) {
    window.latticeApi.openWindowResponse({ error: 'Invalid response' });
  }
}

window.latticeApi.openWindowSetup((payload) => {
  const response = window.open(payload, '_blank', 'width=1200,height=700');

  window.addEventListener('message', receiveMessage, false);

  listenInterval = setInterval(() => {
    if (response.closed) {
      clearInterval(listenInterval);
      window.latticeApi.openWindowResponse({
        error: 'Lattice connector closed',
      });
    }
  }, 500);
});
