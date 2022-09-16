declare module 'obj-multiplex' {
  type Duplex = import('stream').Duplex;

  // Required for type to include Duplex properties and methods
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ObjectMultiplex extends Duplex {}

  class ObjectMultiplex {
    public _substreams: { [name: string | number]: Duplex };

    createStream(name: string | number): Duplex;
  }

  export = ObjectMultiplex;
}
