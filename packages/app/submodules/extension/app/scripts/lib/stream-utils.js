import ObjectMultiplex from 'obj-multiplex';
import pump from 'pump';

/**
 * Sets up stream multiplexing for the given stream
 *
 * @param {any} connectionStream - the stream to mux
 * @returns {stream.Stream} the multiplexed stream
 */
export function setupMultiplex(connectionStream) {
  const mux = new ObjectMultiplex();
  /**
   * We are using this streams to send keep alive message between backend/ui without setting up a multiplexer
   * We need to tell the multiplexer to ignore them, else we get the " orphaned data for stream " warnings
   * https://github.com/MetaMask/object-multiplex/blob/280385401de84f57ef57054d92cfeb8361ef2680/src/ObjectMultiplex.ts#L63
   */
  mux.ignoreStream('CONNECTION_READY');
  mux.ignoreStream('ACK_KEEP_ALIVE_MESSAGE');
  mux.ignoreStream('WORKER_KEEP_ALIVE_MESSAGE');
  pump(connectionStream, mux, connectionStream, (err) => {
    if (err) {
      console.error(err);
    }
  });
  return mux;
}
