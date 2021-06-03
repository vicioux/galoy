import { AuthenticatedLnd, authenticatedLndGrpc } from 'lightning';
import _ from "lodash";
import { exit } from "process";

export type nodeType = "offchain" | "onchain"

interface ILndParams {
  cert: string;
  macaroon: string;
  node: string;
  port: string | number;
  type: nodeType[];
  pubkey: string | undefined;
}

export interface ILndParamsAuthed extends ILndParams {
  lnd: AuthenticatedLnd,
  socket: string;
  active: boolean,
}

export interface ILndParamsLightningAuthed extends ILndParamsAuthed {
  pubkey: string
}

export const inputs: ILndParams[] = [{
  cert: process.env.LND_1_TLS || exit(1),
  macaroon: process.env.LND_1_MACAROON || exit(1),
  node: process.env.LND_1_DNS || exit(1),
  port: process.env.LND_1_RPCPORT ?? 10009,
  type: ["offchain"],
  pubkey: process.env.LND_1_PUBKEY,
},
{
  cert: process.env.LND_2_TLS || exit(1),
  macaroon: process.env.LND_2_MACAROON || exit(1),
  node: process.env.LND_2_DNS || exit(1),
  port: process.env.LND_2_RPCPORT ?? 10009,
  type: ["offchain"],
  pubkey: process.env.LND_2_PUBKEY,
},
{
  cert: process.env.LND_ONCHAIN_TLS || exit(1),
  macaroon: process.env.LND_ONCHAIN_MACAROON || exit(1),
  node: process.env.LND_ONCHAIN_DNS || exit(1),
  port: process.env.LND_ONCHAIN_RPCPORT ?? 10009,
  type: ["onchain"],
  pubkey: undefined,
}]

// FIXME
const isTrigger = require.main!.filename.indexOf("trigger") !== -1

export const addProps = (array) => array.map(input => {
  const socket = `${input.node}:${input.port}`
  return {
    ...input,
    socket,
    lnd: authenticatedLndGrpc({...input, socket}).lnd,

    // FIXME: should be inactive first
    // find a way to mock this up for jest
    // for now only trigger is active = false at start 
    // because trigger will start listening to lnd event on lnd start/restart
    active: !isTrigger,
  }
})

export const params = addProps(inputs)

export const TIMEOUT_PAYMENT = process.env.NETWORK !== "regtest" ? 45000 : 3000
export const FEECAP = 0.02 // = 2%
export const FEEMIN = 10 // sats