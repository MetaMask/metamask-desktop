import path from 'path';
import EventEmitter from 'events';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { ObservableStore } from '@metamask/obs-store';
import { spawn } from 'cross-spawn';

const NODE_START_WAIT_MS = 5000;
enum NETWORKS {
  goerli = 'goerli',
  mainnet = 'mainnet',
}

enum CHAIN_ID {
  goerli = '0x5',
  mainnet = '0x1',
}

type LightNodeProps = {
  rpcUrl: string;
  chainId: string;
  ticker: string;
  nickname: string;
  rpcPrefs: Record<string, unknown>;
};

export enum LIGHT_NODE_EVENTS {
  firstData = 'firstData',
  startedSuccessfully = 'startedSuccessfully',
  stopped = 'stopped',
}

export default class LightNodeController extends EventEmitter {
  private store: ObservableStore;

  private nodeState: 'stopping' | 'running' | 'starting' | 'stopped' | 'error';

  private node: ChildProcessWithoutNullStreams | null;

  private httpPort: 8646;

  public lightNodeProps?: LightNodeProps;

  constructor({ initState }: { initState: any }) {
    super();

    this.store = new ObservableStore({
      ligthNodeEnabled: false,
      lightNodeNetwork: undefined,
      ...initState,
    });

    this.node = null;
    this.nodeState = 'stopped';
    this.httpPort = 8646;
    this.lightNodeProps = undefined;
  }

  async init() {
    const state = this.store.getState();
    if (state.ligthNodeEnabled) {
      if (!state.lightNodeNetwork) {
        return;
      }

      await this.start(state.lightNodeNetwork as NETWORKS);
    }
  }

  public setLightNodeState(network?: NETWORKS) {
    if (network) {
      this.lightNodeProps = {
        rpcUrl: `http://localhost:${this.httpPort}`,
        chainId:
          network === NETWORKS.goerli ? CHAIN_ID.goerli : CHAIN_ID.mainnet,
        ticker: network === NETWORKS.goerli ? 'goerliETH' : 'ETH',
        nickname:
          network === NETWORKS.goerli
            ? 'Goerli Light node'
            : 'Mainnet Light node',
        rpcPrefs: {},
      };

      this.store.updateState({
        ligthNodeEnabled: true,
        lightNodeNetwork: network,
      });

      return;
    }

    this.store.updateState({
      ligthNodeEnabled: false,
      lightNodeNetwork: undefined,
    });
  }

  private getBinaryPath() {
    return path.join(
      process.cwd(),
      '/eth-clients/geth-darwin-amd64-1.10.26-e5eb32ac',
      'geth',
    );
  }

  public async stop() {
    await this.stopNode();

    this.setLightNodeState();
    this.emit(LIGHT_NODE_EVENTS.stopped);
  }

  private async stopNode() {
    if (['stopped', 'stopping'].includes(this.nodeState)) {
      return;
    }

    if (!this.node) {
      return;
    }

    this.nodeState = 'stopping';

    this.node.stderr.removeAllListeners('data');
    this.node.stdout.removeAllListeners('data');
    this.node.stdin.removeAllListeners('error');
    this.node.removeAllListeners('error');
    this.node.removeAllListeners('exit');

    this.node.kill('SIGINT');

    const killPromise = new Promise<void>((resolve, _reject) => {
      const killTimeout = setTimeout(() => {
        if (this.node) {
          this.node.kill('SIGKILL');
        }
      }, 8000 /* 8 seconds */);

      this.node?.once('close', () => {
        clearTimeout(killTimeout);

        this.node = null;
        resolve();
      });
    });

    await killPromise;
  }

  public async start(network: NETWORKS) {
    console.log(`Start geth light node: ${network}`);

    if (network === 'goerli') {
      console.log('Node will connect to the test network');
    }

    this.node = await this.startNode(network);
    console.log(`Started geth light node: ${network}`);
    this.nodeState = 'running';

    this.setLightNodeState(network);
    this.emit(LIGHT_NODE_EVENTS.startedSuccessfully, this.lightNodeProps);
  }

  private async startNode(network: NETWORKS) {
    this.nodeState = 'starting';

    const binPath = this.getBinaryPath();

    console.log(`Start node using ${binPath}`);

    return await this.startProcess(binPath, network);
  }

  private startProcess(binPath: string, network: NETWORKS) {
    return new Promise<ChildProcessWithoutNullStreams>((resolve, reject) => {
      let args;
      const commonArgs = [
        '--syncmode',
        'light',
        '--cache',
        '2048',
        '--http',
        '--http.port',
        this.httpPort.toString(),
      ];

      switch (network) {
        // Starts Rinkeby network
        case NETWORKS.goerli:
          args = ['--goerli', ...commonArgs];
          break;

        // Starts Main net
        default:
          args = ['--mainnet', ...commonArgs];
      }

      console.log('Spawn', binPath, args);

      const proc = spawn(binPath, args);

      proc.once('error', (error) => {
        if (this.nodeState === 'starting') {
          this.nodeState = 'error';

          console.error('Node startup error', error);

          reject(error);
        }
      });

      proc.stdout.on('data', (data) => {
        console.log('Got stdout data', data.toString());
        this.emit(LIGHT_NODE_EVENTS.firstData, data);
      });

      proc.stderr.on('data', (data) => {
        console.log('Got stderr data', data.toString());
      });

      // when data is first received
      this.once(LIGHT_NODE_EVENTS.firstData, () => {
        // We wait a short while before marking startup as successful
        // because we may want to parse the initial node output for
        // errors, etc (see geth port-binding error above)

        setTimeout(() => {
          if (this.nodeState === 'starting') {
            console.log(
              `${NODE_START_WAIT_MS}ms elapsed, assuming node started up successfully`,
            );
            resolve(proc);
          }
        }, NODE_START_WAIT_MS);
      });
    });
  }
}
